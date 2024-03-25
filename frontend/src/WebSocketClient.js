import React, { useEffect } from 'react';

const WebSocketClient = () => {
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    
    socket.onopen = () => console.log('WebSocket connection established');
    socket.onmessage = (message) => {
      console.log('Message from server:', message.data);
      // Here you can handle the incoming message, such as updating the LED display
    };
    socket.onerror = (error) => console.error('WebSocket error:', error);
    socket.onclose = () => console.log('WebSocket connection closed');
    
    return () => socket.close();
  }, []);

  return null; // This component does not render anything
};

export default WebSocketClient;
