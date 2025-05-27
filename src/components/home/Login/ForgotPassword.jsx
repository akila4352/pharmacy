import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import bg from '../Login/bg.svg';

const RootContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
`;

const BgImgContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: -10;
  width: 100%;
  height: 100vh;
`;

const BoxContainer = styled.div`
  width: 340px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  border-radius: 19px;
  background-color: #fff;
  box-shadow: 0 0 2px rgba(15, 15, 15, 0.28);
  position: relative;
  overflow: hidden;
  padding: 2em 1.5em;
`; 

const HeaderText = styled.h2`
  font-size: 26px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
`;

const InfoText = styled.p`
  color: #555;
  font-size: 14px;
  margin-bottom: 18px;
`;

const Input = styled.input`
  width: 100%;
  height: 42px;
  outline: none;
  border: 1px solid rgba(200, 200, 200, 0.3);
  padding: 0px 10px;
  margin-bottom: 14px;
  font-size: 13px;
  border-radius: 5px;
  &:focus {
    border-bottom: 2px solid rgb(241, 196, 15);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 11px 0;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  background: linear-gradient(
    58deg,
    rgba(241, 196, 15, 1) 20%,
    rgba(243, 172, 18, 1) 100%
  );
  margin-bottom: 10px;
`;

const Message = styled.div`
  color: ${props => props.error ? "#ff3333" : "#155724"};
  background: ${props => props.error ? "#f8d7da" : "#d4edda"};
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 10px;
  text-align: center;
`;

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMsg("OTP sent to your email.");
        setSent(true);
        setShowOtp(true);
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMsg("Password reset successful. You can now login.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <RootContainer>
      <BgImgContainer>
        <img src={bg} alt="Background" style={{ width: "100%" }} />
      </BgImgContainer>
      <BoxContainer>
        <HeaderText>Forgot Password?</HeaderText>
        <InfoText>
          {showOtp
            ? "Enter the OTP sent to your email and set a new password."
            : "Enter your email address and we'll send you an OTP."}
        </InfoText>
        {msg && <Message>{msg}</Message>}
        {error && <Message error>{error}</Message>}
        {!showOtp ? (
          <form onSubmit={handleEmailSubmit}>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={sent}
            />
            <SubmitButton type="submit" disabled={sent}>
              Send OTP
            </SubmitButton>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit}>
            <Input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <SubmitButton type="submit">
              Reset Password
            </SubmitButton>
          </form>
        )}
        <button
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "13px",
            marginTop: "8px"
          }}
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>
      </BoxContainer>
    </RootContainer>
  );
}

export default ForgotPassword;
