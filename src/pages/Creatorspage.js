import React, { useState, useEffect } from 'react';
import styles from './CreatorsPage.module.css';

function CreatorsPage({ onNavigate }) {
  const [creators, setCreators] = useState([]);
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('posts'); // posts, engagement, recent

  // Fetch creators when component mounts
  useEffect(() => {
    fetchCreators();
  }, []);

  // Filter creators when search query changes
  useEffect(() => {
    const filtered = creators.filter(creator => 
      creator.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (creator.headline && creator.headline.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (creator.location && creator.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch(sortBy) {
        case 'posts':
          return b.post_count - a.post_count;
        case 'engagement':
          return b.avg_engagement - a.avg_engagement;
        case 'recent':
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return 0;
      }
    });
    
    setFilteredCreators(sorted);
  }, [searchQuery, creators, sortBy]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://kaive-ai-production-7be5.up.railway.app/api/creators');
      
      if (!response.ok) {
        throw new Error('Failed to fetch creators');
      }
      
      const data = await response.json();
      setCreators(data.data || []);
      setFilteredCreators(data.data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorClick = (creator) => {
    // Navigate to individual creator page
    // You can implement this based on your routing setup
    console.log('Navigate to creator:', creator.author);
    // onNavigate(`creator/${encodeURIComponent(creator.author)}`);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={styles.creatorsPage}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <h1 className={styles.logo}>Kaive AI</h1>
          <button className={styles.backBtn} onClick={() => onNavigate('home')}>
            ← Back
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Creator Directory</h1>
          <p>Discover and analyze top LinkedIn creators</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search creators by name, headline, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filters}>
            <span className={styles.filterLabel}>Sort by:</span>
            <button 
              className={`${styles.filterBtn} ${sortBy === 'posts' ? styles.active : ''}`}
              onClick={() => setSortBy('posts')}
            >
              Most Posts
            </button>
            <button 
              className={`${styles.filterBtn} ${sortBy === 'engagement' ? styles.active : ''}`}
              onClick={() => setSortBy('engagement')}
            >
              Highest Engagement
            </button>
            <button 
              className={`${styles.filterBtn} ${sortBy === 'recent' ? styles.active : ''}`}
              onClick={() => setSortBy('recent')}
            >
              Recently Added
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{creators.length}</span>
          <span className={styles.statLabel}>Total Creators</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{filteredCreators.length}</span>
          <span className={styles.statLabel}>Showing</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>
            {formatNumber(creators.reduce((sum, c) => sum + c.post_count, 0))}
          </span>
          <span className={styles.statLabel}>Total Posts</span>
        </div>
      </div>

      {/* Creators Grid */}
      <div className={styles.container}>
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading creators...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>❌ {error}</p>
            <button onClick={fetchCreators} className={styles.retryBtn}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredCreators.length === 0 && (
          <div className={styles.noResults}>
            <p>No creators found matching "{searchQuery}"</p>
          </div>
        )}

        {!loading && !error && filteredCreators.length > 0 && (
          <div className={styles.creatorsGrid}>
            {filteredCreators.map((creator) => (
              <div 
                key={creator.id} 
                className={styles.creatorCard}
                onClick={() => handleCreatorClick(creator)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.author} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {creator.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.creatorInfo}>
                    <h3>{creator.author}</h3>
                    {creator.headline && (
                      <p className={styles.headline}>{creator.headline}</p>
                    )}
                    {creator.location && (
                      <p className={styles.location}>📍 {creator.location}</p>
                    )}
                  </div>
                </div>

                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{formatNumber(creator.post_count)}</span>
                    <span className={styles.statName}>Posts</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{formatNumber(creator.avg_likes)}</span>
                    <span className={styles.statName}>Avg Likes</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{formatNumber(creator.avg_engagement)}</span>
                    <span className={styles.statName}>Engagement</span>
                  </div>
                </div>

                {creator.voice_profiles_count > 0 && (
                  <div className={styles.badge}>
                    <span className={styles.voiceProfileBadge}>
                      🎯 {creator.voice_profiles_count} Voice Profiles
                    </span>
                  </div>
                )}

                <div className={styles.cardFooter}>
                  <button className={styles.viewBtn}>
                    View Profile →
                  </button>
                  {creator.linkedin_url && (
                    <a 
                      href={creator.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.linkedinBtn}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>in</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreatorsPage;
