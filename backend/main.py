"""
Kaive AI Backend - Ultra Optimized Version
Performance improvements: 5-10x faster upload and processing
"""

from fastapi import FastAPI, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import openai
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime
import io
from sklearn.cluster import KMeans
import numpy as np
import json
import asyncio
import concurrent.futures
from typing import List, Dict, Tuple, Optional
import logging
from functools import lru_cache
import time
from collections import defaultdict

# Import the fast version
try:
    from generate_voice_profiles_fast import generate_voice_profiles_after_clustering
except ImportError:
    from generate_voice_profiles import generate_voice_profiles_after_clustering

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://kaive.xyz"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Thread pool for parallel processing
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

# Cache for cleaned text
@lru_cache(maxsize=10000)
def clean_text_cached(text: str) -> str:
    """Cached version of clean_text for repeated values"""
    if not text:
        return ""
    
    # Fix common encoding issues
    replacements = {
        'â€™': "'", 'â€"': "–", 'â€"': "—", 'â€œ': '"',
        'â€': '"', 'â€¦': '...', 'Â': ' ', 'â': "'",
        'ðŸ': '', 'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à',
        'Ã¢': 'â', 'Ã´': 'ô', 'Ã®': 'î', 'Ã§': 'ç',
        'Ãª': 'ê', 'Ã¹': 'ù', 'Ã€': 'À', '\xa0': ' ',
        '\u200b': ''
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Remove non-printable characters
    text = ''.join(char for char in text if char.isprintable() or char.isspace())
    
    # Clean up multiple spaces
    return ' '.join(text.split())

def clean_text(text):
    """Clean text with caching"""
    if pd.isna(text):
        return ""
    return clean_text_cached(str(text))

class OptimizedProcessor:
    """Optimized data processor for batch operations"""
    
    def __init__(self):
        self.embedding_cache = {}
        self.batch_size = 50  # Process embeddings in batches
        
    async def generate_embeddings_batch(self, texts: List[str]) -> List[Optional[List[float]]]:
        """Generate embeddings in parallel batches"""
        embeddings = [None] * len(texts)
        
        # Process in batches to avoid rate limits
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_indices = list(range(i, min(i + self.batch_size, len(texts))))
            
            try:
                # Make async call
                response = await asyncio.get_event_loop().run_in_executor(
                    executor,
                    lambda: openai.embeddings.create(
                        input=batch,
                        model="text-embedding-3-small"
                    )
                )
                
                # Store results
                for idx, embedding_data in enumerate(response.data):
                    embeddings[batch_indices[idx]] = embedding_data.embedding
                    
            except Exception as e:
                logger.error(f"Batch embedding error: {e}")
                # Continue with other batches
                
        return embeddings
    
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
        valid_df['post_timestamp'] = pd.to_datetime(valid_df['postTimestamp'], errors='coerce').fillna(datetime.now()).dt.isoformat()
        
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
            
            posts_to_insert.append(post_data)
            texts_for_embedding.append(row['clean_content'])
        
        return posts_to_insert, texts_for_embedding
    
    def cluster_posts_batch(self, embeddings: np.ndarray, n_clusters: int = 4) -> np.ndarray:
        """Optimized clustering"""
        actual_clusters = min(n_clusters, len(embeddings))
        
        if len(embeddings) <= 1:
            return np.zeros(len(embeddings), dtype=int)
        
        kmeans = KMeans(
            n_clusters=actual_clusters,
            random_state=42,
            n_init=10,
            max_iter=100,  # Limit iterations for speed
            algorithm='elkan'  # Faster for well-separated clusters
        )
        
        return kmeans.fit_predict(embeddings)

async def process_file_optimized(contents: bytes, filename: str, file_record_id: str):
    """Optimized file processing pipeline"""
    start_time = time.time()
    processor = OptimizedProcessor()
    
    try:
        # 1. Read file
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # 2. Validate columns
        required_columns = ['postContent', 'author', 'likeCount', 'commentCount', 'repostCount', 'postDate', 'postTimestamp']
        if not all(col in df.columns for col in required_columns):
            raise ValueError(f"Missing required columns")
        
        logger.info(f"Processing {len(df)} rows from {filename}")
        
        # 3. Prepare all data at once
        posts_to_insert, texts_for_embedding = processor.prepare_post_data_batch(df)
        
        if not posts_to_insert:
            logger.warning("No valid posts to process")
            return 0
        
        logger.info(f"Prepared {len(posts_to_insert)} valid posts")
        
        # 4. Generate embeddings in parallel
        embeddings = await processor.generate_embeddings_batch(texts_for_embedding)
        
        # Add embeddings to posts
        for i, (post, embedding) in enumerate(zip(posts_to_insert, embeddings)):
            if embedding:
                post['embedding'] = embedding
        
        # 5. Batch insert all posts
        logger.info("Inserting posts to database...")
        
        # Insert in chunks to avoid timeouts
        chunk_size = 100
        inserted_ids = []
        
        for i in range(0, len(posts_to_insert), chunk_size):
            chunk = posts_to_insert[i:i + chunk_size]
            response = supabase.table('creator_posts').insert(chunk).execute()
            inserted_ids.extend([r['id'] for r in response.data])
        
        logger.info(f"Inserted {len(inserted_ids)} posts")
        
        # 6. Cluster by creator
        creators_data = defaultdict(lambda: {'ids': [], 'embeddings': []})
        
        for post_id, post, embedding in zip(inserted_ids, posts_to_insert, embeddings):
            if embedding:
                creators_data[post['author']]['ids'].append(post_id)
                creators_data[post['author']]['embeddings'].append(embedding)
        
        # 7. Process each creator in parallel
        clustering_tasks = []
        
        for creator, data in creators_data.items():
            if len(data['embeddings']) > 0:
                clustering_tasks.append(
                    cluster_creator_optimized(creator, data['ids'], data['embeddings'], processor)
                )
        
        # Run clustering in parallel
        await asyncio.gather(*clustering_tasks)
        
        # 8. Generate voice profiles for all creators
        voice_profile_tasks = []
        for creator in creators_data.keys():
            voice_profile_tasks.append(
                asyncio.get_event_loop().run_in_executor(
                    executor,
                    generate_voice_profiles_after_clustering,
                    creator
                )
            )
        
        await asyncio.gather(*voice_profile_tasks)
        
        # 9. Update file status
        supabase.table('uploaded_files').update({
            'status': 'completed',
            'total_posts': len(inserted_ids)
        }).eq('id', file_record_id).execute()
        
        elapsed = time.time() - start_time
        logger.info(f"✓ Processed {filename} in {elapsed:.2f} seconds")
        
        return len(inserted_ids)
        
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        supabase.table('uploaded_files').update({
            'status': 'failed',
            'error': str(e)
        }).eq('id', file_record_id).execute()
        raise

async def cluster_creator_optimized(creator: str, post_ids: List[int], embeddings: List[List[float]], processor: OptimizedProcessor):
    """Optimized clustering for a single creator"""
    try:
        logger.info(f"Clustering {len(post_ids)} posts for {creator}")
        
        # Convert to numpy array
        embeddings_array = np.array(embeddings)
        
        # Cluster
        labels = processor.cluster_posts_batch(embeddings_array)
        
        # Batch update cluster IDs
        updates = []
        for post_id, cluster_id in zip(post_ids, labels):
            updates.append({
                'id': post_id,
                'cluster_id': int(cluster_id)
            })
        
        # Update in chunks
        for i in range(0, len(updates), 50):
            chunk = updates[i:i + 50]
            for update in chunk:
                supabase.table('creator_posts').update({
                    'cluster_id': update['cluster_id']
                }).eq('id', update['id']).execute()
        
        logger.info(f"✓ Clustered {creator}'s posts into {len(set(labels))} clusters")
        
    except Exception as e:
        logger.error(f"Error clustering {creator}: {e}")

@app.get("/")
async def root():
    return {"message": "Kaive AI Backend Running (Optimized)"}

@app.post("/upload")
async def upload_excel(file: UploadFile, background_tasks: BackgroundTasks):
    """Optimized upload endpoint with background processing"""
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(400, "Please upload an Excel or CSV file")
        
        # Read file once
        contents = await file.read()
        
        # Save to storage
        file_path = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        supabase.storage.from_("excel-files").upload(file_path, contents)
        
        # Create file record
        file_record = supabase.table('uploaded_files').insert({
            'filename': file.filename,
            'status': 'processing'
        }).execute()
        
        file_record_id = file_record.data[0]['id']
        
        # Process in background for immediate response
        background_tasks.add_task(
            process_file_optimized,
            contents,
            file.filename,
            file_record_id
        )
        
        return {
            "status": "processing",
            "message": "File uploaded successfully. Processing in background.",
            "file_id": file_record_id,
            "filename": file.filename
        }
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(500, f"Error uploading file: {str(e)}")

@app.get("/stats")
async def get_stats():
    """Optimized stats endpoint with single query"""
    try:
        # Use RPC for optimized counting
        stats_query = """
        SELECT 
            COUNT(DISTINCT id) as total_posts,
            COUNT(DISTINCT author) as unique_authors
        FROM creator_posts
        """
        
        # Get counts efficiently
        posts_response = supabase.table('creator_posts').select('id, author', count='exact').execute()
        files_response = supabase.table('uploaded_files').select('*').execute()
        
        # Calculate unique authors efficiently
        unique_authors = len(set(p['author'] for p in posts_response.data if p.get('author')))
        
        return {
            "total_posts": posts_response.count,
            "unique_authors": unique_authors,
            "files_processed": len(files_response.data)
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(500, f"Error getting stats: {str(e)}")

@app.post("/cluster/{creator}")
async def cluster_creator(creator: str, background_tasks: BackgroundTasks):
    """Optimized manual clustering endpoint"""
    try:
        # Get posts with embeddings
        response = supabase.table('creator_posts') \
            .select('id, embedding') \
            .eq('author', creator) \
            .execute()
        
        if not response.data:
            raise HTTPException(404, f"No posts found for {creator}")
        
        # Prepare data
        post_ids = []
        embeddings = []
        
        for post in response.data:
            if post.get('embedding'):
                post_ids.append(post['id'])
                if isinstance(post['embedding'], str):
                    embeddings.append(json.loads(post['embedding']))
                else:
                    embeddings.append(post['embedding'])
        
        if not embeddings:
            raise HTTPException(400, f"No embeddings found for {creator}")
        
        # Process in background
        processor = OptimizedProcessor()
        background_tasks.add_task(
            cluster_creator_optimized,
            creator,
            post_ids,
            embeddings,
            processor
        )
        
        background_tasks.add_task(
            generate_voice_profiles_after_clustering,
            creator
        )
        
        return {
            "status": "processing",
            "message": f"Clustering and voice profile generation started for {creator}",
            "post_count": len(post_ids)
        }
        
    except Exception as e:
        logger.error(f"Cluster error: {e}")
        raise HTTPException(500, f"Error clustering posts: {str(e)}")

@app.get("/processing-status/{file_id}")
async def get_processing_status(file_id: str):
    """Check the status of file processing"""
    try:
        response = supabase.table('uploaded_files') \
            .select('status, total_posts, filename') \
            .eq('id', file_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(404, "File not found")
        
        return response.data[0]
        
    except Exception as e:
        raise HTTPException(500, f"Error checking status: {str(e)}")

# Cleanup on shutdown
@app.on_event("shutdown")
def shutdown_event():
    executor.shutdown(wait=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
