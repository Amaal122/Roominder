# ─────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────
from sklearn.cluster import KMeans
from sklearn.preprocessing import normalize
from collections import defaultdict
import numpy as np
import json

# Import your existing functions

from matcher import compute_compatibility, print_result


# ─────────────────────────────────────────────
# STEP 1 — BUILD CLUSTERS (runs once)
# ─────────────────────────────────────────────

def build_clusters(profiles: list, n_clusters: int = 8) -> list:
    """
    Clusters all profiles by their final_vector using K-Means.
    Assigns a cluster_id to each profile.
    Returns profiles with cluster_id added.

    n_clusters=8 means 8 lifestyle archetypes.
    With 100 profiles → ~12 profiles per cluster on average.
    With 1000 profiles → ~125 profiles per cluster.
    """

    print(f"\nBuilding {n_clusters} clusters from {len(profiles)} profiles...")

    # Extract all final vectors into a matrix
    # Shape: (n_profiles, 774)
    vectors = np.array([p["final_vector"] for p in profiles])

    # Normalize vectors before clustering
    # This makes cosine distance the effective metric
    vectors_normalized = normalize(vectors)

    # Run K-Means
    kmeans = KMeans(
        n_clusters=n_clusters,
        random_state=42,      # reproducible results
        n_init=10,            # run 10 times, pick best
    )
    kmeans.fit(vectors_normalized)

    # Assign cluster_id to each profile
    for i, profile in enumerate(profiles):
        profile["cluster_id"] = int(kmeans.labels_[i])

    # Print cluster summary
    cluster_counts = defaultdict(int)
    for p in profiles:
        cluster_counts[p["cluster_id"]] += 1

    print("\nCluster summary:")
    for cluster_id in sorted(cluster_counts):
        count = cluster_counts[cluster_id]
        members = [p["full_name"] for p in profiles if p["cluster_id"] == cluster_id]
        print(f"  Cluster {cluster_id}: {count} profiles")
        for name in members[:3]:            # show first 3 names as preview
            print(f"    - {name}")
        if count > 3:
            print(f"    ... and {count - 3} more")

    return profiles, kmeans


# ─────────────────────────────────────────────
# STEP 2 — FIND USER'S CLUSTER
# ─────────────────────────────────────────────

def get_cluster_members(target_email: str, profiles: list) -> tuple[int, list]:
    """
    Returns the cluster_id and all other members of the target's cluster.
    """
    target = next((p for p in profiles if p["email"] == target_email), None)
    if not target:
        print(f"Profile not found: {target_email}")
        return -1, []

    cluster_id = target["cluster_id"]
    members = [
        p for p in profiles
        if p["cluster_id"] == cluster_id and p["email"] != target_email
    ]

    return cluster_id, members


# ─────────────────────────────────────────────
# STEP 3 — MATCH WITHIN CLUSTER
# ─────────────────────────────────────────────

def find_top_matches_clustered(
    target_email: str,
    profiles: list,
    top_n: int = 5,
    expand_if_needed: bool = True,
) -> list:
    """
    Finds top N matches for a user, searching only within their cluster.

    expand_if_needed=True: if cluster has fewer than top_n eligible matches,
    automatically expands search to neighboring clusters.
    """

    target = next((p for p in profiles if p["email"] == target_email), None)
    if not target:
        print(f"Profile not found: {target_email}")
        return []

    cluster_id, cluster_members = get_cluster_members(target_email, profiles)

    print(f"\n── Clustered Matching for {target['full_name']} ──────────────")
    print(f"  Cluster #{cluster_id} — searching among {len(cluster_members)} profiles")

    # Run compute_compatibility only within the cluster
    results = []
    for p in cluster_members:
        result = compute_compatibility(target, p)
        results.append(result)

    # Sort by final_score
    results.sort(key=lambda x: x["final_score"], reverse=True)

    # Count eligible results
    eligible = [r for r in results if r.get("eligible", False)]

    # Expand to other clusters if not enough eligible matches
    if expand_if_needed and len(eligible) < top_n:
        print(f"  ⚠️  Only {len(eligible)} eligible in cluster #{cluster_id}, expanding search...")

        outside_members = [
            p for p in profiles
            if p["cluster_id"] != cluster_id and p["email"] != target_email
        ]

        for p in outside_members:
            result = compute_compatibility(target, p)
            result["note"] = f"expanded from cluster #{p['cluster_id']}"
            results.append(result)

        results.sort(key=lambda x: x["final_score"], reverse=True)

    # Print top N
    eligible_results = [r for r in results if r.get("eligible", False)]
    print(f"\n── Top {top_n} Matches ──────────────────────────────────────")
    for i, r in enumerate(eligible_results[:top_n], 1):
        print(f"\n#{i}", end="")
        if "note" in r:
            print(f"  [{r['note']}]", end="")
        print_result(r)

    return eligible_results[:top_n]


# ─────────────────────────────────────────────
# STEP 4 — HOW MANY CLUSTERS?
# ─────────────────────────────────────────────

def find_optimal_clusters(profiles: list, max_k: int = 15) -> None:
    """
    Prints inertia scores to help you pick the right n_clusters.
    Look for the 'elbow' — where the drop starts flattening.
    """
    from sklearn.cluster import KMeans
    vectors = normalize(np.array([p["final_vector"] for p in profiles]))

    print("\nCluster count vs inertia (look for the elbow):")
    print(f"  {'k':>4} │ {'inertia':>12}")
    print(f"  {'─'*4}─┼─{'─'*12}")

    for k in range(2, max_k + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(vectors)
        print(f"  {k:>4} │ {km.inertia_:>12.1f}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":

    # Load vectorized profiles
    with open("profiles_vectorized.json", "r", encoding="utf-8") as f:
        profiles = json.load(f)

    # Optional: find optimal cluster count first
    # find_optimal_clusters(profiles, max_k=15)

    # Build clusters (run once, then save)
    profiles, kmeans = build_clusters(profiles, n_clusters=8)

    # Save profiles with cluster_id assigned
    with open("profiles_clustered.json", "w", encoding="utf-8") as f:
        json.dump(profiles, f, ensure_ascii=False, indent=2)
    print("\n✅ Saved profiles_clustered.json")

    # Find top matches using clustering
    find_top_matches_clustered(
        target_email=profiles[0]["email"],
        profiles=profiles,
        top_n=5,
    )