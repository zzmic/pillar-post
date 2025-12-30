import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Signup from "./components/Signup";
import PostsList from "./components/PostsList";
import PostDetail from "./components/PostDetail";
import PostForm from "./components/PostForm";
import TestBackend from "./TestBackend.jsx";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main style={{ minHeight: "calc(100vh - 80px)" }}>
            <Routes>
              <Route path="/" element={<Navigate to="/posts" replace />} />
              <Route path="/posts" element={<PostsList />} />
              <Route path="/posts/new" element={<PostForm />} />
              <Route path="/posts/:post_id" element={<PostDetail />} />
              <Route path="/posts/:post_id/edit" element={<PostForm />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/test" element={<TestBackend />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
