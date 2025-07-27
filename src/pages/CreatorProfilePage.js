import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './CreatorProfilePage.module.css';

function CreatorProfilePage({ onNavigate }) {
  const { creatorName } = useParams();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true);
        
        // Fetch creator details
        const creatorResponse = await fetch(
          `https://kaive-ai-production-7be5.up.railway.app/api/creators/${encodeURIComponent(creatorName)}`
        );
        
        if (!creatorResponse.ok) {
          throw new Error('Creator not found');
        }
        
        const creatorData = await creatorResponse.json();
        setCreator(creatorData.data);
        
        // Fetch creator posts
        const postsResponse = await fetch(
          `https://kaive-ai-production-7be5.up.railway.app/api/creators/${encodeURIComponent(creatorName)}/posts`
        );
        
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData.data || []);
        }
        
      } catch (error) {
        console.error('Error fetching creator data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (creatorName) {
      fetchCreatorData();
    }
  }, [creatorName]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    // Add ordinal suffix to day
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleLinkedInClick = () => {
    if (creator?.linkedin_url) {
      window.open(creator.linkedin_url, '_blank');
    }
  };

  const handleViewPost = (postUrl) => {
    if (postUrl) {
      window.open(postUrl, '_blank');
    }
  };

  const handleCopyPost = async (postContent) => {
    try {
      await navigator.clipboard.writeText(postContent);
      // You can add a toast notification here if you have one
      console.log('Post copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSavePost = (postId) => {
    // TODO: Implement save functionality
    console.log('Save post:', postId);
  };

  const handleRepurposePost = (postId) => {
    // TODO: Implement repurpose functionality
    console.log('Repurpose post:', postId);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading creator profile...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className={styles.errorContainer}>
        <h2>Creator not found</h2>
        <p>{error || 'The creator you are looking for does not exist.'}</p>
        <button onClick={() => onNavigate('creators')} className={styles.backButton}>
          Back to Creators
        </button>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navLogo} onClick={() => onNavigate('home')}>
            <div className={styles.navLogoIcon}>K</div>
            <span>Kaive</span>
          </div>
          <button className={styles.backBtn} onClick={() => onNavigate('creators')}>
            ← Back to Creators
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className={styles.mainContainer}>
        {/* Creator Profile - Fixed Left */}
        <aside className={styles.creatorProfile}>
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.profileAvatar}>
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creator.author} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {creator.author.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={styles.profileInfo}>
                <h1 className={styles.profileName}>{creator.author}</h1>
                {creator.headline && (
                  <p className={styles.profileTagline}>{creator.headline}</p>
                )}
              </div>
            </div>

            <div className={styles.profileMeta}>
              {creator.location && (
                <div className={styles.metaItem}>
                  <svg className={styles.metaIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{creator.location}</span>
                </div>
              )}
            </div>

            <div className={styles.profileStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{formatNumber(creator.followers_count || 0)}</span>
                <span className={styles.statLabel}>Followers</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{formatNumber(creator.post_count)}</span>
                <span className={styles.statLabel}>Posts</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{formatNumber(creator.avg_likes)}</span>
                <span className={styles.statLabel}>Avg Likes</span>
              </div>
            </div>

            {creator.linkedin_url && (
              <button className={styles.linkedinButton} onClick={handleLinkedInClick}>
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                View LinkedIn Profile
              </button>
            )}
          </div>
        </aside>

        {/* Posts Section */}
        <main className={styles.postsSection}>
          <div className={styles.postsHeader}>
            <h2>Recent Posts</h2>
            <span className={styles.postCount}>{posts.length} posts</span>
          </div>

          {posts.length === 0 ? (
            <div className={styles.noPosts}>
              <p>No posts available for this creator.</p>
            </div>
          ) : (
            <div className={styles.postsGrid}>
              {posts.map((post) => (
                <div key={post.id} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <div className={styles.postAuthorAvatar}>
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} alt={creator.author} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {creator.author.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={styles.postAuthorInfo}>
                      <div className={styles.postAuthorName}>{creator.author}</div>
                      <div className={styles.postDate}>{formatDate(post.post_date)}</div>
                    </div>
                  </div>
                  
                  <div className={styles.postContent}>
                    <p className={expandedPosts[post.id] ? styles.expanded : styles.collapsed}>
                      {post.post_content}
                    </p>
                    {post.post_content.length > 280 && (
                      <button 
                        className={styles.moreButton}
                        onClick={() => togglePostExpansion(post.id)}
                      >
                        {expandedPosts[post.id] ? '...less' : '...more'}
                      </button>
                    )}
                  </div>

                  {post.imgUrl && (
                    <div className={styles.postImage}>
                      <img src={post.imgUrl} alt="Post media" />
                    </div>
                  )}

                  {!post.imgUrl && post.media_type === 'video' && (
                    <div className={styles.postVideo}>
                      <div className={styles.playButton}>
                        <div className={styles.playIcon}></div>
                      </div>
                    </div>
                  )}

                  <div className={styles.socialCounts}>
                    <div className={styles.reactions}>
                      <div className={styles.reactionIcons}>
                        <img className={styles.reactionIcon} 
                             src="https://static.licdn.com/aero-v1/sc/h/8ekq8gho1ruaf8i7f86vd1ftt" 
                             alt="like" />
                        <img className={`${styles.reactionIcon} ${styles.stacked}`}
                             src="https://static.licdn.com/aero-v1/sc/h/cpho5fghnpme8epox8rdcds6e" 
                             alt="heart" />
                        {post.like_count > 1000 && (
                          <img className={`${styles.reactionIcon} ${styles.stacked}`}
                               src="https://static.licdn.com/aero-v1/sc/h/b1dl5jk88euc7e9ri50xy5qo8" 
                               alt="celebrate" />
                        )}
                      </div>
                      <span className={styles.reactionCount}>
                        {formatNumber(post.like_count)}
                      </span>
                    </div>
                    
                    <div className={styles.countItems}>
                      <span>{formatNumber(post.comment_count)} comments</span>
                      <span className={styles.dot}>•</span>
                      <span>{formatNumber(post.repost_count)} reposts</span>
                    </div>
                  </div>

                  <div className={styles.postActions}>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.actionButton}
                        onClick={() => handleViewPost(post.post_url)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        View
                      </button>
                      <button 
                        className={styles.actionButton}
                        onClick={() => handleCopyPost(post.post_content)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        </svg>
                        Copy
                      </button>
                      <button 
                        className={styles.actionButton}
                        onClick={() => handleSavePost(post.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                        </svg>
                        Save
                      </button>
                    </div>
                    <button 
                      className={styles.actionButton}
                      onClick={() => handleRepurposePost(post.id)}
                    >
                      <svg viewBox="0 0 256 256" fill="currentColor">
                        <path d="M48,64a8,8,0,0,1,8-8H72V40a8,8,0,0,1,16,0V56h16a8,8,0,0,1,0,16H88V88a8,8,0,0,1-16,0V72H56A8,8,0,0,1,48,64ZM184,192h-8v-8a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0v-8h8a8,8,0,0,0,0-16Zm56-48H224V128a8,8,0,0,0-16,0v16H192a8,8,0,0,0,0,16h16v16a8,8,0,0,0,16,0V160h16a8,8,0,0,0,0-16ZM219.31,80,80,219.31a16,16,0,0,1-22.62,0L36.68,198.63a16,16,0,0,1,0-22.63L176,36.69a16,16,0,0,1,22.63,0l20.68,20.68A16,16,0,0,1,219.31,80Zm-54.63,32L144,91.31l-96,96L68.68,208ZM208,68.69,187.31,48l-32,32L176,100.69Z"/>
                      </svg>
                      Repurpose
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CreatorProfilePage;
