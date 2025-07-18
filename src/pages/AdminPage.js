import React, { useState } from 'react';

function AdminPage({ onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const stats = [
    { label: 'Total Creators', value: '127' },
    { label: 'Voice Samples', value: '3,452' },
    { label: 'Active Users', value: '8,291' },
    { label: 'Generated Posts', value: '45.2K' }
  ];

  const creators = [
    { id: 1, name: 'Sarah Chen', title: 'Product Designer', posts: 245, engagement: '8.7%' },
    { id: 2, name: 'Alex Kumar', title: 'Tech Founder', posts: 189, engagement: '12.3%' },
    { id: 3, name: 'Maria Rodriguez', title: 'Marketing Expert', posts: 312, engagement: '9.1%' },
    { id: 4, name: 'James Park', title: 'AI Researcher', posts: 156, engagement: '7.5%' },
    { id: 5, name: 'Emma Wilson', title: 'Startup Advisor', posts: 203, engagement: '10.2%' },
    { id: 6, name: 'David Lee', title: 'Content Creator', posts: 178, engagement: '11.5%' }
  ];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB'
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB'
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page">
      {/* Navigation */}
      <nav className="admin-nav">
        <h1 className="logo">Kaive AI Admin</h1>
        <button className="back-btn" onClick={() => onNavigate('home')}>
          ← Back to App
        </button>
      </nav>

      <div className="admin-container">
        {/* Hero Section */}
        <div className="admin-hero">
          <h1>Creator Dashboard</h1>
          <p>Manage voices, upload samples, and track performance</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-number">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <h2 className="section-title">Upload Voice Samples</h2>
          <div 
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <div className="upload-icon">📁</div>
            <h3>Drop files here or click to upload</h3>
            <p>Support for text files, PDFs, and voice notes</p>
            <button className="upload-btn">Choose Files</button>
            <input 
              id="fileInput"
              type="file" 
              multiple 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              <h3>Uploaded Files ({uploadedFiles.length})</h3>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="file-item">
                  <span>{file.name}</span>
                  <span className="file-size">{file.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creators Section */}
        <div className="creators-section">
          <div className="creators-header">
            <h2 className="section-title">Manage Creators</h2>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text"
                className="search-input"
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="creators-grid">
            {filteredCreators.map((creator) => (
              <div key={creator.id} className="admin-creator-card">
                <div className="creator-card-header">
                  <div className="creator-avatar">👤</div>
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
                    <span className="creator-stat-value">{creator.engagement}</span>
                    <span className="creator-stat-label">Engagement</span>
                  </div>
                </div>
                
                <div className="creator-actions">
                  <button className="action-btn">Edit</button>
                  <button className="action-btn">Train</button>
                  <button className="action-btn delete">Delete</button>
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
