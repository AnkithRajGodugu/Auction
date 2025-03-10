import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../LoginSignup/LoginSignup.css";
import user_icon from "../assets/person.png";
import email_icon from "../assets/email.png";
import password_icon from "../assets/password.png";

const LoginSignup = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState(""); 
  const [action, setAction] = useState("Sign Up");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async () => {
    const userData = action === "Sign Up" 
      ? { name, email, password, contactNumber } 
      : { email, password };
    const url = action === "Sign Up" ? `${import.meta.env.VITE_APP_SITE}/api/signup` : `${import.meta.env.VITE_APP_SITE}/api/login`;

    setLoading(true);
    try {
      const response = await axios.post(url, userData);
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setIsAuthenticated(true);
      setLoading(false);
      alert(`${action} successful!`);
      navigate("/");
    } catch (error) {
      setLoading(false);
      console.error("Error during authentication:", error);
      alert("Authentication failed: " + (error.response?.data?.error || "Network error"));
    }
  };

  const testProtectedRoute = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_APP_SITE}/api/protected`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoading(false);
      alert("Protected route accessed: " + response.data.message);
    } catch (error) {
      setLoading(false);
      alert("Failed to access protected route: " + (error.response?.data?.error || "Unknown error"));
    }
  };

  return (
    <div className="Lcontainer">
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        {action === "Sign Up" && (
          <>
            <div className="input">
              <img src={user_icon} alt="" />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="input">
              <img src={user_icon} alt="" />
              <input
                type="text"
                placeholder="Contact Number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>
          </>
        )}
        <div className="input">
          <img src={email_icon} alt="" />
          <input
            type="email"
            placeholder="Email Id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="input">
          <img src={password_icon} alt="" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      {action === "Login" && (
        <div className="forgot-password">Lost Password? <span>Click Here</span></div>
      )}
      <div className="submit-container">
        <div
          className={action === "Login" ? "submit gray" : "submit"}
          onClick={() => {
            setAction("Sign Up");
            if (action === "Sign Up") handleAuth();
          }}
        >
          Sign Up
        </div>
        <div
          className={action === "Sign Up" ? "submit gray" : "submit"}
          onClick={() => {
            setAction("Login");
            if (action === "Login") handleAuth();
          }}
        >
          Login
        </div>
      </div>
      {/* <div className="submit-container">
        <div className="submit" onClick={testProtectedRoute}>Test Protected Route</div>
      </div> */}
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default LoginSignup;