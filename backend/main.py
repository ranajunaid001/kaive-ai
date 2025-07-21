from fastapi import FastAPI, UploadFile, HTTPException
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

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS for your React app
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

def clean_text(text):
    """Clean special characters and fix encoding issues"""
    if pd.isna(text):
        return ""
    
    text = str(text)
    
    # Fix common encoding issues
    replacements = {
        'â€™': "'",
        'â€"': "–",
        'â€"': "—",
        'â€œ': '"',
        'â€': '"',
        'â€¦': '...',
        'Â': ' ',
        'â': "'",
        'ðŸ': '',  # Remove corrupted emojis
        'Ã©': 'é',
        'Ã¨': 'è',
        'Ã ': 'à',
        'Ã¢': 'â',
        'Ã´': 'ô',
        'Ã®': 'î',
        'Ã§': 'ç',
        'Ãª': 'ê',
        'Ã¹': 'ù',
        'Ã€': 'À',
        '\xa0': ' ',  # Non-breaking space
        '\u200b': '',  # Zero-width space
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Remove any remaining non-printable characters
    text = ''.join(char for char in text if char.isprintable() or char.isspace())
    
    # Clean up multiple spaces
    text = ' '.join(text.split())
    
    return text.strip()

def cluster_posts_for_creator(creator: str, n_clusters: int = 4):
    """Fetch posts for a creator, cluster by embedding, and update cluster_id."""
    try:
        response = supabase.table('creator_posts').select('id, embedding, post_content').eq('author', creator).execute()
        posts = response.data

        if not posts:
            print(f"No posts found for {creator}")
            return

        # Filter out posts without embeddings and convert string embeddings to arrays
        valid_posts = []
        for p in posts:
            if p.get('embedding'):
                try:
                    # Convert string to array if needed
                    if isinstance(p['embedding'], str):
                        p['embedding'] = json.loads(p['embedding'])
                    valid_posts.append(p)
                except Exception as e:
                    print(f"Error processing embedding for post {p['id']}: {e}")
                    continue
        
        if not valid_posts:
            print(f"No valid embeddings available for {creator}.")
            return
        
        # Adjust n_clusters if we have fewer posts
        actual_clusters = min(n_clusters, len(valid_posts))
        if actual_clusters < n_clusters:
            print(f"Note: Only {len(valid_posts)} posts available. Adjusting from {n_clusters} to {actual_clusters} clusters.")

        embeddings = np.array([p['embedding'] for p in valid_posts])
        ids = [p['id'] for p in valid_posts]
        contents = [p['post_content'] for p in valid_posts]

        # Run KMeans only if we have more than 1 post
        if len(valid_posts) > 1:
            kmeans = KMeans(n_clusters=actual_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(embeddings)
        else:
            # If only 1 post, assign it to cluster 0
            labels = [0]

        # Update each post's cluster_id in Supabase
        update_count = 0
        for post_id, cluster_id, content in zip(ids, labels, contents):
            try:
                supabase.table('creator_posts').update({'cluster_id': int(cluster_id)}).eq('id', post_id).execute()
                update_count += 1
                # Debug log for checking clustering results
                print(f"[Cluster {cluster_id}] {content[:80]}...")
            except Exception as e:
                print(f"Error updating post {post_id}: {e}")

        print(f"Clustered {update_count} posts for {creator} into {actual_clusters} clusters.")
    except Exception as e:
        print(f"Error clustering posts for {creator}: {str(e)}")

def cluster_all_creators_in_file(df: pd.DataFrame):
    """Cluster posts for all unique creators in the uploaded file."""
    try:
        unique_creators = df['author'].dropna().unique()
        print(f"Found {len(unique_creators)} unique creators in the file")
        
        for creator in unique_creators:
            creator = clean_text(creator)
            if creator:
                print(f"\nClustering posts for: {creator}")
                cluster_posts_for_creator(creator)
    except Exception as e:
        print(f"Error clustering creators: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Kaive AI Backend Running"}

@app.post("/upload")
async def upload_excel(file: UploadFile):
    try:
        # Check file type
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(400, "Please upload an Excel or CSV file")
        
        contents = await file.read()
        file_path = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        supabase.storage.from_("excel-files").upload(file_path, contents)
        
        file_record = supabase.table('uploaded_files').insert({
            'filename': file.filename,
            'status': 'processing'
        }).execute()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        required_columns = ['postContent', 'author', 'likeCount', 'commentCount', 'repostCount', 'postDate', 'postTimestamp']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(400, f"Excel must contain columns: {required_columns}")
        
        processed_count = 0
        for index, row in df.iterrows():
            try:
                if pd.isna(row['postContent']) or not str(row['postContent']).strip():
                    continue
                
                content = clean_text(row['postContent'])
                author = clean_text(row['author'])
                
                if not content:
                    continue
                
                try:
                    response = openai.embeddings.create(
                        input=content,
                        model="text-embedding-3-small"
                    )
                    embedding = response.data[0].embedding
                except Exception as e:
                    print(f"Error generating embedding for row {index}: {str(e)}")
                    embedding = None
                
                post_data = {
                    'author': author,
                    'post_content': content,
                }
                
                if embedding:
                    post_data['embedding'] = embedding
                
                if 'postDate' in row and pd.notna(row['postDate']):
                    try:
                        post_data['post_date'] = pd.to_datetime(row['postDate']).strftime('%Y-%m-%d')
                    except:
                        post_data['post_date'] = datetime.now().strftime('%Y-%m-%d')
                else:
                    post_data['post_date'] = datetime.now().strftime('%Y-%m-%d')
                
                if 'likeCount' in row and pd.notna(row['likeCount']):
                    try:
                        post_data['like_count'] = int(float(str(row['likeCount']).replace(',', '')))
                    except:
                        post_data['like_count'] = 0
                else:
                    post_data['like_count'] = 0
                
                if 'commentCount' in row and pd.notna(row['commentCount']):
                    try:
                        post_data['comment_count'] = int(float(str(row['commentCount']).replace(',', '')))
                    except:
                        post_data['comment_count'] = 0
                else:
                    post_data['comment_count'] = 0
                
                if 'repostCount' in row and pd.notna(row['repostCount']):
                    try:
                        post_data['repost_count'] = int(float(str(row['repostCount']).replace(',', '')))
                    except:
                        post_data['repost_count'] = 0
                else:
                    post_data['repost_count'] = 0
                
                if 'postTimestamp' in row and pd.notna(row['postTimestamp']):
                    try:
                        post_data['post_timestamp'] = pd.to_datetime(row['postTimestamp']).isoformat()
                    except:
                        post_data['post_timestamp'] = datetime.now().isoformat()
                else:
                    post_data['post_timestamp'] = datetime.now().isoformat()
                
                if 'postUrl' in row and pd.notna(row['postUrl']):
                    post_data['post_url'] = clean_text(row['postUrl'])
                
                supabase.table('creator_posts').insert(post_data).execute()
                processed_count += 1
                
            except Exception as e:
                print(f"Error processing row {index}: {str(e)}")
                continue
        
        supabase.table('uploaded_files').update({
            'status': 'completed',
            'total_posts': processed_count
        }).eq('id', file_record.data[0]['id']).execute()
        
        # Automatically cluster posts for ALL creators in the file after upload
        if processed_count > 0:
            cluster_all_creators_in_file(df)
        
        return {
            "status": "success",
            "filename": file.filename,
            "processed_posts": processed_count,
            "total_rows": len(df),
            "clusters_created": True if processed_count > 0 else False
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error processing file: {str(e)}")

@app.get("/stats")
async def get_stats():
    try:
        posts_count = supabase.table('creator_posts').select('id', count='exact').execute()
        authors = supabase.table('creator_posts').select('author').execute()
        unique_authors = len(set(post['author'] for post in authors.data))
        files = supabase.table('uploaded_files').select('*').execute()
        
        return {
            "total_posts": posts_count.count,
            "unique_authors": unique_authors,
            "files_processed": len(files.data)
        }
    except Exception as e:
        raise HTTPException(500, f"Error getting stats: {str(e)}")

# New endpoint to manually trigger clustering for a specific creator
@app.post("/cluster/{creator}")
async def cluster_creator(creator: str):
    try:
        cluster_posts_for_creator(creator)
        return {"status": "success", "message": f"Clustering completed for {creator}"}
    except Exception as e:
        raise HTTPException(500, f"Error clustering posts: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
