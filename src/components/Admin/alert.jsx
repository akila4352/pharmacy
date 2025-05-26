// filepath: d:\HD Final Project\pharmacy\src\components\Admin\alert.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HeaderAdmin from '../common/header/HeaderAdmin';
import './alert.css';

// Backend API URL
const API_URL = "http://localhost:5000/api";

const Alert = () => {
  // State for patient data
  const [patients, setPatients] = useState([]);
  
  // State for currently selected patient
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch all patients with messages on component mount
    fetchPatients();

    // Set up polling to check for new messages every 30 seconds
    const intervalId = setInterval(() => {
      fetchPatients();
    }, 30000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Set the first patient as selected by default when patients are loaded
    if (patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0]);
    }
  }, [patients, selectedPatient]);

  // Fetch patients with messages from the backend
  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await axios.get(`${API_URL}/chat/patients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        setPatients(response.data);
        // If there's a selected patient, update their data
        if (selectedPatient) {
          const updatedSelectedPatient = response.data.find(p => p.id === selectedPatient.id);
          if (updatedSelectedPatient) {
            setSelectedPatient(updatedSelectedPatient);
          }
        }
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching patient data:", err);
      setError("Failed to load patient data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific patient
  const fetchPatientMessages = async (patientId) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication required");
        return null;
      }

      const response = await axios.get(`${API_URL}/chat/messages/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
    } catch (err) {
      console.error("Error fetching patient messages:", err);
      setError("Failed to load patient messages");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedPatient) {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Authentication required");
          return;
        }

        // Create message data
        const messageData = {
          patientId: selectedPatient.id,
          text: newMessage,
          sender: 'admin',
          timestamp: new Date().toISOString()
        };

        // Send message to backend
        await axios.post(`${API_URL}/chat/admin/message`, messageData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Update local state
        const updatedPatients = patients.map(patient => {
          if (patient.id === selectedPatient.id) {
            const updatedMessages = [
              ...patient.messages,
              {
                id: patient.messages.length + 1,
                text: newMessage,
                sender: 'admin',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: true
              }
            ];
            
            return {
              ...patient,
              messages: updatedMessages,
              lastMessage: "You: " + newMessage
            };
          }
          return patient;
        });
        
        setPatients(updatedPatients);
        
        // Update selected patient with new messages
        const updatedSelectedPatient = updatedPatients.find(p => p.id === selectedPatient.id);
        setSelectedPatient(updatedSelectedPatient);
        
        setNewMessage('');
        setError(null);
      } catch (err) {
        console.error("Error sending message:", err);
        setError("Failed to send message");
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle selecting a patient
  const handleSelectPatient = async (patient) => {
    try {
      setLoading(true);
      
      // Mark messages as read in backend
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication required");
        return;
      }

      await axios.put(`${API_URL}/chat/markAsRead/${patient.id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Get fresh messages for the patient
      const patientWithMessages = await fetchPatientMessages(patient.id);
      
      if (patientWithMessages) {
        // Update the patients array
        const updatedPatients = patients.map(p => {
          if (p.id === patient.id) {
            return {
              ...p,
              messages: patientWithMessages.messages,
              unread: 0
            };
          }
          return p;
        });
        
        setPatients(updatedPatients);
        
        // Set the selected patient
        const updatedSelectedPatient = updatedPatients.find(p => p.id === patient.id);
        setSelectedPatient(updatedSelectedPatient);
      } else {
        // If we couldn't fetch fresh messages, just use what we have and mark as read
        const updatedPatients = patients.map(p => {
          if (p.id === patient.id) {
            const updatedMessages = p.messages.map(message => ({
              ...message,
              read: true
            }));
            
            return {
              ...p,
              messages: updatedMessages,
              unread: 0
            };
          }
          return p;
        });
        
        setPatients(updatedPatients);
        
        // Update selected patient
        const updatedSelectedPatient = updatedPatients.find(p => p.id === patient.id);
        setSelectedPatient(updatedSelectedPatient);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error selecting patient:", err);
      setError("Failed to load patient messages");
    } finally {
      setLoading(false);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <HeaderAdmin />
      <div className="alert-container">
        <div className="patients-sidebar">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="patients-list">
            <h3>Patient Messages</h3>
            {loading && patients.length === 0 ? (
              <div className="loading-container">
                <p>Loading patients...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="no-results">No patients found</div>
            ) : (
              filteredPatients.map(patient => (                <div 
                  key={patient.id} 
                  className={`patient-item ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="patient-info">
                    <div className="patient-name">{patient.name}</div>
                    <div className="patient-email">{patient.email}</div>
                    <div className="patient-last-message">{patient.lastMessage}</div>
                    {patient.unread > 0 && (
                      <span className="unread-badge">{patient.unread}</span>
                    )}
                  </div>
                </div>
              ))
            )}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>

        <div className="chat-main">
          {selectedPatient ? (
            <>              <div className="chat-header">
                <div className="patient-info">
                  <div className="patient-name">{selectedPatient.name}</div>
                  <div className="patient-email">{selectedPatient.email}</div>
                </div>
              </div>

              <div className="chat-messages">
                {selectedPatient.messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message ${message.sender === 'admin' ? 'admin-message' : 'patient-message'}`}
                  >
                    <div className="message-content">
                      {message.text && <p>{message.text}</p>}
                      {message.image && (
                        <div className="message-image">
                          <img src={message.image} alt="Prescription" />
                        </div>
                      )}
                    </div>
                    <div className="message-info">
                      <span className="timestamp">{message.timestamp}</span>
                      {message.sender === 'admin' && (
                        <span className="read-status">
                          <i className={`fa ${message.read ? 'fa-check-double' : 'fa-check'}`}></i>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input-area">
                <input 
                  type="text"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <button 
                  className="send-btn" 
                  onClick={handleSendMessage}
                  disabled={loading || !newMessage.trim()}
                >
                  {loading ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-paper-plane"></i>}
                </button>
              </div>
            </>
          ) : (
            <div className="no-patient-selected">
              <p>Select a patient to view their messages</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Alert;