import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import bg from '../Login/bg.svg';
import nearForm from '../Login/nearForm.svg';
import sittingHuman from '../Login/sittingHuman.svg';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issue
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Styled components
const RootContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: row;
  justify-content: center !important;
  align-items: center;
  align-self: center;
  overflow-x: hidden;
`;

const BgImgContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: -10;
  width: 100%;
  height: 100vh;
`;

const NearFormImgContainer = styled.div`
  z-index: -10;

  @media(max-width: 645px){
    display: none !important;
  }
`;

const SittingImgContainer = styled.div`
  z-index: -10;
  position: fixed;
  right: -1px;
  bottom: -1px;

  @media(max-width: 999px){
    display: none !important;
  }
`;

const BoxContainer = styled.div`
  width: 340px;
  min-height: 550px;
  display: flex;
  flex-direction: column;
  border-radius: 19px;
  background-color: #fff;
  box-shadow: 0 0 2px rgba(15, 15, 15, 0.28);
  position: relative;
  overflow: hidden;
  max-height: 80vh;
  overflow-y: auto;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(241, 196, 15, 0.8);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(243, 172, 18, 1);
  }
`;

const TopContainer = styled.div`
  width: 100%;
  height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 1.8em;
  padding-bottom: 5em;
`;

const BackDrop = styled(motion.div)`
  width: 160%;
  height: 550px;
  position: absolute;
  display: flex;
  flex-direction: column;
  border-radius: 50%;
  transform: rotate(60deg);
  top: -290px;
  left: -70px;
  background: rgb(241, 196, 15);
  background: linear-gradient(
    58deg,
    rgba(241, 196, 15, 1) 20%,
    rgba(243, 172, 18, 1) 100%
  );
`;

const HeaderContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const HeaderText = styled.h2`
  font-size: 30px;
  font-weight: 600;
  line-height: 1.24;
  color: #fff;
  z-index: 10;
  margin: 0;
`;

const SmallText = styled.h5`
  color: #fff;
  font-weight: 500;
  font-size: 11px;
  z-index: 10;
  margin: 0;
  margin-top: 7px;
`;

const InnerContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 1.8em;
  padding-bottom: 1.8em;
`;

// Form components
const FormContainer = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 2.5px rgba(15, 15, 15, 0.19);
`;

const Input = styled.input`
  width: 100%;
  height: 42px;
  outline: none;
  border: 1px solid rgba(200, 200, 200, 0.3);
  padding: 0px 10px;
  border-bottom: 1.4px solid transparent;
  transition: all 200ms ease-in-out;
  font-size: 12px;

  &::placeholder {
    color: rgba(200, 200, 200, 1);
  }

  &:not(:last-of-type) {
    border-bottom: 1.5px solid rgba(200, 200, 200, 0.4);
  }

  &:focus {
    outline: none;
    border-bottom: 2px solid rgb(241, 196, 15);
  }
`;

const Select = styled.select`
  width: 100%;
  height: 42px;
  outline: none;
  border: 1px solid rgba(200, 200, 200, 0.3);
  padding: 0px 10px;
  border-bottom: 1.4px solid transparent;
  transition: all 200ms ease-in-out;
  font-size: 12px;
  color: rgba(100, 100, 100, 1);

  &:focus {
    outline: none;
    border-bottom: 2px solid rgb(241, 196, 15);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 11px 40%;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 100px 100px 100px 100px;
  cursor: pointer;
  transition: all, 240ms ease-in-out;
  background: rgb(241, 196, 15);
  background: linear-gradient(
    58deg,
    rgba(241, 196, 15, 1) 20%,
    rgba(243, 172, 18, 1) 100%
  );

  &:hover {
    filter: brightness(1.03);
  }
`;

const MutedLink = styled.a`
  font-size: 11px;
  color: rgba(200, 200, 200, 0.8);
  font-weight: 500;
  text-decoration: none;
`;

const BoldLink = styled(Link)`
  font-size: 11px;
  color: rgb(241, 196, 15);
  font-weight: 500;
  text-decoration: none;
  margin: 0 4px;
  cursor: pointer;
`;

const ErrorMessage = styled.div`
  color: #ff3333;
  font-size: 12px;
  margin-bottom: 10px;
  text-align: center;
`;

const MapBox = styled.div`
  width: 100%;
  height: 200px;
  margin-top: 10px;
  margin-bottom: 10px;
  border: 1px solid rgba(200, 200, 200, 0.4);
  border-radius: 5px;
  overflow: hidden;
`;

const LocationInfoText = styled.p`
  font-size: 12px;
  color: rgba(100, 100, 100, 1);
  margin: 5px 0;
`;

const Marginer = ({ direction = "horizontal", margin }) => {
  const HorizontalMargin = styled.span`
    display: flex;
    width: ${margin}px;
  `;

  const VerticalMargin = styled.span`
    display: flex;
    height: ${margin}px;
  `;

  return direction === "horizontal" ? (
    <HorizontalMargin />
  ) : (
    <VerticalMargin />
  );
};

// Map click handler component
function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    }
  });

  return position === null ? null : (
    <Marker position={position} icon={defaultIcon} />
  );
}

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    role: "patient",
    adminCode: "",
    pharmacyName: "",
    address: "",
    latitude: "",
    longitude: "",
    isAvailable: true,
    medicineName: "",
    price: "",
  });
  const [error, setError] = useState("");
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([20, 0]); // Default world center
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendStatus, setResendStatus] = useState(""); // for resend feedback

  // Get user's current location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  }, []);

  // Update form data when position changes
  useEffect(() => {
    if (position) {
      setFormData((prev) => ({
        ...prev,
        latitude: position.lat.toString(),
        longitude: position.lng.toString(),
      }));
    }
  }, [position]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.role === 'admin' && formData.adminCode !== '1234') {
        setError("Invalid admin code");
        return;
    }

    if (formData.role === 'pharmacy') {
        const requiredFields = ['pharmacyName', 'address', 'medicineName', 'price', 'latitude', 'longitude'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            setError(`Please fill in all required pharmacy fields: ${missingFields.join(', ')}`);
            return;
        }
    }

    // Make sure to send the plain password (not hashed)
    // If you have any hashing logic here, remove it!
    // Example of what NOT to do:
    // formData.password = hashFunction(formData.password);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // password should be plain text here
      });

      const data = await response.json();

      if (response.ok) {
        // Instead of alert, show OTP screen
        setRegisteredEmail(formData.email);
        setShowOtpScreen(true);
        setError("");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An error occurred during registration");
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: registeredEmail, otp }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("Email verified! Please login.");
        navigate("/login");
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("An error occurred during OTP verification");
    }
  };

  const handleResendOtp = async () => {
    setResendStatus("Sending...");
    setOtpError("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: registeredEmail }),
      });
      if (response.status === 404) {
        setResendStatus("Resend OTP feature is not available. Please contact support or try again later.");
        setTimeout(() => setResendStatus(""), 5000);
        return;
      }
      const data = await response.json();
      if (response.ok && data.success) {
        setResendStatus("OTP resent successfully!");
      } else {
        setResendStatus(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setResendStatus("An error occurred while resending OTP");
    }
    setTimeout(() => setResendStatus(""), 3000);
  };

  // OTP Verification Screen UI
  if (showOtpScreen) {
    return (
      <RootContainer>
        <BgImgContainer>
          <img src={bg} alt="Background" style={{ width: "100%" }} />
        </BgImgContainer>
        <BoxContainer style={{ margin: "auto" }}>
          <div style={{ padding: "2em 1.5em", textAlign: "center" }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>OTP Verification</h2>
            <div style={{
              background: "#d4edda",
              color: "#155724",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "18px",
              fontSize: "15px"
            }}>
              We've sent a verification code to your email - <b>{registeredEmail}</b>
            </div>
            <form onSubmit={handleOtpSubmit}>
              <Input
                type="text"
                placeholder="Enter verification code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                style={{ marginBottom: "12px", textAlign: "center", fontSize: "16px" }}
              />
              {otpError && <ErrorMessage>{otpError}</ErrorMessage>}
              <SubmitButton type="submit" style={{ background: "#6C63FF", marginTop: 8 }}>
                Submit
              </SubmitButton>
            </form>
            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                onClick={handleResendOtp}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                Resend OTP
              </button>
              {resendStatus && (
                <div style={{ fontSize: "12px", marginTop: 6, color: "#555" }}>
                  {resendStatus}
                </div>
              )}
            </div>
          </div>
        </BoxContainer>
      </RootContainer>
    );
  }

  return (
    <RootContainer>
      <BgImgContainer>
        <img src={bg} alt="Background" style={{ width: "100%" }} />
      </BgImgContainer>
      <NearFormImgContainer>
        <img src={nearForm} alt="Human 1" width="200px" />
      </NearFormImgContainer>
      <BoxContainer>
        <TopContainer>
          <BackDrop
            initial={false}
            animate="collapsed"
            variants={{
              collapsed: {
                width: "160%",
                height: "550px",
                borderRadius: "50%",
                transform: "rotate(60deg)",
              },
            }}
          />
          <HeaderContainer>
            <HeaderText>Create</HeaderText>
            <HeaderText>Account</HeaderText>
            <SmallText>Please sign-up to continue!</SmallText>
          </HeaderContainer>
        </TopContainer>
        <InnerContainer>
          <FormContainer onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              type="text"
              placeholder="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <Input
              type="text"
              placeholder="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="patient">Patient</option>
              <option value="pharmacy">Pharmacy Owner</option>
              <option value="admin">Admin</option>
            </Select>

            {formData.role === "admin" && (
              <Input
                type="password"
                placeholder="Admin Secret Code"
                name="adminCode"
                value={formData.adminCode}
                onChange={handleChange}
                required
              />
            )}

            {formData.role === "pharmacy" && (
              <>
                <Input
                  type="text"
                  placeholder="Pharmacy Name"
                  name="pharmacyName"
                  value={formData.pharmacyName}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="text"
                  placeholder="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="text"
                  placeholder="Medicine Name"
                  name="medicineName"
                  value={formData.medicineName}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="number"
                  placeholder="Price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                />
                <LocationInfoText>
                  Click on the map to set your pharmacy location:
                </LocationInfoText>
                <MapBox>
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                      position={position}
                      setPosition={setPosition}
                    />
                  </MapContainer>
                </MapBox>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Input
                    type="text"
                    placeholder="Latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                    style={{ width: "48%" }}
                    readOnly
                  />
                  <Input
                    type="text"
                    placeholder="Longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                    style={{ width: "48%" }}
                    readOnly
                  />
                </div>
                <Select
                  name="isAvailable"
                  value={formData.isAvailable}
                  onChange={handleChange}
                  required
                >
                  <option value={true}>Available</option>
                  <option value={false}>Not Available</option>
                </Select>
              </>
            )}
          </FormContainer>
          <Marginer direction="vertical" margin={10} />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Marginer direction="vertical" margin={10} />
          <SubmitButton type="submit" onClick={handleSubmit}>
            Sign Up
          </SubmitButton>
          <Marginer direction="vertical" margin="1em" />
          <MutedLink style={{ alignSelf: "center" }}>
            Already have an account?{" "}
            <BoldLink to="/login">Sign In</BoldLink>
          </MutedLink>
        </InnerContainer>
      </BoxContainer>
      <SittingImgContainer>
        <img src={sittingHuman} alt="Human 2" width="350px" />
      </SittingImgContainer>
    </RootContainer>
  );
}

export default Register;