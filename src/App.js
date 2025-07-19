import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import Login from './pages/Login';
import AppPage from './pages/AppPage';

function App() {
  // Check if we're on the app subdomain
  const isAppSubdomain = window.location.hostname === 'app.kaive.xyz';
  
  // If on app subdomain, show the app page
  if (isAppSubdomain) {
    return (
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<AppPage />} />
            <Route path="*" element={<AppPage />} />
          </Routes>
        </div>
      </Router>
    );
  }
  
  // Otherwise, show the normal routes
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/app" element={<AppPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
