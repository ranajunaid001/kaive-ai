import React, { useState } from 'react';

function HomePage({ onNavigate }) {
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [writingText, setWritingText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBubbles, setShowBubbles] = useState(true);

  const creators = [
    { 
      id: 1, 
      name: 'Sarah Chen', 
      title: 'Product Designer', 
      tone: 'Minimalist, User-focused', 
      emoji: '👩‍💻',
      match: 94,
      avatar: 'https://res.cloudinary.com/dozrtbvmz/image/upload/v1752800602/Niharikka_y1octi.jpg',
      color: '#FF6B6B',
      size: 'large',
      position: { left: '15%', top: '20%' },
      metrics: { pulse: 92, aura: 95, auth: 96 }
    },
    { 
      id: 2, 
      name: 'Alex Kumar', 
      title: 'Tech Founder', 
      tone: 'Visionary, Bold', 
      emoji: '👨‍💼',
      match: 91,
      avatar: '',
      color: '#4ECDC4',
      size: 'medium',
      position: { left: '70%', top: '15%' },
      metrics: { pulse: 90, aura: 92, auth: 91 }
    },
    { 
      id: 3, 
      name: 'Maria Rodriguez', 
      title: 'Marketing Expert', 
      tone: 'Professional, Data-driven', 
      emoji: '👩‍🏫',
      match: 89,
      avatar: '',
      color: '#45B7D1',
      size: 'large',
      position: { left: '50%', top: '40%' },
      metrics: { pulse: 88, aura: 90, auth: 89 }
    },
    { 
      id: 4, 
      name: 'James Park', 
      title: 'AI Researcher', 
      tone: 'Academic, Precise', 
      emoji: '👨‍🔬',
      match: 87,
      avatar: '',
      color: '#96CEB4',
      size: 'small',
      position: { left: '25%', top: '60%' },
      metrics: { pulse: 86, aura: 88, auth: 87 }
    },
    { 
      id: 5, 
      name: 'Emma Wilson', 
      title: 'Startup Advisor', 
      tone: 'Strategic, Practical', 
      emoji: '👩‍💼',
      match: 85,
      avatar: '',
      color: '#6C5CE7',
      size: 'medium',
      position: { left: '75%', top: '55%' },
      metrics: { pulse: 84, aura: 87, auth: 83 }
    }
  ];

  const handleBubbleClick = (creator) => {
    setSelectedCreator(creator);
  };

  const handleGenerate = () => {
    if (!writingText.trim() || !selectedCreator) return;
    
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(`✨ Generated content in ${selectedCreator.name}'s voice!`);
    }, 2000);
  };

  const handleCloseWriting = () => {
    setSelectedCreator(null);
    setWritingText('');
  };

  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          <h1 className="logo">Kaive AI</h1>
          <button className="nav-button" onClick={() => onNavigate('admin')}>
            Admin
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="header">
        <h2>Write in any creator's voice</h2>
        <p>Powered by AI</p>
      </header>

      {/* Floating Bubbles */}
      {showBubbles && (
        <div className="bubbles-container">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className={`bubble bubble-${creator.size} ${selectedCreator?.id === creator.id ? 'selected' : ''}`}
              style={{ left: creator.position.left, top: creator.position.top }}
              onClick={() => handleBubbleClick(creator)}
            >
              <div className="bubble-content">
                <div 
                  className="bubble-avatar" 
                  style={creator.avatar ? 
                    { backgroundImage: `url(${creator.avatar})` } : 
                    { background: creator.color }
                  }
                >
                  {!creator.avatar && creator.emoji}
                </div>
                <div className="bubble-name">{creator.name}</div>
                <div className="bubble-match">{creator.match}% match</div>
                
                {selectedCreator?.id === creator.id && (
                  <div className="bubble-metrics">
                    <div className="metric-item">
                      <div className="metric-label">Match Pulse</div>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{ width: `${creator.metrics.pulse}%` }}></div>
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-label">Voice Aura</div>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{ width: `${creator.metrics.aura}%` }}></div>
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-label">Authenticity</div>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{ width: `${creator.metrics.auth}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creator Pills */}
      <div className="creator-pills">
        <div className="avatar-group">
          <span className="avatar">👤</span>
          <span className="avatar">👤</span>
          <span className="avatar">👤</span>
        </div>
        <span className="creator-count">Join 350+ creators</span>
      </div>

      {/* Writing Panel */}
      <div className={`writing-panel ${selectedCreator ? 'active' : ''}`}>
        {selectedCreator && (
          <>
            <div className="writing-panel-header">
              <div className="writing-creator-info">
                <div className="creator-avatar" style={{ background: selectedCreator.color }}>
                  {selectedCreator.emoji}
                </div>
                <div>
                  <h3>{selectedCreator.name}</h3>
                  <p>Writing in {selectedCreator.name}'s voice</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseWriting}>×</button>
            </div>
            
            <textarea
              className="writing-textarea"
              placeholder={`What would you like ${selectedCreator.name} to write about?`}
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              autoFocus
            />
            
            <div className="writing-footer">
              <span className="tone-indicator">Tone: {selectedCreator.tone}</span>
              <button 
                className="generate-btn" 
                onClick={handleGenerate}
                disabled={!writingText || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="loading-spinner">⟳</span> Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
