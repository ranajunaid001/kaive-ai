import React, { useState } from 'react';

function HomePage({ onNavigate }) {
  const [showCreatorList, setShowCreatorList] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [writingText, setWritingText] = useState('');
  const [showWritingFirst, setShowWritingFirst] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);

  const creators = [
    { id: 1, name: 'Sarah Chen', title: 'Product Designer', tone: 'Minimalist, User-focused, Technical', emoji: '👩‍💻' },
    { id: 2, name: 'Alex Kumar', title: 'Tech Founder', tone: 'Visionary, Bold, Inspirational', emoji: '👨‍💼' },
    { id: 3, name: 'Maria Rodriguez', title: 'Marketing Expert', tone: 'Professional, Engaging, Data-driven', emoji: '👩‍🏫' },
    { id: 4, name: 'James Park', title: 'AI Researcher', tone: 'Academic, Precise, Forward-thinking', emoji: '👨‍🔬' },
    { id: 5, name: 'Emma Wilson', title: 'Startup Advisor', tone: 'Strategic, Practical, Growth-oriented', emoji: '👩‍💼' },
  ];

  const handleCreatorClick = (index) => {
    setCarouselIndex(index);
    setSelectedCreator(creators[index]);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(`Generated content in ${selectedCreator.name}'s voice!`);
    }, 2000);
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
      
      {/* Find Creators Button */}
      <div className="find-creators-container">
        <button className="find-creators-btn" onClick={() => setShowCreatorList(true)}>
          🔍 Find Creators
        </button>
        
        {/* Creator Pills */}
        <div className="creator-pills">
          <div className="avatar-group">
            <span className="avatar">👤</span>
            <span className="avatar">👤</span>
            <span className="avatar">👤</span>
          </div>
          <span className="creator-count">Join 350+ creators</span>
        </div>
      </div>

      {/* Carousel */}
      <div className="carousel-section">
        <div className="carousel-track">
          {creators.map((creator, index) => (
            <div
              key={creator.id}
              className={`creator-card ${index === carouselIndex ? 'active' : ''}`}
              onClick={() => handleCreatorClick(index)}
            >
              <div className="creator-thumbnail">
                <div className="play-icon">
                  <span className="play-arrow">▶</span>
                </div>
              </div>
              <div className="creator-info">
                <div className="creator-name">{creator.name}</div>
                <div className="creator-title">{creator.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="nav-dots">
        {creators.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === carouselIndex ? 'active' : ''}`}
            onClick={() => setCarouselIndex(index)}
          />
        ))}
      </div>

      {/* Creator Selection Modal */}
      {showCreatorList && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowCreatorList(false)}>×</button>
            <h2>Choose Your Path</h2>
            <p>Select a creator first or write and let AI suggest</p>
            
            <div className="options-grid">
              {/* Option 1: Choose Creator */}
              <div className="option">
                <h3>🎯 Choose Creator First</h3>
                <p>Browse creators and write in their unique voice</p>
                <div className="creator-list">
                  {creators.map((creator) => (
                    <button
                      key={creator.id}
                      className="creator-option"
                      onClick={() => {
                        setSelectedCreator(creator);
                        setShowCreatorList(false);
                      }}
                    >
                      <span className="creator-emoji">{creator.emoji}</span>
                      <div className="creator-option-info">
                        <div className="creator-option-name">{creator.name}</div>
                        <div className="creator-option-title">{creator.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Option 2: Write First */}
              <div className="option">
                <h3>✍️ Write First</h3>
                <p>Start writing and AI will suggest the best creator voice</p>
                <button
                  className="write-first-btn"
                  onClick={() => {
                    setShowWritingFirst(true);
                    setShowCreatorList(false);
                  }}
                >
                  Start Writing →
                </button>
                <div className="ai-features">
                  <div className="ai-feature">✨ AI analyzes your content</div>
                  <div className="ai-feature">🎯 Matches writing style</div>
                  <div className="ai-feature">💡 Suggests best creator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Writing Panel */}
      <div className={`writing-panel ${selectedCreator || showWritingFirst ? 'active' : ''}`}>
        {selectedCreator ? (
          <>
            <div className="writing-panel-header">
              <div className="writing-creator-info">
                <div className="creator-avatar">{selectedCreator.emoji}</div>
                <div>
                  <h3>{selectedCreator.name}</h3>
                  <p>Writing in {selectedCreator.name}'s voice</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => {
                setSelectedCreator(null);
                setWritingText('');
              }}>×</button>
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
        ) : showWritingFirst ? (
          <>
            <div className="writing-panel-header">
              <div>
                <h3>Start Writing</h3>
                <p>Write your content and AI will suggest the best creator voice</p>
              </div>
              <button className="close-btn" onClick={() => {
                setShowWritingFirst(false);
                setWritingText('');
              }}>×</button>
            </div>
            
            <textarea
              className="writing-textarea"
              placeholder="What would you like to write about?"
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              autoFocus
            />
            
            {writingText.length > 50 && (
              <div className="ai-suggestion-area">
                <button className="analyze-btn">
                  🤖 Analyze & Suggest Best Voice
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default HomePage;
