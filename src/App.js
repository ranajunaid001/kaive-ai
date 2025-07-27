import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import Login from './pages/Login';
import AppPage from './pages/AppPage';
import CreatorsPage from './pages/CreatorsPage';

function AppContent() {
  const navigate = useNavigate();
  
  const handleNavigate = (page) => {
    switch(page) {
      case 'admin':
        navigate('/admin');
        break;
      case 'home':
        navigate('/');
        break;
      case 'login':
        navigate('/login');
        break;
      case 'creators':
        navigate('/creators');
        break;
      default:
        navigate('/');
    }
  };
  
  // Check if we're on the app subdomain
  const isAppSubdomain = window.location.hostname === 'app.kaive.xyz';
  
  // If on app subdomain, show the app page
  if (isAppSubdomain) {
    return (
      <Routes>
        <Route path="/" element={<AppPage />} />
        <Route path="*" element={<AppPage />} />
      </Routes>
    );
  }
  
  // Otherwise, show the normal routes
  return (
    <Routes>
      <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminPage onNavigate={handleNavigate} />} />
      <Route path="/creators" element={<CreatorsPage onNavigate={handleNavigate} />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
