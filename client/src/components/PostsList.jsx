import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function PostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/posts");
      console.log("Posts API response:", response.data);
      const postsData =
        response.data?.data?.data || response.data?.data || response.data || [];
      setPosts(Array.isArray(postsData) ? postsData : []);
      setError("");
    } catch (err) {
      setError("Failed to load posts");
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", color: "inherit", textAlign: "center" }}>
        Loading posts...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
        {error}
        <button
          onClick={fetchPosts}
          style={{ marginLeft: "10px", padding: "5px 10px" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        color: "inherit",
      }}
    >
      <h1 style={{ color: "inherit" }}>Posts</h1>
      {posts.length === 0 ? (
        <p style={{ color: "inherit", textAlign: "center", marginTop: "40px" }}>
          No posts available.
        </p>
      ) : (
        <div>
          {posts.map((post) => (
            <div
              key={post.post_id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "15px",
                marginBottom: "15px",
              }}
            >
              <h2 style={{ marginTop: 0, color: "inherit" }}>
                <Link
                  to={`/posts/${post.post_id}`}
                  style={{ textDecoration: "none", color: "#646cff" }}
                >
                  {post.title || "Untitled Post"}
                </Link>
              </h2>
              {post.slug && (
                <p style={{ color: "#666", fontSize: "0.9em" }}>/{post.slug}</p>
              )}
              {post.excerpt && (
                <p style={{ marginTop: "10px" }}>{post.excerpt}</p>
              )}
              {(post.body || post.content) && (
                <p
                  style={{
                    marginTop: "10px",
                    color: "inherit",
                    opacity: 0.8,
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      (post.body || post.content || "").length > 200
                        ? (post.body || post.content || "").substring(0, 200) +
                          "..."
                        : post.body || post.content || "",
                  }}
                />
              )}
              <div
                style={{ marginTop: "10px", fontSize: "0.9em", color: "#666" }}
              >
                {post.created_at && (
                  <span>
                    Published: {new Date(post.created_at).toLocaleDateString()}
                  </span>
                )}
                {post.author && (
                  <span style={{ marginLeft: "15px" }}>
                    By: {post.author.username || post.author}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostsList;
