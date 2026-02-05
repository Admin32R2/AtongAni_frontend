import { useEffect, useState } from "react";
import { getPosts } from "../api/posts";
import PostCard from "./PostCard";
import "./PostFeed.css";

export default function PostFeed({ user, refreshTrigger }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "farmers"

  useEffect(() => {
    loadPosts();
  }, [refreshTrigger]);

  async function loadPosts() {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (filter === "farmers") {
        params.role = "farmer";
      }

      const res = await getPosts(params);
      setPosts(res.data || []);
    } catch (err) {
      setError("Failed to load posts");
      console.log(err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(newFilter) {
    setFilter(newFilter);
  }

  useEffect(() => {
    loadPosts();
  }, [filter]);

  if (loading && posts.length === 0) {
    return <div className="post-feed"><div className="loading-state">Loading posts...</div></div>;
  }

  return (
    <div className="post-feed">
      <div className="feed-header">
        <h3>Posts</h3>
        <div className="feed-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => handleFilterChange("all")}
          >
            All Posts
          </button>
          <button
            className={`filter-btn ${filter === "farmers" ? "active" : ""}`}
            onClick={() => handleFilterChange("farmers")}
          >
            From Farmers
          </button>
        </div>
      </div>

      {error && <div className="feed-error">{error}</div>}

      {posts.length === 0 && !loading ? (
        <div className="no-posts">
          <p>No posts yet</p>
          <p className="no-posts-hint">Check back later for updates from farmers</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              onRefresh={loadPosts}
            />
          ))}
        </div>
      )}

      {loading && posts.length > 0 && (
        <div className="loading-more">Loading more posts...</div>
      )}
    </div>
  );
}
