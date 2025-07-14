import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TestBackend from "./components/TestBackend";
import "./App.css";

// Function to define the main `App` component.
function App() {
  // The App component renders the main structure of the application,
  // including navigation links and routes for different components.
  // It uses React Router for client-side routing.
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/test">Test the Backend</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<h1>Welcome to the React Frontend!</h1>} />
          <Route path="/test" element={<TestBackend />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
