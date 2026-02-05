
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, me, registerCustomer, registerFarmer } from "../api/auth";
import { setAuthToken } from "../api/client";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register-customer" | "register-farmer"

  // shared fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // register-only fields (all users)
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // farmer-only fields
  const [farmName, setFarmName] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // Optional: if already logged in, go straight to dashboard
  // NOTE: Only navigate on mount if token exists to avoid re-render loops
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Token exists, user is already authenticated
      // Let the router handle the redirect via Dashboard mount
      setAuthToken(token);
    }
  }, []);

  function resetMessages() {
    setStatus("");
    setError("");
  }

  function switchMode(nextMode) {
    resetMessages();
    setMode(nextMode);

    // Clear form fields when switching modes
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setFarmName("");
  }

  function extractError(err, fallback) {
    // Try common DRF error shapes
    const data = err?.response?.data;
    if (!data) return fallback;

    if (typeof data === "string") return data;
    if (data.detail) return data.detail;

    // Field errors: { email: ["..."], username: ["..."] }
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];

    return fallback;
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    resetMessages();
    setStatus("Logging in...");

    try {
      const res = await login({ username, password });
      const access = res.data.access;

      localStorage.setItem("accessToken", access);
      setAuthToken(access);

      // confirm identity / load role for display
      const meRes = await me();
      setStatus(`Logged in as ${meRes.data.username} (${meRes.data.role})`);

      navigate("/dashboard");
    } catch (err) {
      setStatus("");
      setError(extractError(err, "Login failed. Check username/password."));
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    resetMessages();

    // Validate all required fields
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("Creating account...");

    try {
      // Build payload with all required fields
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      };

      // ✅ Match your backend endpoints:
      // /api/auth/register/customer/ OR /api/auth/register/farmer/
      if (mode === "register-farmer") {
        await registerFarmer(payload);
      } else {
        await registerCustomer(payload);
      }

      setStatus("Account created! Logging you in...");

      // Now login with the credentials to get the JWT token
      const loginRes = await login({ username, password });
      const access = loginRes.data.access;
      localStorage.setItem("accessToken", access);
      setAuthToken(access);

      await me(); // Verify token + load user
      navigate("/dashboard");
    } catch (err) {
      setStatus("");
      // Extract field-specific errors if they exist
      const fieldErrors = err?.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        // List all missing/invalid fields
        const errorList = Object.entries(fieldErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
          .join(", ");
        setError(errorList || "Registration failed. Check all fields.");
      } else {
        setError(extractError(err, "Registration failed. Try a different username/email."));
      }
    }
  }

  async function handleFarmerRegisterSubmit(e) {
    e.preventDefault();
    resetMessages();

    // Validate all required fields including farm name
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required.");
      return;
    }
    if (!farmName.trim()) {
      setError("Farm name is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("Creating farmer account...");

    try {
      // Build payload with all required fields including farm name
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        farm_name: farmName.trim(),
      };

      await registerFarmer(payload);

      setStatus("Farm account created! Logging you in...");

      // Now login with the credentials to get the JWT token
      const loginRes = await login({ username, password });
      const access = loginRes.data.access;
      localStorage.setItem("accessToken", access);
      setAuthToken(access);

      await me(); // Verify token + load user
      navigate("/dashboard");
    } catch (err) {
      setStatus("");
      // Extract field-specific errors if they exist
      const fieldErrors = err?.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        // List all missing/invalid fields
        const errorList = Object.entries(fieldErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
          .join(", ");
        setError(errorList || "Registration failed. Check all fields.");
      } else {
        setError(extractError(err, "Registration failed. Try a different username/email."));
      }
    }
  }

  return (
    <div className="login-container" style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>
        {mode === "login" ? "Login" : "Create Account"}
      </h2>

      {mode === "login" ? (
        <form onSubmit={handleLoginSubmit}>
          <div style={{ marginBottom: 10 }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              style={{ width: "100%", padding: 10 }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              autoComplete="current-password"
              style={{ width: "100%", padding: 10 }}
              required
            />
          </div>

          <button type="submit" style={{ width: "100%", padding: 10 }}>
            Login
          </button>

          <div style={{ marginTop: 12 }}>
            <small>
              No account?{" "}
              <button
                type="button"
                onClick={() => switchMode("register-customer")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Create one
              </button>
            </small>
          </div>
        </form>
      ) : null}

      {/* REGISTER CUSTOMER FORM */}
      {mode === "register-customer" && (
        <form onSubmit={handleRegisterSubmit}>
          <div style={{ marginBottom: 10 }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              type="email"
              autoComplete="email"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="first name *"
              type="text"
              autoComplete="given-name"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="last name *"
              type="text"
              autoComplete="family-name"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              autoComplete="new-password"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="confirm password"
              type="password"
              autoComplete="new-password"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <button type="submit" style={{ width: "100%", padding: 10 }}>
            Register as Customer
          </button>

          <div style={{ marginTop: 12 }}>
            <small>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Login
              </button>
            </small>
          </div>

          <div style={{ marginTop: 12 }}>
            <small>
              Want to be a farmer?{" "}
              <button
                type="button"
                onClick={() => switchMode("register-farmer")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Register as farmer
              </button>
            </small>
          </div>
        </form>
      )}

      {/* REGISTER FARMER FORM */}
      {mode === "register-farmer" && (
        <form onSubmit={handleFarmerRegisterSubmit}>
          <div style={{ marginBottom: 10 }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              type="email"
              autoComplete="email"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="first name *"
              type="text"
              autoComplete="given-name"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="last name *"
              type="text"
              autoComplete="family-name"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="farm name *"
              type="text"
              autoComplete="off"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              autoComplete="new-password"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="confirm password"
              type="password"
              autoComplete="new-password"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              required
            />
          </div>

          <button type="submit" style={{ width: "100%", padding: 10 }}>
            Register as Farmer
          </button>

          <div style={{ marginTop: 12 }}>
            <small>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Login
              </button>
            </small>
          </div>

          <div style={{ marginTop: 12 }}>
            <small>
              Want to register as a customer?{" "}
              <button
                type="button"
                onClick={() => switchMode("register-customer")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Register as customer
              </button>
            </small>
          </div>
        </form>
      )}

      {status ? (
        <p style={{ marginTop: 14, color: "#0f766e" }}>{status}</p>
      ) : null}
      {error ? (
        <p style={{ marginTop: 14, color: "#b91c1c" }}>{error}</p>
      ) : null}
    </div>
  );
}
