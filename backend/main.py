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

async def should_recluster(creator: str, new_post_count: int) -> bool:
    """
    Determine if we should recluster all posts or just cluster new ones
    """
    try:
        # Get current post count for creator
        response = supabase.table('creator_posts') \
            .select('id', count='exact') \
            .eq('author', creator) \
            .execute()
        
        total_posts = response.count
        
        # Recluster if:
        # 1. Creator has < 20 posts (small dataset benefits from full reclustering)
        # 2. New posts are > 30% of total (significant change)
        # 3. No clusters exist yet
        
        if total_posts < 20:
            return True
            
        if new_post_count / total_posts > 0.3:
            return True
            
        # Check if clusters exist
        cluster_check = supabase.table('creator_posts') \
            .select('cluster_id') \
            .eq('author', creator) \
            .not_.is_('cluster_id', 'null') \
            .limit(1) \
            .execute()
            
        if not cluster_check.data:
            return True
            
        return False
        
    except Exception as e:
        logger.error(f"Error in should_recluster: {e}")
        return True  # Default to reclustering on error

async def recluster_creator(creator: str):
    """
    Recluster all posts for a creator
    """
    try:
        # Get all posts with embeddings
        response = supabase.table('creator_posts') \
            .select('id, embedding') \
            .eq('author', creator) \
            .execute()
        
        post_ids = []
        embeddings = []
        
        for post in response.data:
            if post.get('embedding'):
                post_ids.append(post['id'])
                if isinstance(post['embedding'], str):
                    embeddings.append(json.loads(post['embedding']))
                else:
                    embeddings.append(post['embedding'])
        
        if embeddings:
            processor = OptimizedProcessor()
            await cluster_creator_optimized(creator, post_ids, embeddings, processor)
            
    except Exception as e:
        logger.error(f"Error in recluster_creator: {e}")

async def cluster_creator_optimized(creator: str, post_ids: List[int], embeddings: List[List[float]], processor):
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

async def deduplicate_posts(posts_to_insert: List[Dict], texts_for_embedding: List[str]) -> Tuple[Dict, int]:
    """
    Deduplicate posts against existing database content
    Returns: (unique_posts_dict, duplicate_count)
    """
    # Group posts by author for efficient checking
    posts_by_author = defaultdict(list)
    for i, post in enumerate(posts_to_insert):
        posts_by_author[post['author']].append((i, post))
    
    unique_posts = []
    unique_texts = []
    duplicate_count = 0
    
    # Check each author's posts
    for author, author_posts in posts_by_author.items():
        # Get existing posts for this author
        existing_response = supabase.table('creator_posts') \
            .select('post_content, post_url') \
            .eq('author', author) \
            .execute()
        
        # Create a set of existing content for fast lookup
        # Use first 200 chars for comparison to handle minor edits
        existing_content = {
            post['post_content'][:200]: post 
            for post in existing_response.data
        }
        
        existing_urls = {
            post.get('post_url') 
            for post in existing_response.data 
            if post.get('post_url')
        }
        
        # Check each post
        for idx, post in author_posts:
            content_key = post['post_content'][:200]
            post_url = post.get('post_url')
            
            # Check if duplicate by content or URL
            is_duplicate = (
                content_key in existing_content or 
                (post_url and post_url in existing_urls)
            )
            
            if is_duplicate:
                duplicate_count += 1
                logger.debug(f"Skipping duplicate post for {author}")
            else:
                unique_posts.append(post)
                unique_texts.append(texts_for_embedding[idx])
                # Add to existing set to catch duplicates within the same file
                existing_content[content_key] = post
                if post_url:
                    existing_urls.add(post_url)
    
    return {'posts': unique_posts, 'texts': unique_texts}, duplicate_count

async def process_file_optimized(contents: bytes, filename: str, file_record_id: str):
    """Optimized file processing pipeline with deduplication"""
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
        
        # 4. DEDUPLICATION - Check for existing posts
        unique_posts, existing_count = await deduplicate_posts(posts_to_insert, texts_for_embedding)
        posts_to_insert = unique_posts['posts']
        texts_for_embedding = unique_posts['texts']
        
        logger.info(f"Found {existing_count} duplicate posts, processing {len(posts_to_insert)} new posts")
        
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
        
        # UPDATE STATUS: Posts saved
        supabase.table('uploaded_files').update({
            'status': 'posts_saved',
            'total_posts': len(inserted_ids),
            'new_posts': len(inserted_ids),
            'duplicate_posts': existing_count
        }).eq('id', file_record_id).execute()
        
        # 6. Cluster by creator
        creators_data = defaultdict(lambda: {'ids': [], 'embeddings': []})
        
        for post_id, post, embedding in zip(inserted_ids, posts_to_insert, embeddings):
            if embedding:
                creators_data[post['author']]['ids'].append(post_id)
                creators_data[post['author']]['embeddings'].append(embedding)
        
        # 7. Smart clustering strategy with ENHANCED DEBUGGING
        voice_profiles_created = 0
        
        # Get all unique creators from the file (not just new posts)
        all_creators = set([post['author'] for post in posts_to_insert])
        logger.info(f"Found {len(all_creators)} unique creators in file")
        
        for creator in all_creators:
            logger.info(f"Processing creator: {creator}")
            
            # Check if we have new data for this creator
            creator_has_new_data = creator in creators_data
            new_count = len(creators_data.get(creator, {}).get('ids', []))
            
            logger.info(f"  - Has new data: {creator_has_new_data}")
            logger.info(f"  - New post count: {new_count}")
            
            # Always process voice profiles for creators in the file
            try:
                if creator_has_new_data and new_count > 0:
                    # New posts - decide on clustering strategy
                    if await should_recluster(creator, new_count):
                        logger.info(f"  - Reclustering ALL posts for {creator}")
                        await recluster_creator(creator)
                    else:
                        logger.info(f"  - Clustering only NEW posts for {creator}")
                        data = creators_data[creator]
                        await cluster_creator_optimized(creator, data['ids'], data['embeddings'], processor)
                else:
                    # No new posts but creator exists in file - ensure they have profiles
                    logger.info(f"  - No new posts for {creator}, checking if profiles exist")
                    
                    # Check if creator has posts in database
                    check_response = supabase.table('creator_posts') \
                        .select('id', count='exact') \
                        .eq('author', creator) \
                        .execute()
                    
                    if check_response.count > 0:
                        logger.info(f"  - Found {check_response.count} existing posts for {creator}")
                        # Check if voice profiles exist
                        profile_check = supabase.table('creator_voice_profiles') \
                            .select('id', count='exact') \
                            .eq('creator', creator) \
                            .execute()
                        
                        if profile_check.count == 0:
                            logger.info(f"  - No voice profiles found, triggering generation")
                            await recluster_creator(creator)
                        else:
                            logger.info(f"  - Voice profiles already exist ({profile_check.count} profiles)")
                            continue
                    else:
                        logger.info(f"  - No posts found for {creator} in database")
                        continue
                
                # Generate voice profiles
                logger.info(f"Starting voice profile generation for {creator}...")
                logger.info(f"  - Current working directory: {os.getcwd()}")
                logger.info(f"  - Python path: {sys.path}")
                
                # Check if function is imported correctly
                logger.info(f"  - Function exists: {generate_voice_profiles_after_clustering}")
                logger.info(f"  - Function module: {generate_voice_profiles_after_clustering.__module__}")
                
                result = await asyncio.get_event_loop().run_in_executor(
                    executor,
                    generate_voice_profiles_after_clustering,
                    creator
                )
                
                logger.info(f"✅ Voice profiles generated for {creator}: {result} profiles created")
                voice_profiles_created += result
                
                # UPDATE STATUS: Voice profiles created
                supabase.table('uploaded_files').update({
                    'status': 'completed',
                    'voice_profiles_count': voice_profiles_created
                }).eq('id', file_record_id).execute()
                
            except Exception as e:
                logger.error(f"❌ Voice profile generation FAILED for {creator}: {str(e)}")
                logger.error(f"  - Error type: {type(e).__name__}")
                import traceback
                logger.error(f"  - Full traceback:")
                logger.error(traceback.format_exc())
                
                # UPDATE STATUS: Voice profile failed
                supabase.table('uploaded_files').update({
                    'status': 'voice_profile_failed',
                    'error_message': str(e)
                }).eq('id', file_record_id).execute()
        
        elapsed = time.time() - start_time
        logger.info(f"✓ Processed {filename} in {elapsed:.2f} seconds")
        logger.info(f"  - New posts: {len(inserted_ids)}")
        logger.info(f"  - Duplicates skipped: {existing_count}")
        logger.info(f"  - Voice profiles created: {voice_profiles_created}")
        
        return len(inserted_ids)
        
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        
        # UPDATE STATUS: Failed
        supabase.table('uploaded_files').update({
            'status': 'failed',
            'error_message': str(e)
        }).eq('id', file_record_id).execute()
        raise

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
            .select('*') \
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
