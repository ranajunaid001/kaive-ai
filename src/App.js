import React, { useState } from 'react';
import './App.css';

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  
  return (
    <div className="app">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          <h1 className="logo">Kaive AI</h1>
          <button 
            className="nav-button"
            onClick={() => setCurrentPage(currentPage === 'home' ? 'admin' : 'home')}
          >
            {currentPage === 'home' ? 'Admin' : 'Home'}
          </button>
        </div>
      </nav>

      {/* Page Content */}
      {currentPage === 'home' ? (
        <HomePage />
      ) : (
        <AdminPage />
      )}
    </div>
  );
}

// Home Page Component
function HomePage() {
  return (
    <div className="home-page">
      <header className="header">
        <h2>Write in any creator's voice</h2>
        <p>Powered by AI</p>
      </header>
      
      <button className="find-creators-btn">
        🔍 Find Creators
      </button>
      
      {/* Creator carousel will go here */}
      <div className="carousel-placeholder">
        <p>Creator carousel coming soon...</p>
      </div>
    </div>
  );
}

// Admin Page Component  
function AdminPage() {
  return (
    <div className="admin-page">
      <h2>Admin Dashboard</h2>
      <p>Upload creator data here</p>
    </div>
  );
}

export default App;
