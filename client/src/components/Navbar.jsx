import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, logout, isAuthor } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/posts");
  };

  return (
    <nav
      style={{
        backgroundColor: "#343a40",
        color: "white",
        padding: "15px 20px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Link
            to="/posts"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "1.2em",
            }}
          >
            Pillar Post
          </Link>
        </div>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <Link to="/posts" style={{ color: "white", textDecoration: "none" }}>
            Posts
          </Link>
          {isAuthenticated ? (
            <>
              {isAuthor && (
                <Link
                  to="/posts/new"
                  style={{ color: "white", textDecoration: "none" }}
                >
                  New Post
                </Link>
              )}
              {user && (
                <span style={{ color: "#ccc" }}>
                  {user.username}
                  {user.role && ` (${user.role})`}
                </span>
              )}
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: "transparent",
                  color: "white",
                  border: "1px solid white",
                  padding: "5px 15px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{ color: "white", textDecoration: "none" }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                style={{ color: "white", textDecoration: "none" }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
