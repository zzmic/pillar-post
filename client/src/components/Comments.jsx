import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Comments({ postId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/comments/posts/${postId}`);
      setComments(response.data.data || response.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load comments");
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      await api.post(`/comments/posts/${postId}`, { content });
      setContent("");
      fetchComments();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          "Failed to post comment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await api.delete(`/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      alert("Failed to delete comment");
      console.error("Error deleting comment:", err);
    }
  };

  if (loading) {
    return <div style={{ marginTop: "30px" }}>Loading comments...</div>;
  }

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Comments ({comments.length})</h2>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
          {error && (
            <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            rows="4"
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              marginBottom: "10px",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "8px 15px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <p style={{ color: "#666", marginBottom: "20px" }}>
          <Link to="/login" style={{ color: "#007bff" }}>
            Login
          </Link>{" "}
          to post a comment
        </p>
      )}

      {comments.length === 0 ? (
        <p style={{ color: "#666" }}>No comments yet.</p>
      ) : (
        <div>
          {comments.map((comment) => {
            const canDelete =
              isAuthenticated &&
              user &&
              (user.user_id === comment.author_id || user.role === "admin");

            return (
              <div
                key={comment.comment_id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "15px",
                  marginBottom: "15px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9em", color: "#666" }}>
                      {comment.author && (
                        <strong>
                          {comment.author.username || comment.author}
                        </strong>
                      )}
                      {comment.created_at && (
                        <span style={{ marginLeft: "10px" }}>
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: "10px" }}>{comment.content}</div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(comment.comment_id)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.8em",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Comments.propTypes = {
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default Comments;
