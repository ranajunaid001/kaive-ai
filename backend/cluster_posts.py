import numpy as np
from sklearn.cluster import KMeans
from supabase import create_client
import os
import sys
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def fetch_creator_posts(creator):
    """Fetch all posts with embeddings for the given creator."""
    response = supabase.table("creator_posts") \
        .select("id, post_content, embedding") \
        .eq("author", creator) \
        .execute()
    return response.data

def cluster_creator_posts(creator, n_clusters=4):
    """
    Cluster posts for a given creator into groups based on embedding similarity.
    
    Args:
        creator: The author name to cluster posts for
        n_clusters: Target number of clusters (default: 4)
    """
    posts = fetch_creator_posts(creator)
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
    
    print(f"Processing {len(valid_posts)} posts for clustering...")
    
    # Run KMeans only if we have more than 1 post
    if len(valid_posts) > 1:
        kmeans = KMeans(n_clusters=actual_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(embeddings)
    else:
        # If only 1 post, assign it to cluster 0
        clusters = [0]
    
    # Update each post's cluster_id in Supabase
    update_count = 0
    for post_id, cluster_id in zip(ids, clusters):
        try:
            supabase.table("creator_posts") \
                .update({"cluster_id": int(cluster_id)}) \
                .eq("id", post_id) \
                .execute()
            update_count += 1
        except Exception as e:
            print(f"Error updating post {post_id}: {e}")
    
    print(f"\nSuccessfully clustered {update_count} posts for {creator} into {actual_clusters} clusters.")
    
    # Show sample posts by cluster
    print("\nSample posts by cluster:")
    cluster_samples = {i: [] for i in range(actual_clusters)}
    for idx, cluster_id in enumerate(clusters):
        if len(cluster_samples[cluster_id]) < 2:  # only store 2 examples per cluster
            snippet = contents[idx][:150].replace("\n", " ") + "..."
            cluster_samples[cluster_id].append(snippet)
    
    for c_id, samples in cluster_samples.items():
        print(f"\nCluster {c_id}:")
        for s in samples:
            print(f"- {s}")

def cluster_all_creators():
    """Cluster posts for all creators in the database."""
    # Get all unique creators
    response = supabase.table("creator_posts") \
        .select("author") \
        .execute()
    
    creators = list(set([p['author'] for p in response.data]))
    print(f"Found {len(creators)} creators to process")
    
    for creator in creators:
        print(f"\n{'='*50}")
        print(f"Processing: {creator}")
        print(f"{'='*50}")
        cluster_creator_posts(creator)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python cluster_posts.py 'Creator Name'  # Cluster specific creator")
        print("  python cluster_posts.py --all           # Cluster all creators")
        sys.exit(1)
    
    if sys.argv[1] == "--all":
        cluster_all_creators()
    else:
        creator_name = sys.argv[1]
        cluster_creator_posts(creator_name)
