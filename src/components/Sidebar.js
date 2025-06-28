import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Sidebar = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // User akan otomatis diarahkan ke login karena onAuthStateChanged
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="sidebar" style={{
      width: '250px',
      height: '100vh',
      backgroundColor: '#343a40',
      position: 'fixed',
      left: 0,
      top: 0,
      paddingTop: '20px'
    }}>
      <div className="sidebar-header text-center mb-4">
        <h4 className="text-white">Admin Panel</h4>
      </div>
      
      <nav className="nav flex-column">
        <Link to="/" className="nav-link text-white">
          <i className="fas fa-tachometer-alt me-2"></i>
          Dashboard
        </Link>
        
        <Link to="/all-reports" className="nav-link text-white">
          <i className="fas fa-file-alt me-2"></i>
          All Reports
        </Link>
        
        <Link to="/add-location" className="nav-link text-white">
          <i className="fas fa-map-marker-alt me-2"></i>
          Add Location
        </Link>
        
        <Link to="/profile" className="nav-link text-white">
          <i className="fas fa-user me-2"></i>
          Profile
        </Link>

        {/* Menu Lihat Semua User Baru */}
        <Link to="/users" className="nav-link text-white">
          <i className="fas fa-users me-2"></i>
          Lihat Semua User
        </Link>
      </nav>

      {/* Logout Button */}
      <div style={{ position: 'absolute', bottom: '20px', width: '100%', paddingX: '15px' }}>
        <button 
          onClick={handleLogout}
          className="btn btn-danger w-100"
        >
          <i className="fas fa-sign-out-alt me-2"></i>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
