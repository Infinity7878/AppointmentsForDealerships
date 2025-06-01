// Login.jsx
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin(); // notify parent you're logged in
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center" }}>
      <h2>{isRegistering ? "Register" : "Login"}</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <button type="submit" style={{ padding: 10 }}>
          {isRegistering ? "Create Account" : "Login"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button
        onClick={() => setIsRegistering((prev) => !prev)}
        style={{ marginTop: 20 }}
      >
        {isRegistering
          ? "Already have an account? Log in"
          : "No account? Register"}
      </button>
    </div>
  );
}
