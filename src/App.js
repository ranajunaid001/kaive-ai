import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  
  return (
    <div className="app">
      {currentPage === 'home' ? (
        <HomePage onNavigate={setCurrentPage} />
      ) : (
        <AdminPage onNavigate={setCurrentPage} />
      )}
    </div>
  );
}

export default App;
