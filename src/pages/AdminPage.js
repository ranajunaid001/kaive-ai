import React, { useState, useEffect } from 'react';
import styles from './AdminPage.module.css';

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
  const [uploadStatus, setUploadStatus] = useState(null);

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
      
      // Initial status
      setUploadStatus({
        stage: 'uploading',
        message: `📤 Uploading "${file.name}"...`
      });

      const response = await fetch('https://kaive-ai-production-7be5.up.railway.app/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('Upload result:', result);

      if (result.status === 'processing' && result.file_id) {
        // Poll for status updates
        const checkStatus = async () => {
          try {
            const statusResponse = await fetch(`https://kaive-ai-production-7be5.up.railway.app/processing-status/${result.file_id}`);
            const statusData = await statusResponse.json();
            
            switch(statusData.status) {
              case 'posts_saved':
                setUploadStatus({
                  stage: 'posts_saved',
                  message: `✅ Stage 1 Complete: ${statusData.total_posts} posts uploaded to database\n⏳ Stage 2: Generating voice profiles...`,
                  posts: statusData.total_posts,
                  newPosts: statusData.new_posts,
                  duplicates: statusData.duplicate_posts
                });
                return false; // Keep polling
                
              case 'completed':
                setUploadStatus({
                  stage: 'completed',
                  message: `✅ Stage 1 Complete: ${statusData.total_posts} posts uploaded to database\n✅ Stage 2 Complete: Voice profiles created\n🎉 File processing complete!`,
                  posts: statusData.total_posts,
                  newPosts: statusData.new_posts,
                  duplicates: statusData.duplicate_posts,
                  voiceProfiles: statusData.voice_profiles_count
                });
                fetchStats(); // Refresh stats
                return true; // Stop polling
                
              case 'voice_profile_failed':
                setUploadStatus({
                  stage: 'partial_success',
                  message: `✅ Stage 1 Complete: ${statusData.total_posts} posts uploaded to database\n❌ Stage 2 Failed: Voice profile generation error`,
                  posts: statusData.total_posts,
                  newPosts: statusData.new_posts,
                  duplicates: statusData.duplicate_posts
                });
                return true; // Stop polling
                
              case 'failed':
                setUploadStatus({
                  stage: 'failed',
                  message: `❌ Processing failed for ${file.name}`
                });
                return true; // Stop polling
                
              default:
                return false; // Keep polling
            }
          } catch (error) {
            console.error('Status check error:', error);
            return false;
          }
        };

        // Check status immediately
        await checkStatus();
        
        // Then check every 2 seconds
        const interval = setInterval(async () => {
          const isDone = await checkStatus();
          if (isDone) {
            clearInterval(interval);
            setIsUploading(false);
            
            // Keep success message visible for 10 seconds
            setTimeout(() => {
              setUploadStatus(null);
            }, 10000);
          }
        }, 2000);

        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(interval);
          setIsUploading(false);
          setUploadStatus(prev => ({
            ...prev,
            message: prev.message + '\n⚠️ Processing is taking longer than expected. Check back later.'
          }));
        }, 120000);
        
      } else {
        setUploadStatus({
          stage: 'failed',
          message: `❌ Error: ${result.detail || 'Upload failed'}`
        });
        setIsUploading(false);
        
        // Clear error after 5 seconds
        setTimeout(() => {
          setUploadStatus(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        stage: 'failed',
        message: `❌ Error uploading file: ${error.message}`
      });
      setIsUploading(false);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setUploadStatus(null);
      }, 5000);
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
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')
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
    <div className={styles.adminPage}>
      {/* Navigation */}
      <nav className={styles.adminNav}>
        <h1 className={styles.logo}>Kaive AI</h1>
        <button className={styles.backBtn} onClick={() => onNavigate('home')}>
          Back to Home
        </button>
      </nav>

      <div className={styles.container}>
        {/* Hero */}
        <div className={styles.adminHero}>
          <h1>Creator Management</h1>
          <p>Elegantly manage your AI-powered creator voices</p>
        </div>

        {/* Stats - Now showing real data */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.unique_authors}</div>
            <div className={styles.statLabel}>Creators</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.total_posts.toLocaleString()}</div>
            <div className={styles.statLabel}>Posts</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.files_processed}</div>
            <div className={styles.statLabel}>Files</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>98%</div>
            <div className={styles.statLabel}>Accuracy</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className={styles.uploadSection}>
          <h2 className={styles.sectionTitle}>Import Creator Data</h2>
          <div 
            className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className={styles.uploadIcon}>📊</div>
            <h3>{isUploading ? 'Processing...' : 'Drop Excel files here'}</h3>
            <p>{isUploading ? 'Please wait while we process your file' : 'Import LinkedIn creator profiles with a simple drag'}</p>
            <label className={styles.uploadBtn} style={{ opacity: isUploading ? 0.5 : 1, pointerEvents: isUploading ? 'none' : 'auto' }}>
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

          {/* Status Messages */}
          {uploadStatus && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: uploadStatus.stage === 'failed' ? '#fee2e2' : '#f3f4f6',
              borderRadius: '12px',
              border: uploadStatus.stage === 'failed' ? '1px solid #fecaca' : '1px solid #e5e7eb',
              whiteSpace: 'pre-line'
            }}>
              {uploadStatus.message}
              
              {/* Show additional details if available */}
              {uploadStatus.newPosts !== undefined && uploadStatus.duplicates !== undefined && (
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
                  {uploadStatus.newPosts > 0 && `• ${uploadStatus.newPosts} new posts added`}
                  {uploadStatus.duplicates > 0 && uploadStatus.newPosts > 0 && <br />}
                  {uploadStatus.duplicates > 0 && `• ${uploadStatus.duplicates} duplicate posts skipped`}
                </div>
              )}
            </div>
          )}

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className={styles.uploadedFiles}>
              <h3>Uploaded Files:</h3>
              {uploadedFiles.map((file, index) => (
                <div key={index} className={styles.fileItem}>
                  <span>📄 {file.name}</span>
                  <span className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creators Grid */}
        <div className={styles.creatorsSection}>
          <div className={styles.creatorsHeader}>
            <h2 className={styles.sectionTitle}>Active Creators</h2>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.creatorsGrid}>
            {creators
              .filter(creator => 
                creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                creator.title.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((creator) => (
                <div key={creator.id} className={styles.creatorCard}>
                  <div className={styles.creatorCardHeader}>
                    <div className={styles.creatorAvatar}>{creator.emoji}</div>
                    <div className={styles.creatorDetails}>
                      <h3>{creator.name}</h3>
                      <p>{creator.title}</p>
                    </div>
                  </div>

                  <div className={styles.creatorStats}>
                    <div className={styles.creatorStat}>
                      <span className={styles.creatorStatValue}>{creator.posts}</span>
                      <span className={styles.creatorStatLabel}>Posts</span>
                    </div>
                    <div className={styles.creatorStat}>
                      <span className={styles.creatorStatValue}>{creator.match}</span>
                      <span className={styles.creatorStatLabel}>Match</span>
                    </div>
                    <div className={styles.creatorStat}>
                      <span className={styles.creatorStatValue}>{creator.rating}</span>
                      <span className={styles.creatorStatLabel}>Rating</span>
                    </div>
                  </div>

                  <div className={styles.creatorActions}>
                    <button className={styles.actionBtn}>View</button>
                    <button className={styles.actionBtn}>Edit</button>
                    <button className={`${styles.actionBtn} ${styles.delete}`}>Remove</button>
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
