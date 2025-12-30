import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import PropTypes from "prop-types";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(false);
    } catch {
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    try {
      const response = await api.post("/auth/login", {
        identifier,
        password,
      });
      if (response.data.status === "success" && response.data.data?.user) {
        setUser(response.data.data.user);
        return { success: true, user: response.data.data.user };
      }
      return {
        success: false,
        message: response.data.message || "Login failed",
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const signup = async (username, email, password, role) => {
    try {
      const response = await api.post("/auth/signup", {
        username,
        email,
        password,
        role,
      });
      if (response.data.status === "success" && response.data.data?.user) {
        setUser(response.data.data.user);
        return { success: true, user: response.data.data.user };
      }
      return {
        success: false,
        message: response.data.message || "Signup failed",
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Signup failed",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      return { success: true };
    } catch (error) {
      setUser(null);
      return {
        success: false,
        message: error.response?.data?.message || "Logout failed",
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAuthor: user?.role === "author" || user?.role === "admin",
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
