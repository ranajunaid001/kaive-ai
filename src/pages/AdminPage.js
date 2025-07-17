import React, { useState, useEffect } from 'react';

function AdminPage({ onNavigate }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [stats, setStats] = useState({
    total_posts: 0,
    unique_authors: 0,
    files_processed: 0
  });
  const [isUploading, setIsUploading] = useState(false);

  const creators = [
    { id: 1, name: 'Sarah Chen', title: 'Product Designer at Meta', posts: '1.2K', match: '89%', rating: '4.8', emoji: '👩‍💻' },
    { id: 2, name: 'Alex Kumar', title: 'Tech Founder & CEO', posts: '892', match: '92%', rating: '4.9', emoji: '👨‍💼' },
    { id: 3, name: 'Maria Rodriguez', title: 'Marketing Director', posts: '456', match: '87%', rating: '4.7', emoji: '👩‍🏫' },
  ];

  // Fetch stats when component mounts
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('https://kaive-ai-production-7be5.up.railway.app/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsUploading(true);
      const response = await fetch('https://kaive-ai-production-7be5.up.railway.app/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('Upload result:', result);
      
      if (result.status === 'success') {
        alert(`Successfully processed ${result.processed_posts} posts from ${file.name}`);
        fetchStats(); // Refresh stats after upload
      } else {
        alert(`Error: ${result.detail || 'Upload failed'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles([...uploadedFiles, ...files]);
    
    // Upload each file
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (files.length > 0) {
      setUploadedFiles([...uploadedFiles, ...files]);
      
      // Upload each file
      for (const file of files) {
        await uploadFile(file);
      }
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

        {/* Stats - Now showing real data */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.unique_authors}</div>
            <div className="stat-label">Creators</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_posts}</div>
            <div className="stat-label">Posts</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.files_processed}</div>
            <div className="stat-label">Files</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98%</div>
            <div className="stat-label">Accuracy</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <h2 className="section-title">Import Creator Data</h2>
          <div 
            className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-icon">📊</div>
            <h3>{isUploading ? 'Processing...' : 'Drop Excel files here'}</h3>
            <p>{isUploading ? 'Please wait while we process your file' : 'Import LinkedIn creator profiles with a simple drag'}</p>
            <label className="upload-btn" style={{ opacity: isUploading ? 0.5 : 1, pointerEvents: isUploading ? 'none' : 'auto' }}>
              {isUploading ? 'Processing...' : 'Select Files'}
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isUploading}
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
