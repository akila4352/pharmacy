// filepath: d:\HD Final Project\pharmacy\src\components\home\Prescription\chat-with-admin.jsx
import React, { useState, useEffect } from "react";
import Header from "../../common/header/Header";
import "./chat-with-admin.css";

const ChatWithAdmin = () => {
  // State for user data
  const [user, setUser] = useState(null);
  // State for chat messages
  const [messages, setMessages] = useState([]);
  // State for new message text
  const [newMessage, setNewMessage] = useState("");
  // State for image upload
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  useEffect(() => {
    // Get user data from localStorage when component mounts
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if ((newMessage.trim() || selectedImage) && user) {
      const newMsg = {
        id: Date.now(),
        text: newMessage,
        sender: user.firstName + " " + user.lastName,
        timestamp: new Date().toLocaleTimeString(),
        image: imagePreview,
      };

      setMessages([...messages, newMsg]);
      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);

      // In a real application, you would send this data to your backend here
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Clear selected image
  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <>
      <Header />
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="user-info">
            <div className="user-avatar">
              <span>{user?.firstName ? user.firstName[0] : 'U'}</span>
            </div>
            <div className="user-details">
              <h3>{user?.firstName} {user?.lastName}</h3>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="chat-title">
            <h2>Chat with Admin</h2>
            <p>Send your prescription and queries</p>
          </div>
        </div>

        <div className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="message user-message">
                  <div className="message-info">
                    <span className="sender">{msg.sender}</span>
                    <span className="timestamp">{msg.timestamp}</span>
                  </div>
                  {msg.text && <p className="message-text">{msg.text}</p>}
                  {msg.image && (
                    <div className="message-image">
                      <img src={msg.image} alt="Prescription" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="chat-input-area">
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button className="remove-image" onClick={handleClearImage}>
                  &times;
                </button>
              </div>
            )}

            <div className="input-actions">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
              <label htmlFor="image-upload" className="upload-btn">
                <i className="fa fa-paperclip"></i> Attach Prescription
              </label>
              
              <div className="message-input-wrapper">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button className="send-btn" onClick={handleSendMessage}>
                  <i className="fa fa-paper-plane"></i> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWithAdmin;