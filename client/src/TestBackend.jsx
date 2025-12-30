import React, { useEffect, useState } from "react";
import axios from "axios";

// Function to test backend communication by fetching a message from the server.
function TestBackend() {
  // State variables to hold the message from the backend and any error messages.
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Effect hook to fetch data from the backend API.
  useEffect(() => {
    // Make a GET request to the backend API endpoint "/api/test".
    // If the request is successful, set the message state with the response data.
    // If there is an error, log the error and set the error state with an appropriate message.
    axios
      .get("/api/test")
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((err) => {
        console.log("Error fetching data:", err);
        setError(
          "Failed to fetch data from the backend. Ensure the backend is running and the API endpoint is correct.",
        );
      });
  }, []);

  // Render the component with the fetched message or an error message if applicable.
  // If the message is not empty, log it; otherwise (if still loading), log a loading message.
  // If there is an error, log it in red text.
  return (
    <div>
      <h2>Test Backend Communication</h2>
      {message ? (
        <p>
          Message from the backend: <strong>{message}</strong>
        </p>
      ) : (
        <p>Loading message...</p>
      )}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}

export default TestBackend;
