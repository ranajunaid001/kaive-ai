import React, { useState, useEffect } from 'react';
import styles from './HomePage.module.css';

function HomePage({ onNavigate }) {
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const creators = [
    { 
      id: 1, 
      initials: 'SC',
      name: 'Sarah Chen', 
      title: 'Product Designer', 
      tone: 'Minimalist, User-focused', 
      match: 94,
      metrics: { 
        voice: 94,
        authenticity: 96,
        engagement: 92
      }
    },
    { 
      id: 2, 
      initials: 'AK',
      name: 'Alex Kumar', 
      title: 'Tech Founder', 
      tone: 'Visionary, Bold', 
      match: 91,
      metrics: { 
        voice: 91,
        authenticity: 91,
        engagement: 90
      }
    },
    { 
      id: 3, 
      initials: 'MR',
      name: 'Maria Rodriguez', 
      title: 'Marketing Expert', 
      tone: 'Professional, Data-driven', 
      match: 89,
      metrics: { 
        voice: 89,
        authenticity: 89,
        engagement: 88
      }
    },
    { 
      id: 4, 
      initials: 'JP',
      name: 'James Park', 
      title: 'AI Researcher', 
      tone: 'Academic, Precise', 
      match: 87,
      metrics: { 
        voice: 87,
        authenticity: 87,
        engagement: 86
      }
    },
    { 
      id: 5, 
      initials: 'EW',
      name: 'Emma Wilson', 
      title: 'Startup Advisor', 
      tone: 'Strategic, Practical', 
      match: 85,
      metrics: { 
        voice: 85,
        authenticity: 83,
        engagement: 84
      }
    }
  ];

  const testimonials = [
    { text: "Kaive has transformed my LinkedIn game. I write 10x faster while maintaining my authentic voice. Absolutely incredible!", author: "Maria Martin", role: "@maria_martin", social: "twitter" },
    { text: "Just built this awesome content strategy using Kaive! The AI understands context like no other tool I've used.", author: "Gleb Konon", role: "Product Designer", social: "linkedin" },
    { text: "What makes Kaive different is that it actually captures my writing style. It's like having a personal writing assistant.", author: "Richard Manisa", role: "Content Creator", social: "linkedin" },
    { text: "Finally, an AI tool that gets LinkedIn's unique style. My engagement has tripled since using Kaive!", author: "Sarah Chen", role: "Marketing Director", social: "linkedin" },
    { text: "The fastest content creation moment I have ever had. From idea to polished post in under 2 minutes!", author: "Erel Cohen", role: "Entrepreneur", social: "twitter" },
    { text: "Kaive revolutionizes content creation by matching your voice with proven creator styles. Game changer!", author: "Eran Cohen", role: "Growth Expert", social: "linkedin" },
    { text: "Amazing understanding of context and nuance. It's like the AI actually gets what I'm trying to say.", author: "Ariel Mills", role: "Writer", social: "medium" },
    { text: "I've tried every AI writing tool out there. Kaive is the only one that truly understands LinkedIn's voice.", author: "Alex Thompson", role: "CEO & Founder", social: "twitter" }
  ];

  const suggestionPrompts = {
    'Little Win': "Today I closed my first client after 47 cold emails. It's not a million dollar deal, but it's proof that persistence pays off.",
    'Personal Growth': "I used to avoid difficult conversations at all costs. This week I learned that having them early saves everyone time and stress.",
    'Failure': "My product launch flopped with zero sales on day one. Here's what I learned about market validation the hard way.",
    'Learning': "I spent $10K on Facebook ads with terrible results. But the data taught me something valuable about my target audience.",
    'AI Tool': "I just discovered an AI tool that saved me 10 hours this week. Here's how I'm using it to automate my content research process."
  };

  useEffect(() => {
    const words = userInput.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [userInput]);

  const fillSuggestion = (key) => {
    setUserInput(suggestionPrompts[key]);
  };

  const analyzeContent = () => {
    if (wordCount < 20) return;
    
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2500);
  };

  const toggleBubble = (bubble) => {
    if (selectedCreator?.id === bubble.id) {
      setSelectedCreator(null);
    } else {
      setSelectedCreator(bubble);
    }
  };

  const closeBubble = (event, creatorId) => {
    event.stopPropagation();
    if (selectedCreator?.id === creatorId) {
      setSelectedCreator(null);
    }
  };

  const generateContent = () => {
    if (!selectedCreator) return;
    alert(`✨ Content generated in ${selectedCreator.name}'s voice!`);
  };

  const socialIcons = {
    twitter: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" opacity="0.6">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    linkedin: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" opacity="0.6">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    medium: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" opacity="0.6">
        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
      </svg>
    )
  };

  return (
    <div className={styles.homePage}>
      {/* Navigation */}
      <nav className={`${styles.nav} ${styles.glass}`}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <a href="/" className={styles.logo}>
            <div className={styles.logoIcon}>K</div>
            <span>Kaive</span>
          </a>
          <div className={styles.navLinks}>
            <a href="/pricing">Pricing</a>
            <a href="/enterprise">Enterprise</a>
          </div>
        </div>
        <button className={styles.navButton} onClick={() => onNavigate('admin')}>
          Admin
        </button>
      </nav>
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1>Let's make your content a <span className={styles.highlight}>reality.</span><br />Today.</h1>
        <p>Kaive lets you write authentic LinkedIn posts in minutes with your favorite creator's voice. No prompting necessary.</p>
      </section>
      
      {/* Input Card */}
      {!showResults && !isAnalyzing && (
        <>
          <div className={styles.inputCard}>
            <textarea 
              className={styles.inputArea}
              placeholder="What do you want to write about?"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              autoFocus
            />
            <button 
              className={`${styles.sendBtn} ${wordCount >= 20 ? styles.active : ''}`}
              onClick={analyzeContent}
              disabled={wordCount < 20}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M7 11L12 6L17 11M12 6V18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <div className={styles.suggestions}>
              <div className={styles.suggestionsLabel}>Not sure where to start? Try one of these:</div>
              <div className={styles.suggestionPills}>
                <div className={styles.pill} onClick={() => fillSuggestion('Little Win')}>Little Win</div>
                <div className={styles.pill} onClick={() => fillSuggestion('Personal Growth')}>Personal Growth</div>
                <div className={styles.pill} onClick={() => fillSuggestion('Failure')}>Failure</div>
                <div className={styles.pill} onClick={() => fillSuggestion('Learning')}>Learning Experience</div>
                <div className={styles.pill} onClick={() => fillSuggestion('AI Tool')}>AI Tool</div>
              </div>
            </div>
          </div>
          
          {/* Trust Section */}
          <div className={styles.trustSection}>
            <div className={styles.trustAvatars}>
              <div className={styles.avatar} style={{ background: '#2196F3' }}>JW</div>
              <div className={styles.avatar} style={{ background: '#FF6B35' }}>SB</div>
              <div className={styles.avatar} style={{ background: '#2196F3' }}>DB</div>
            </div>
            <span style={{ fontSize: '14px', color: '#1a1a1a', opacity: 0.7 }}>Trusted by 50K+ writers</span>
          </div>
        </>
      )}
      
      {/* Loading State */}
      {isAnalyzing && (
        <div className={`${styles.loading} ${styles.show}`}>
          <div className={styles.spinner}></div>
          <h3 style={{ fontSize: '24px', color: '#1a1a1a', marginBottom: '8px' }}>Analyzing your writing style</h3>
          <p style={{ color: '#666' }}>Finding the perfect creator match...</p>
        </div>
      )}
      
      {/* Results Section */}
      {showResults && (
        <div className={`${styles.resultsSection} ${styles.show}`}>
          <div className={styles.resultsHeader}>
            <h2>Select your voice</h2>
            <p>Choose a creator whose style resonates with your content</p>
          </div>
          
          <div className={styles.container}>
            {creators.map((creator, index) => (
              <div 
                key={creator.id}
                className={`${styles.bubble} ${selectedCreator?.id === creator.id ? styles.expanded : styles.circle} ${selectedCreator && selectedCreator.id !== creator.id ? styles.pushedBack : ''}`}
                data-match={creator.match}
                onClick={() => toggleBubble(creator)}
                style={{
                  animationDelay: `${index * 0.5}s`,
                  left: `${[10, 70, 45, 20, 75][index]}%`,
                  top: `${[20, 15, 40, 65, 60][index]}%`
                }}
              >
                <button 
                  className={styles.closeBtn} 
                  onClick={(e) => closeBubble(e, creator.id)}
                >
                  ×
                </button>
                <div className={styles.initials}>{creator.initials}</div>
                <div className={styles.name}>{creator.name}</div>
                <div className={styles.title}>{creator.title}</div>
                <div className={styles.match}>{creator.match}% match</div>
                
                <div className={styles.expandedContent}>
                  <div className={styles.divider}></div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Voice Match</div>
                    <div className={styles.metricBar}>
                      <div className={styles.metricFill} style={{ width: `${creator.metrics.voice}%` }}></div>
                    </div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Authenticity</div>
                    <div className={styles.metricBar}>
                      <div className={styles.metricFill} style={{ width: `${creator.metrics.authenticity}%` }}></div>
                    </div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Engagement</div>
                    <div className={styles.metricBar}>
                      <div className={styles.metricFill} style={{ width: `${creator.metrics.engagement}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <button 
              className={`${styles.btn} ${styles.btnDark}`}
              disabled={!selectedCreator}
              onClick={generateContent}
            >
              {selectedCreator ? `Generate as ${selectedCreator.name}` : 'Select a creator to continue'}
            </button>
          </div>
        </div>
      )}
      
      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <div className={styles.testimonialsContainer}>
          {/* Row 1 - Scrolling Left */}
          <div className={`${styles.testimonialRow} ${styles.row1}`}>
            {[...testimonials.slice(0, 4), ...testimonials.slice(0, 4)].map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <p className={styles.testimonialContent}>{t.text}</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.authorInfo}>
                    <div 
                      className={styles.authorAvatar}
                      style={{ backgroundImage: `url(https://i.pravatar.cc/150?img=${(i % 4) + 1})` }}
                    ></div>
                    <div className={styles.authorDetails}>
                      <h4>{t.author}</h4>
                      <p>{t.role}</p>
                    </div>
                  </div>
                  <div className={styles.socialIcon}>
                    {socialIcons[t.social]}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Row 2 - Scrolling Right */}
          <div className={`${styles.testimonialRow} ${styles.row2}`}>
            {[...testimonials.slice(4, 8), ...testimonials.slice(4, 8)].map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <p className={styles.testimonialContent}>{t.text}</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.authorInfo}>
                    <div 
                      className={styles.authorAvatar}
                      style={{ backgroundImage: `url(https://i.pravatar.cc/150?img=${(i % 4) + 5})` }}
                    ></div>
                    <div className={styles.authorDetails}>
                      <h4>{t.author}</h4>
                      <p>{t.role}</p>
                    </div>
                  </div>
                  <div className={styles.socialIcon}>
                    {socialIcons[t.social]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
