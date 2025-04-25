import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import bg from '../Login/bg.svg';
import nearForm from '../Login/nearForm.svg';
import sittingHuman from '../Login/sittingHuman.svg';

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
  width: 280px;
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
    // Pharmacy specific fields
    pharmacyName: "",
    address: "",
    medicineName: "",
    price: "",
    latitude: "",
    longitude: "",
    isAvailable: true
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate admin code
    if (formData.role === 'admin' && formData.adminCode !== '1234') {
      setError("Invalid admin code");
      return;
    }

    // Validate pharmacy fields
    if (formData.role === 'pharmacy') {
      const requiredFields = ['pharmacyName', 'address', 'medicineName', 'price', 'latitude', 'longitude'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required pharmacy fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An error occurred during registration");
    }
  };

  return (
    <RootContainer>
      <BgImgContainer>
        <img src={bg} alt="Background" style={{ width: '100%' }} />
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
              }
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
            
            {formData.role === 'admin' && (
              <Input
                type="password"
                placeholder="Admin Secret Code"
                name="adminCode"
                value={formData.adminCode}
                onChange={handleChange}
                required
              />
            )}
            
            {formData.role === 'pharmacy' && (
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
                />
                <Input
                  type="text"
                  placeholder="Latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="text"
                  placeholder="Longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                />
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="isAvailable"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                    style={{ marginRight: '10px', width: 'auto', height: 'auto' }}
                  />
                  <label htmlFor="isAvailable" style={{ fontSize: '12px', color: 'rgba(100, 100, 100, 1)' }}>
                    Medicine Available
                  </label>
                </div>
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
          <MutedLink style={{ alignSelf: 'center' }}>
            Already have an account?{" "}
            <BoldLink to="/login">
              Sign In
            </BoldLink>
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