import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Simple welcome page displayed at the root of the application.
 * It shows a heading and a button that navigates to the login page.
 */
function Welcome() {
  const navigate = useNavigate();

  const handleProceed = () => {
    // Navigate to the login route when the button is clicked
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1>Welcome to AtongAni</h1>
      <button
        onClick={handleProceed}
        style={{ padding: "0.5rem 1rem", fontSize: "1rem", cursor: "pointer" }}
      >
        Accept
      </button>
    </div>
  );
}

export default Welcome;
