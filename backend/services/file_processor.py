#file_processor.py
"""
File processing service - handles Excel/CSV uploads
"""
import pandas as pd
import io
from typing import Tuple, List, Dict
import logging
from core.config import BATCH_SIZE

logger = logging.getLogger(__name__)

def read_file(contents: bytes, filename: str) -> pd.DataFrame:
    """Read Excel or CSV file into DataFrame"""
    if filename.endswith('.csv'):
        return pd.read_csv(io.BytesIO(contents), encoding='utf-8')
    else:
        return pd.read_excel(io.BytesIO(contents))

def validate_columns(df: pd.DataFrame) -> bool:
    """Check if required columns exist"""
    required = ['postContent', 'author', 'likeCount', 'commentCount', 'repostCount', 'postDate', 'postTimestamp']
    return all(col in df.columns for col in required)
