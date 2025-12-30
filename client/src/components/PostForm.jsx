import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function PostForm() {
  const { post_id } = useParams();
  const isEdit = !!post_id;
  const navigate = useNavigate();
  const { isAuthor } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      fetchPost();
    } else if (!isAuthor) {
      navigate("/posts");
    }
  }, [post_id, isEdit, isAuthor, navigate]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/${post_id}`);
      const post = response.data.data || response.data;
      setTitle(post.title || "");
      setContent(post.content || "");
      setExcerpt(post.excerpt || "");
      setSlug(post.slug || "");
      setStatus(post.status || "draft");
    } catch (err) {
      setError("Failed to load post");
      console.error("Error fetching post:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const postData = {
        title,
        content,
        excerpt,
        slug: slug || undefined,
        status,
      };

      if (isEdit) {
        await api.put(`/posts/${post_id}`, postData);
      } else {
        await api.post("/posts", postData);
      }
      navigate("/posts");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          "Failed to save post",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>{isEdit ? "Edit Post" : "Create New Post"}</h1>
      {error && (
        <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>
            Title: *
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>
            Slug (optional, auto-generated if empty):
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>
            Excerpt:
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows="3"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>
            Content: *
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows="15"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>
            Status:
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              marginRight: "10px",
            }}
          >
            {loading ? "Saving..." : isEdit ? "Update Post" : "Create Post"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/posts")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostForm;
