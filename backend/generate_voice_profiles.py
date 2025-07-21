import re
from typing import Dict, List
import json
from supabase import create_client
import os
from dotenv import load_dotenv
import numpy as np
from datetime import datetime
import sys

# Load environment variables
load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def analyze_style_metrics(posts: List[Dict]) -> Dict:
    """Analyze basic style metrics for a group of posts."""
    
    total_words = 0
    total_sentences = 0
    total_line_breaks = 0
    total_em_dashes = 0
    total_ellipses = 0
    total_exclamations = 0
    total_questions = 0
    paragraph_counts = []
    
    for post in posts:
        content = post['post_content']
        
        # Word count
        words = len(content.split())
        total_words += words
        
        # Sentence count (basic - splits on .!?)
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if s.strip()]
        total_sentences += len(sentences)
        
        # Line breaks
        line_breaks = content.count('\n')
        total_line_breaks += line_breaks
        
        # Punctuation patterns
        total_em_dashes += content.count('—') + content.count('--')
        total_ellipses += content.count('...') + content.count('…')
        total_exclamations += content.count('!')
        total_questions += content.count('?')
        
        # Paragraph count
        paragraphs = content.split('\n\n')
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        paragraph_counts.append(len(paragraphs))
    
    # Calculate averages
    num_posts = len(posts)
    avg_words_per_sentence = total_words / total_sentences if total_sentences > 0 else 0
    line_breaks_per_100_words = (total_line_breaks / total_words * 100) if total_words > 0 else 0
    
    return {
        "avg_words_per_sentence": round(avg_words_per_sentence, 1),
        "line_breaks_per_100_words": round(line_breaks_per_100_words, 1),
        "em_dashes_per_100_words": round((total_em_dashes / total_words * 100), 2) if total_words > 0 else 0,
        "ellipses_per_100_words": round((total_ellipses / total_words * 100), 2) if total_words > 0 else 0,
        "exclamations_per_100_words": round((total_exclamations / total_words * 100), 2) if total_words > 0 else 0,
        "questions_per_100_words": round((total_questions / total_words * 100), 2) if total_words > 0 else 0,
        "avg_paragraphs_per_post": round(np.mean(paragraph_counts), 1) if paragraph_counts else 0,
        "avg_words_per_post": round(total_words / num_posts, 0) if num_posts > 0 else 0
    }

def calculate_engagement_metrics(posts: List[Dict]) -> Dict:
    """Calculate average engagement metrics for a group of posts."""
    
    if not posts:
        return {"avg_likes": 0, "avg_comments": 0, "avg_reposts": 0, "total_engagement": 0}
    
    likes = [p.get('like_count', 0) for p in posts]
    comments = [p.get('comment_count', 0) for p in posts]
    reposts = [p.get('repost_count', 0) for p in posts]
    
    return {
        "avg_likes": round(np.mean(likes), 0),
        "avg_comments": round(np.mean(comments), 0),
        "avg_reposts": round(np.mean(reposts), 0),
        "total_engagement": round(np.mean([l + c + r for l, c, r in zip(likes, comments, reposts)]), 0)
    }

def get_top_post_ids(posts: List[Dict], limit: int = 3) -> List[int]:
    """Get IDs of top performing posts by total engagement."""
    
    # Sort by total engagement
    sorted_posts = sorted(posts, 
                         key=lambda p: p.get('like_count', 0) + p.get('comment_count', 0) + p.get('repost_count', 0), 
                         reverse=True)
    
    return [p['id'] for p in sorted_posts[:limit]]

def determine_cluster_name(style_metrics: Dict, engagement: Dict) -> str:
    """Determine a descriptive name for the cluster based on its characteristics."""
    
    avg_words = style_metrics['avg_words_per_sentence']
    questions = style_metrics['questions_per_100_words']
    em_dashes = style_metrics['em_dashes_per_100_words']
    post_length = style_metrics['avg_words_per_post']
    
    # Simple heuristic for naming clusters
    if avg_words < 8 and questions > 0.5:
        return "Conversational & Interactive"
    elif post_length < 100:
        return "Quick Thoughts"
    elif em_dashes > 1:
        return "Reflective & Thoughtful"
    elif post_length > 200:
        return "Deep Dive & Educational"
    else:
        return "Balanced & Informative"

def generate_voice_profile_for_creator(creator: str):
    """Generate voice profiles for all clusters of a creator."""
    
    print(f"\nGenerating voice profiles for {creator}...")
    
    # Get all unique cluster IDs for this creator
    response = supabase.table("creator_posts") \
        .select("cluster_id") \
        .eq("author", creator) \
        .execute()
    
    cluster_ids = list(set([p['cluster_id'] for p in response.data if p['cluster_id'] is not None]))
    
    if not cluster_ids:
        print(f"No clustered posts found for {creator}")
        return
    
    profiles_created = 0
    
    for cluster_id in sorted(cluster_ids):
        # Fetch all posts for this cluster
        response = supabase.table("creator_posts") \
            .select("*") \
            .eq("author", creator) \
            .eq("cluster_id", cluster_id) \
            .execute()
        
        posts = response.data
        
        if not posts:
            continue
        
        # Analyze the cluster
        style_metrics = analyze_style_metrics(posts)
        engagement_metrics = calculate_engagement_metrics(posts)
        top_post_ids = get_top_post_ids(posts)
        cluster_name = determine_cluster_name(style_metrics, engagement_metrics)
        
        # Create voice schema
        voice_schema = {
            "line_style": {
                "avg_words_per_sentence": style_metrics["avg_words_per_sentence"],
                "line_breaks_per_100_words": style_metrics["line_breaks_per_100_words"]
            },
            "punctuation": {
                "em_dashes_per_100_words": style_metrics["em_dashes_per_100_words"],
                "ellipses_per_100_words": style_metrics["ellipses_per_100_words"],
                "questions_per_100_words": style_metrics["questions_per_100_words"],
                "exclamations_per_100_words": style_metrics["exclamations_per_100_words"]
            },
            "structure": {
                "avg_paragraphs_per_post": style_metrics["avg_paragraphs_per_post"],
                "avg_words_per_post": style_metrics["avg_words_per_post"]
            }
        }
        
        # Prepare the profile data
        profile_data = {
            "creator": creator,
            "cluster_id": cluster_id,
            "cluster_name": cluster_name,
            "voice_schema": voice_schema,
            "engagement": engagement_metrics,
            "post_characteristics": {
                "avg_word_count": style_metrics["avg_words_per_post"],
                "avg_paragraphs": style_metrics["avg_paragraphs_per_post"],
                "structure_type": "single-paragraph" if style_metrics["avg_paragraphs_per_post"] <= 1 else "multi-paragraph"
            },
            "top_post_ids": top_post_ids,
            "performance_rank": 0,  # Will update this after all clusters are analyzed
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Check if profile already exists
        existing = supabase.table("creator_voice_profiles") \
            .select("id") \
            .eq("creator", creator) \
            .eq("cluster_id", cluster_id) \
            .execute()
        
        if existing.data:
            # Update existing profile
            supabase.table("creator_voice_profiles") \
                .update(profile_data) \
                .eq("creator", creator) \
                .eq("cluster_id", cluster_id) \
                .execute()
            print(f"  Updated profile for Cluster {cluster_id} ({cluster_name})")
        else:
            # Insert new profile
            supabase.table("creator_voice_profiles") \
                .insert(profile_data) \
                .execute()
            print(f"  Created profile for Cluster {cluster_id} ({cluster_name})")
        
        profiles_created += 1
        
        # Print summary
        print(f"    - {len(posts)} posts analyzed")
        print(f"    - Avg sentence length: {style_metrics['avg_words_per_sentence']} words")
        print(f"    - Avg engagement: {engagement_metrics['total_engagement']}")
    
    # Update performance ranks based on engagement
    update_performance_ranks(creator)
    
    print(f"\nCompleted! Generated {profiles_created} voice profiles for {creator}")

def update_performance_ranks(creator: str):
    """Update performance ranks for all clusters of a creator based on engagement."""
    
    # Get all profiles for this creator
    response = supabase.table("creator_voice_profiles") \
        .select("cluster_id, engagement") \
        .eq("creator", creator) \
        .execute()
    
    if not response.data:
        return
    
    # Sort by total engagement
    sorted_profiles = sorted(response.data, 
                           key=lambda p: p['engagement'].get('total_engagement', 0), 
                           reverse=True)
    
    # Update ranks
    for rank, profile in enumerate(sorted_profiles, 1):
        supabase.table("creator_voice_profiles") \
            .update({"performance_rank": rank}) \
            .eq("creator", creator) \
            .eq("cluster_id", profile['cluster_id']) \
            .execute()

def generate_all_voice_profiles():
    """Generate voice profiles for all creators."""
    
    # Get all unique creators
    response = supabase.table("creator_posts") \
        .select("author") \
        .execute()
    
    creators = list(set([p['author'] for p in response.data]))
    print(f"Found {len(creators)} creators to process")
    
    for creator in creators:
        generate_voice_profile_for_creator(creator)

# Integration function for main.py
def generate_voice_profiles_after_clustering(creator: str):
    """Call this function after clustering to generate voice profiles."""
    try:
        generate_voice_profile_for_creator(creator)
    except Exception as e:
        print(f"Error generating voice profiles for {creator}: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python generate_voice_profiles.py 'Creator Name'  # Generate for specific creator")
        print("  python generate_voice_profiles.py --all           # Generate for all creators")
        sys.exit(1)
    
    if sys.argv[1] == "--all":
        generate_all_voice_profiles()
    else:
        creator_name = sys.argv[1]
        generate_voice_profile_for_creator(creator_name)
