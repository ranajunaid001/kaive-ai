/* Add these styles to your App.css for the Homepage */

/* Homepage specific variables */
.home-page {
  --primary: #F59E0B;
  --secondary: #FF6B35;
  --accent: #2196F3;
  --dark: #1a1a1a;
  --gray: #666;
  --light-gray: #999;
  --bg-gradient: linear-gradient(135deg, #c9d6df 0%, #f2f2f2 100%);
  --shadow-sm: 0 4px 20px rgba(0,0,0,0.08);
  --shadow-md: 0 8px 32px rgba(0,0,0,0.1);
  --shadow-lg: 0 20px 40px rgba(0,0,0,0.1);
  --radius: 20px;
  --radius-sm: 12px;
  --radius-full: 100px;
  --transition: all 0.3s ease;
  
  background: var(--bg-gradient);
  min-height: 100vh;
  color: var(--dark);
}

/* Glass effect */
.glass {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Homepage Navigation Override */
.home-page .nav {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 24px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.home-page .logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: var(--dark);
  text-decoration: none;
}

.home-page .logo-icon {
  width: 32px;
  height: 32px;
  background: var(--primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.home-page .nav-links {
  display: flex;
  gap: 36px;
  margin-left: 48px;
}

.home-page .nav-links a {
  color: var(--dark);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.home-page .nav-links a:hover {
  opacity: 0.7;
}

/* Hero Section */
.home-page .hero {
  text-align: center;
  padding: 140px 20px 60px;
  max-width: 900px;
  margin: 0 auto;
}

.home-page .hero h1 {
  font-size: clamp(48px, 8vw, 72px);
  font-weight: 600;
  line-height: 1.1;
  color: var(--dark);
  margin-bottom: 24px;
}

.home-page .hero .highlight {
  color: var(--primary);
}

.home-page .hero p {
  font-size: 20px;
  color: var(--dark);
  opacity: 0.8;
}

/* Input Card */
.home-page .input-card {
  max-width: 820px;
  margin: 0 auto 100px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(255,255,255,0.3);
  position: relative;
}

.home-page .input-area {
  width: 100%;
  min-height: 160px;
  border: none;
  outline: none;
  font-size: 18px;
  color: var(--dark);
  resize: none;
  font-family: inherit;
  background: rgba(248,249,250,0.9);
  padding: 20px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.home-page .input-area:focus {
  background: rgba(240,242,245,0.95);
}

.home-page .send-btn {
  position: absolute;
  bottom: 20px;
  right: 50px;
  width: 48px;
  height: 48px;
  background: var(--primary);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-page .send-btn.active {
  opacity: 1;
}

.home-page .send-btn:not(.active) {
  opacity: 0.3;
  pointer-events: none;
}

.home-page .send-btn:hover {
  transform: scale(1.1);
  background: #D97706;
}

/* Suggestions */
.home-page .suggestions {
  margin-top: 40px;
}

.home-page .suggestions-label {
  font-size: 14px;
  color: var(--gray);
  margin-bottom: 20px;
}

.home-page .suggestion-pills {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.home-page .pill {
  padding: 10px 20px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: var(--radius-full);
  font-size: 14px;
  color: var(--gray);
  cursor: pointer;
  transition: var(--transition);
}

.home-page .pill:hover {
  background: white;
  border-color: var(--accent);
  color: var(--dark);
}

/* Trust Section */
.home-page .trust-section {
  text-align: center;
  margin: 40px auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.home-page .trust-avatars {
  display: flex;
  margin-right: 8px;
}

.home-page .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid white;
  margin-left: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  font-weight: 600;
}

.home-page .avatar:first-child { 
  margin-left: 0; 
}

/* Results Section */
.home-page .results-section {
  display: none;
  padding: 0 20px;
}

.home-page .results-section.show {
  display: block;
}

.home-page .results-header {
  text-align: center;
  margin-bottom: 48px;
}

.home-page .results-header h2 {
  font-size: 48px;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 12px;
}

/* Floating Bubbles */
.home-page .bubbles-container {
  position: relative;
  height: 400px;
  max-width: 1200px;
  margin: 0 auto 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-page .bubble {
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  background: white;
  border: 3px solid transparent;
  animation: float 6s ease-in-out infinite;
  overflow: hidden;
}

.home-page .bubble:hover {
  transform: scale(1.1) translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.home-page .bubble.selected {
  border-color: var(--accent);
  background: #e3f2fd;
  animation: none;
  transform: scale(1.15);
  border-radius: 20px;
  width: auto !important;
  height: auto !important;
  min-width: 240px;
  padding: 24px;
}

.home-page .bubble-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.home-page .bubble-metrics {
  display: none;
  width: 100%;
  margin-top: 16px;
  gap: 8px;
}

.home-page .bubble.selected .bubble-metrics {
  display: flex;
  flex-direction: column;
}

.home-page .bubble-large {
  width: 180px;
  height: 180px;
}

.home-page .bubble-medium {
  width: 150px;
  height: 150px;
}

.home-page .bubble-small {
  width: 120px;
  height: 120px;
}

.home-page .bubble-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-bottom: 10px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.home-page .bubble-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 4px;
}

.home-page .bubble-match {
  font-size: 12px;
  background: rgba(76, 175, 80, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  color: #4CAF50;
  font-weight: 500;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(-5deg); }
  75% { transform: translateY(20px) rotate(5deg); }
}

.home-page .bubble:nth-child(1) { animation-delay: 0s; }
.home-page .bubble:nth-child(2) { animation-delay: 1s; }
.home-page .bubble:nth-child(3) { animation-delay: 2s; }
.home-page .bubble:nth-child(4) { animation-delay: 3s; }
.home-page .bubble:nth-child(5) { animation-delay: 4s; }

/* Metric Bars */
.home-page .metric-item {
  margin-top: 8px;
}

.home-page .metric-label {
  font-size: 12px;
  color: var(--light-gray);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.home-page .metric-bar {
  width: 100%;
  height: 6px;
  background: rgba(0,0,0,0.05);
  border-radius: 3px;
  overflow: hidden;
}

.home-page .metric-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, #FBBF24 100%);
  border-radius: 3px;
  transition: width 0.6s ease;
}

/* Loading State */
.home-page .loading {
  display: none;
  text-align: center;
  padding: 80px 20px;
}

.home-page .loading.show {
  display: block;
}

.home-page .spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 32px;
  border: 3px solid transparent;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Testimonials */
.home-page .testimonials-section {
  padding: 100px 0;
  background: transparent;
  overflow: hidden;
  position: relative;
}

.home-page .testimonials-container {
  position: relative;
  height: 500px;
}

.home-page .testimonial-row {
  display: flex;
  gap: 32px;
  position: absolute;
  width: max-content;
  padding: 16px 0;
}

.home-page .testimonial-row.row-1 {
  top: 0;
  animation: scrollLeft 50s linear infinite;
}

.home-page .testimonial-row.row-2 {
  top: 250px;
  animation: scrollRight 50s linear infinite;
}

@keyframes scrollLeft {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes scrollRight {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}

.home-page .testimonial-card {
  background: white;
  border-radius: 24px;
  padding: 32px;
  width: 380px;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.home-page .testimonial-content {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 24px;
}

.home-page .testimonial-author {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home-page .author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.home-page .author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
}

.home-page .author-details h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--dark);
}

.home-page .author-details p {
  font-size: 14px;
  color: var(--gray);
  margin: 0;
}

.home-page .social-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Homepage buttons */
.home-page .btn {
  border: none;
  padding: 12px 28px;
  border-radius: var(--radius-full);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  font-size: 16px;
}

.home-page .btn-dark {
  background: var(--dark);
  color: white;
}

.home-page .btn:disabled {
  opacity: 0.3;
  pointer-events: none;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .home-page .nav { padding: 16px 24px; }
  .home-page .nav-links { display: none; }
  .home-page .hero h1 { font-size: 36px; }
  .home-page .testimonial-card { min-width: 300px; }
}
