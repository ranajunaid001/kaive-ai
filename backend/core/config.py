"""
Centralized configuration for the application.
All environment variables and constants in one place.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys and URLs
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Batch Processing Settings
BATCH_SIZE = 50
EMBEDDING_BATCH_SIZE = 50
DB_CHUNK_SIZE = 100

# Clustering Settings
DEFAULT_N_CLUSTERS = 4
CLUSTERING_MIN_POSTS = 20
RECLUSTER_THRESHOLD = 0.3

# Processing Settings
MAX_WORKERS = 4
POST_CONTENT_PREVIEW_LENGTH = 300

# Model Settings
EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-3.5-turbo"
