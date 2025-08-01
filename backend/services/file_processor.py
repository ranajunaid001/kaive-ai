# services/file_processor.py
"""
File processing service for handling Excel and CSV uploads.
Extracted from main.py to improve modularity.
"""
import pandas as pd
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import io

from services.text_cleaner import clean_text

logger = logging.getLogger(__name__)


class FileProcessor:
    """Handles file upload processing, validation, and data preparation."""
    
    def __init__(self):
        self.required_columns = [
            'postContent', 'author', 'likeCount', 
            'commentCount', 'repostCount', 'postDate', 'postTimestamp'
        ]
    
    def read_file(self, contents: bytes, filename: str) -> pd.DataFrame:
        """Read CSV or Excel file and return DataFrame"""
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
        else:
            df = pd.read_excel(io.BytesIO(contents))
        return df
    
    def validate_columns(self, df: pd.DataFrame) -> None:
        """Validate that all required columns are present"""
        if not all(col in df.columns for col in self.required_columns):
            missing = [col for col in self.required_columns if col not in df.columns]
            raise ValueError(f"Missing required columns: {missing}")
        
        # Log if imgUrl/imgurl column is present
        if 'imgUrl' in df.columns:
            logger.info(f"Found imgUrl column")
        elif 'imgurl' in df.columns:
            logger.info(f"Found imgurl column")
    
    def prepare_post_data_batch(self, df: pd.DataFrame) -> Tuple[List[Dict], List[str]]:
        """Prepare all post data efficiently"""
        posts_to_insert = []
        texts_for_embedding = []
        
        # Vectorized operations on DataFrame
        df['clean_content'] = df['postContent'].apply(clean_text)
        df['clean_author'] = df['author'].apply(clean_text)
        
        # Filter valid posts
        valid_mask = (df['clean_content'].str.len() > 0) & (df['clean_author'].str.len() > 0)
        valid_df = df[valid_mask].copy()
        
        # Parse dates efficiently
        valid_df['post_date'] = pd.to_datetime(valid_df['postDate'], errors='coerce').fillna(datetime.now()).dt.strftime('%Y-%m-%d')
        
        # Fix for timestamp - apply isoformat to each value, not to the series
        valid_df['post_timestamp'] = pd.to_datetime(valid_df['postTimestamp'], errors='coerce').fillna(datetime.now()).apply(lambda x: x.isoformat())
        
        # Parse numeric fields
        for col, new_col in [('likeCount', 'like_count'), ('commentCount', 'comment_count'), ('repostCount', 'repost_count')]:
            valid_df[new_col] = pd.to_numeric(valid_df[col].astype(str).str.replace(',', ''), errors='coerce').fillna(0).astype(int)
        
        # Build post data
        for _, row in valid_df.iterrows():
            post_data = {
                'author': row['clean_author'],
                'post_content': row['clean_content'],
                'post_date': row['post_date'],
                'like_count': row['like_count'],
                'comment_count': row['comment_count'],
                'repost_count': row['repost_count'],
                'post_timestamp': row['post_timestamp']
            }
            
            if 'postUrl' in row and pd.notna(row['postUrl']):
                post_data['post_url'] = clean_text(row['postUrl'])
            
            # Handle imgUrl column - check both imgUrl and imgurl
            img_col = None
            if 'imgUrl' in row:
                img_col = 'imgUrl'
            elif 'imgurl' in row:
                img_col = 'imgurl'
                
            if img_col and pd.notna(row[img_col]) and str(row[img_col]).strip():
                post_data['imgurl'] = clean_text(str(row[img_col]))
            
            posts_to_insert.append(post_data)
            texts_for_embedding.append(row['clean_content'])
        
        return posts_to_insert, texts_for_embedding
    
    def get_all_creators_from_df(self, df: pd.DataFrame) -> set:
        """Extract all unique creators from the dataframe"""
        all_creators = set()
        for _, row in df.iterrows():
            author = clean_text(row.get('author', ''))
            if author:
                all_creators.add(author)
        return all_creators
    
    def standardize_post_keys(self, posts_to_insert: List[Dict]) -> List[Dict]:
        """Ensure all posts have the same structure before insert"""
        if not posts_to_insert:
            return posts_to_insert
            
        # Get all possible keys from all posts
        all_keys = set()
        for post in posts_to_insert:
            all_keys.update(post.keys())
        
        logger.info(f"All unique keys found: {all_keys}")
        
        # Make sure every post has every key (use None for missing)
        for post in posts_to_insert:
            for key in all_keys:
                if key not in post:
                    post[key] = None
        
        logger.info(f"Standardized all posts to have {len(all_keys)} keys")
        return posts_to_insert
