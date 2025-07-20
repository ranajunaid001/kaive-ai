import numpy as np
from sklearn.cluster import KMeans
from supabase import create_client
import os
import sys
from dotenv import load_dotenv

# Load environment variables (Supabase keys, etc.)
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
    posts = fetch_creator_posts(creator)
    if not posts:
        print(f"No posts found for {creator}")
        return

    # Filter out posts without embeddings
    embeddings = [p['embedding'] for p in posts if p.get('embedding')]
    ids = [p['id'] for p in posts if p.get('embedding')]
    contents = [p['post_content'] for p in posts if p.get('embedding')]

    if not embeddings:
        print(f"No embeddings available for {creator}.")
        return

    embeddings = np.array(embeddings)

    # Run KMeans to create 4 clusters
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(embeddings)

    # Update each post's cluster_id in Supabase
    for post_id, cluster_id in zip(ids, clusters):
        supabase.table("creator_posts") \
            .update({"cluster_id": int(cluster_id)}) \
            .eq("id", post_id) \
            .execute()

    print(f"Clustered {len(ids)} posts for {creator} into {n_clusters} clusters.")

    # Debug output: show 2 example snippets per cluster
    print("\nSample posts by cluster:")
    cluster_samples = {i: [] for i in range(n_clusters)}
    for idx, cluster_id in enumerate(clusters):
        if len(cluster_samples[cluster_id]) < 2:  # only store 2 examples per cluster
            snippet = contents[idx][:150].replace("\n", " ") + "..."
            cluster_samples[cluster_id].append(snippet)

    for c_id, samples in cluster_samples.items():
        print(f"\nCluster {c_id}:")
        for s in samples:
            print(f"- {s}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python cluster_posts.py 'Creator Name'")
        sys.exit(1)

    creator_name = sys.argv[1]
    cluster_creator_posts(creator_name)

