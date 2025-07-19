import React, { useEffect, useState } from 'react';
import styles from './AppPage.module.css';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function AppPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    checkUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = 'https://kaive.xyz';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    window.location.href = 'https://kaive.xyz/login';
    return null;
  }

  return (
    <div className={styles.appContainer}>
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>K</div>
            <span className={styles.logoText}>Kaive AI</span>
          </div>
          <div className={styles.userSection}>
            <span className={styles.userEmail}>{user.email}</span>
            <button onClick={handleSignOut} className={styles.signOutBtn}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className={styles.mainContent}>
        <div className={styles.welcomeSection}>
          <h1>Welcome to Kaive AI</h1>
          <p className={styles.subtitle}>You're successfully logged in!</p>
          
          <div className={styles.infoCard}>
            <h2>🎉 Login Successful</h2>
            <p>You're now authenticated and can access all features.</p>
            <div className={styles.userInfo}>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Provider:</strong> {user.app_metadata?.provider || 'email'}</p>
            </div>
          </div>

          <div className={styles.comingSoon}>
            <h3>Coming Soon</h3>
            <p>The full Kaive AI app experience is being built. Stay tuned!</p>
            <ul>
              <li>✨ AI-powered content generation</li>
              <li>🎯 Creator voice matching</li>
              <li>📊 Analytics dashboard</li>
              <li>💾 Saved templates</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppPage;
