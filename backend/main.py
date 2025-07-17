from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import openai
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime
import io

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS for your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

@app.get("/")
async def root():
    return {"message": "Kaive AI Backend Running"}

@app.post("/upload")
async def upload_excel(file: UploadFile):
    try:
        # Check file type
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(400, "Please upload an Excel file")
        
        # Read file content
        contents = await file.read()
        
        # Save to Supabase Storage
        file_path = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        storage_response = supabase.storage.from_("excel-files").upload(
            file_path,
            contents
        )
        
        # Create file record
        file_record = supabase.table('uploaded_files').insert({
            'filename': file.filename,
            'status': 'processing'
        }).execute()
        
        # Read Excel file
        # Read file based on extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = ['postContent', 'author']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(400, f"Excel must contain columns: {required_columns}")
        
        # Process each post
        processed_count = 0
        for index, row in df.iterrows():
            try:
                # Skip empty posts
                if pd.isna(row['postContent']) or not str(row['postContent']).strip():
                    continue
                
                # Clean the content
                content = str(row['postContent']).strip()
                
                # Generate embedding
                response = openai.embeddings.create(
                    input=content,
                    model="text-embedding-3-small"
                )
                embedding = response.data[0].embedding
                
                # Prepare data for insertion
                post_data = {
                    'author': str(row['author']),
                    'post_content': content,
                    'embedding': embedding
                }
                
                # Add optional fields if they exist
                if 'postDate' in row and pd.notna(row['postDate']):
                    post_data['post_date'] = pd.to_datetime(row['postDate']).strftime('%Y-%m-%d')
                if 'likeCount' in row and pd.notna(row['likeCount']):
                    post_data['like_count'] = int(row['likeCount'])
                if 'commentCount' in row and pd.notna(row['commentCount']):
                    post_data['comment_count'] = int(row['commentCount'])
                if 'postUrl' in row and pd.notna(row['postUrl']):
                    post_data['post_url'] = str(row['postUrl'])
                
                # Insert into database
                supabase.table('creator_posts').insert(post_data).execute()
                processed_count += 1
                
            except Exception as e:
                print(f"Error processing row {index}: {str(e)}")
                continue
        
        # Update file status
        supabase.table('uploaded_files').update({
            'status': 'completed',
            'total_posts': processed_count
        }).eq('id', file_record.data[0]['id']).execute()
        
        return {
            "status": "success",
            "filename": file.filename,
            "processed_posts": processed_count,
            "total_rows": len(df)
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error processing file: {str(e)}")

@app.get("/stats")
async def get_stats():
    """Get statistics about the data"""
    try:
        # Get total posts
        posts_count = supabase.table('creator_posts').select('id', count='exact').execute()
        
        # Get unique authors
        authors = supabase.table('creator_posts').select('author').execute()
        unique_authors = len(set(post['author'] for post in authors.data))
        
        # Get processed files
        files = supabase.table('uploaded_files').select('*').execute()
        
        return {
            "total_posts": posts_count.count,
            "unique_authors": unique_authors,
            "files_processed": len(files.data)
        }
    except Exception as e:
        raise HTTPException(500, f"Error getting stats: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
