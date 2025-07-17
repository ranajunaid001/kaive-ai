import React, { useState } from 'react';

function AdminPage({ onNavigate }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const creators = [
    { id: 1, name: 'Sarah Chen', title: 'Product Designer at Meta', posts: '1.2K', match: '89%', rating: '4.8', emoji: '👩‍💻' },
    { id: 2, name: 'Alex Kumar', title: 'Tech Founder & CEO', posts: '892', match: '92%', rating: '4.9', emoji: '👨‍💼' },
    { id: 3, name: 'Maria Rodriguez', title: 'Marketing Director', posts: '456', match: '87%', rating: '4.7', emoji: '👩‍🏫' },
  ];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    if (files.length > 0) {
      setUploadedFiles([...uploadedFiles, ...files]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="admin-page">
      {/* Navigation */}
      <nav className="admin-nav">
        <h1 className="logo">Kaive AI</h1>
        <button className="back-btn" onClick={() => onNavigate('home')}>
          Back to Home
        </button>
      </nav>

      <div className="admin-container">
        {/* Hero */}
        <div className="admin-hero">
          <h1>Creator Management</h1>
          <p>Elegantly manage your AI-powered creator voices</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">127</div>
            <div className="stat-label">Creators</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">3.4K</div>
            <div className="stat-label">Generated</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">1.2M</div>
            <div className="stat-label">Data Points</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <h2 className="section-title">Import Creator Data</h2>
          <div 
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-icon">📊</div>
            <h3>Drop Excel files here</h3>
            <p>Import LinkedIn creator profiles with a simple drag</p>
            <label className="upload-btn">
              Select Files
              <input
                type="file"
                multiple
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          
          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              <h3>Uploaded Files:</h3>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  <span>📄 {file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creators Grid */}
        <div className="creators-section">
          <div className="creators-header">
            <h2 className="section-title">Active Creators</h2>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="creators-grid">
            {creators
              .filter(creator => 
                creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                creator.title.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((creator) => (
                <div key={creator.id} className="admin-creator-card">
                  <div className="creator-card-header">
                    <div className="creator-avatar">{creator.emoji}</div>
                    <div className="creator-details">
                      <h3>{creator.name}</h3>
                      <p>{creator.title}</p>
                    </div>
                  </div>
                  
                  <div className="creator-stats">
                    <div className="creator-stat">
                      <span className="creator-stat-value">{creator.posts}</span>
                      <span className="creator-stat-label">Posts</span>
                    </div>
                    <div className="creator-stat">
                      <span className="creator-stat-value">{creator.match}</span>
                      <span className="creator-stat-label">Match</span>
                    </div>
                    <div className="creator-stat">
                      <span className="creator-stat-value">{creator.rating}</span>
                      <span className="creator-stat-label">Rating</span>
                    </div>
                  </div>
                  
                  <div className="creator-actions">
                    <button className="action-btn">View</button>
                    <button className="action-btn">Edit</button>
                    <button className="action-btn delete">Remove</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
