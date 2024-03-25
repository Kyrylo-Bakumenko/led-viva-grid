import React, { useState } from 'react';
import './App.css';
import WebSocketClient from './WebSocketClient';

function App() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!image) {
      alert('No image selected');
      return;
    }
    const formData = new FormData();
    formData.append('image', image);
    try {
      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Image uploaded successfully');
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    }
  };

  return (
    <div className="App">
      <div className="content">
        <h1>Upload an Image</h1>
        <form onSubmit={handleSubmit} className="upload-form">
          {previewUrl && <img src={previewUrl} alt="Preview" className="image-preview" />}
          <input type="file" accept="image/*" onChange={handleImageChange} id="file-upload" />
          <label htmlFor="file-upload" className="file-label">Choose file</label>
          <button type="submit" className="upload-button">Upload Image</button>
        </form>
        <WebSocketClient />
      </div>
    </div>
  );
}

export default App;
