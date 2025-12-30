import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Comments from "./Comments";

function PostDetail() {
  const { post_id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
  }, [post_id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/${post_id}`);
      setPost(response.data.data || response.data);
      setError("");
    } catch (err) {
      setError("Failed to load post");
      console.error("Error fetching post:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/posts/${post_id}`);
      navigate("/posts");
    } catch (err) {
      alert("Failed to delete post");
      console.error("Error deleting post:", err);
    } finally {
      setDeleting(false);
    }
  };

  const canEdit =
    isAuthenticated &&
    user &&
    post &&
    (user.user_id === post.author_id || user.role === "admin");

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading post...</div>;
  }

  if (error || !post) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        {error || "Post not found"}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link to="/posts" style={{ textDecoration: "none", color: "#007bff" }}>
          ← Back to Posts
        </Link>
      </div>

      {canEdit && (
        <div style={{ marginBottom: "15px" }}>
          <Link
            to={`/posts/${post_id}/edit`}
            style={{
              marginRight: "10px",
              padding: "8px 15px",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              display: "inline-block",
            }}
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: "8px 15px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: deleting ? "not-allowed" : "pointer",
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}

      <article>
        <h1>{post.title}</h1>
        {post.slug && (
          <p style={{ color: "#666", fontSize: "0.9em" }}>/{post.slug}</p>
        )}
        <div style={{ marginTop: "10px", fontSize: "0.9em", color: "#666" }}>
          {post.created_at && (
            <span>
              Published: {new Date(post.created_at).toLocaleDateString()}
            </span>
          )}
          {post.updated_at && post.updated_at !== post.created_at && (
            <span style={{ marginLeft: "15px" }}>
              Updated: {new Date(post.updated_at).toLocaleDateString()}
            </span>
          )}
          {post.author && (
            <span style={{ marginLeft: "15px" }}>
              By: {post.author.username || post.author}
            </span>
          )}
        </div>
        {post.content && (
          <div
            style={{ marginTop: "20px", lineHeight: "1.6" }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}
      </article>

      <Comments postId={post_id} />
    </div>
  );
}

export default PostDetail;
