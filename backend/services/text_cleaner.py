#text_cleaner.py

"""
Text cleaning utilities for processing LinkedIn posts
"""
import pandas as pd
from functools import lru_cache

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
    return text

def clean_text(text):
    """Clean text with caching"""
    if pd.isna(text):
        return ""
    return clean_text_cached(str(text))
