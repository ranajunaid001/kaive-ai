import React, { useState } from 'react';
import styles from './Login.module.css';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      alert('Supabase is not configured. Please check environment variables.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://app.kaive.xyz'
        }
      });
      
      if (error) throw error;
    } catch (error) {
      alert('Error logging in with Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    if (!supabase) {
      alert('Supabase is not configured. Please check environment variables.');
      return;
    }

    setLoading(true);
    
    try {
      if (isSignUp) {
        // Sign Up Mode
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });
        
        if (error) throw error;
        
        if (data?.user?.identities?.length === 0) {
          alert('This email is already registered. Please sign in instead.');
          setIsSignUp(false);
        } else {
          alert('Sign up successful! Please check your email to verify your account.');
          setIsSignUp(false);
        }
      } else {
        // Sign In Mode
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        if (error) throw error;
        
        // Redirect to app subdomain on successful login
        window.location.href = 'https://app.kaive.xyz';
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    if (!supabase) {
      alert('Supabase is not configured.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://app.kaive.xyz',
      });

      if (error) throw error;

      setResetEmailSent(true);
      setShowResetPassword(false);
      
      // Show success message
      alert(`Password reset instructions have been sent to ${email}`);
      
    } catch (error) {
      alert('Error sending reset email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (e) => {
    e.preventDefault();
    setIsSignUp(!isSignUp);
    setPassword('');
    setConfirmPassword('');
    setShowResetPassword(false);
    setResetEmailSent(false);
  };

  const toggleResetPassword = (e) => {
    e.preventDefault();
    setShowResetPassword(!showResetPassword);
  };

  return (
    <div className={styles.container}>
      {/* Left Section - Login Form */}
      <div className={styles.leftSection}>
        <a href="/" className={styles.logoSection}>
          <div className={styles.logoIcon}>K</div>
          <div className={styles.logoText}>Kaive</div>
        </a>
        
        <h1 className={styles.welcomeText}>
          {showResetPassword ? 'Reset your' : (isSignUp ? 'Create your' : 'Welcome to')}
        </h1>
        <h2 className={styles.subtitle}>
          {showResetPassword ? 'Password' : (isSignUp ? 'Account' : 'Kaive')}
        </h2>
        
        <div className={styles.loginForm}>
          {!showResetPassword && (
            <button 
              className={styles.googleBtn} 
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isSignUp ? 'Sign up with Google' : 'Continue with Google'}
            </button>
          )}
          
          {!showResetPassword && <div className={styles.divider}>OR</div>}
          
          {showResetPassword ? (
            // Password Reset Form
            <form onSubmit={handlePasswordReset}>
              <p className={styles.resetInfo}>
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input 
                  type="email" 
                  className={styles.formInput} 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit" 
                className={styles.loginBtn}
                disabled={loading || !email}
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
              
                  <div className={styles.signupLink}>
                    Remember your password?{' '}
                    <button 
                      onClick={toggleResetPassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1a1a1a',
                        fontWeight: '600',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit'
                      }}
                    >
                      Back to login
                    </button>
                  </div>
            </form>
          ) : (
            // Regular Login/Signup Form
            <form onSubmit={handleEmailAuth}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input 
                  type="email" 
                  className={styles.formInput} 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Password</label>
                <input 
                  type="password" 
                  className={styles.formInput} 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
              
              {isSignUp && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Confirm Password</label>
                  <input 
                    type="password" 
                    className={styles.formInput} 
                    placeholder="Confirm your password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    disabled={loading}
                  />
                </div>
              )}
              
              {!isSignUp && (
                <div className={styles.forgotPassword}>
                  <a href="#" onClick={toggleResetPassword}>Forgot password?</a>
                </div>
              )}
              
              <button 
                type="submit" 
                className={styles.loginBtn}
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Log In')}
              </button>
            </form>
          )}
          
          {!showResetPassword && (
            <div className={styles.signupLink}>
              {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
              <button 
                onClick={toggleMode}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a1a1a',
                  fontWeight: '600',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Section - Testimonials */}
      <div className={styles.rightSection}>
        <div className={styles.testimonialsContainer}>
          {/* Top Row */}
          <div className={styles.testimonialRow}>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialContent}>Kaive has transformed my LinkedIn game. I write 10x faster while maintaining my authentic voice.</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar} style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=1)' }}></div>
                  <div className={styles.authorDetails}>
                    <h4>Maria Martin</h4>
                    <p>@maria_martin</p>
                  </div>
                </div>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialContent}>Just built this awesome content strategy using Kaive! The AI understands context like no other tool.</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar} style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=2)' }}></div>
                  <div className={styles.authorDetails}>
                    <h4>Gleb Konon</h4>
                    <p>Product Designer</p>
                  </div>
                </div>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialContent}>Finally, an AI tool that gets LinkedIn's unique style. My engagement has tripled since using Kaive!</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorInfo">
                  <div className={styles.authorAvatar} style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=3)' }}></div>
                  <div className={styles.authorDetails}>
                    <h4>Sarah Chen</h4>
                    <p>Marketing Director</p>
                  </div>
                </div>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Bottom Row */}
          <div className={styles.testimonialRow}>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialContent}>The fastest content creation moment I have ever had. From idea to polished post in under 2 minutes!</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar} style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=5)' }}></div>
                  <div className={styles.authorDetails}>
                    <h4>Erel Cohen</h4>
                    <p>Entrepreneur</p>
                  </div>
                </div>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialContent">I've tried every AI writing tool out there. Kaive is the only one that truly understands LinkedIn's voice.</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorInfo">
                  <div className={styles.authorAvatar} style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=6)' }}></div>
                  <div className={styles.authorDetails}>
                    <h4>Alex Thompson</h4>
                    <p>CEO & Founder</p>
                  </div>
                </div>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialContent}>Kaive revolutionizes content creation by matching your voice with proven creator styles. Game changer!</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar} style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=7)' }}></div>
                  <div className={styles.authorDetails}>
                    <h4>Eran Cohen</h4>
                    <p>Growth Expert</p>
                  </div>
                </div>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
