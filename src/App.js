import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AllReports from './components/AllReports';
import AddLocationForm from './components/AddLocationForm';
import Profile from './components/Profile'; // Import Profile component baru
import Users from './components/Users'; // Import Users component baru
import AdminLogin from './components/AdminLogin';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, false = not auth, true = auth
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User not logged in');
      setIsAuthenticated(!!user); // Set true jika user ada, false jika tidak
    });

    return () => unsubscribe();
  }, []);

  // Tampilkan loading spinner saat masih mengecek authentication
  if (isAuthenticated === null) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Checking authentication...</span>
      </div>
    );
  }

  return (
    <Router>
      {/* Jika belum login, tampilkan hanya halaman login */}
      {!isAuthenticated ? (
        <div className="container-fluid p-0">
          <Routes>
            <Route path="*" element={<AdminLogin />} />
          </Routes>
        </div>
      ) : (
        /* Jika sudah login, tampilkan layout dengan sidebar */
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)', minHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/all-reports" element={<AllReports />} />
              <Route path="/add-location" element={<AddLocationForm />} />
              <Route path="/profile" element={<Profile />} /> {/* Route Profile baru */}
              <Route path="/users" element={<Users />} /> {/* Route untuk Lihat Semua User */}
              {/* Redirect semua route lain ke dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
};

export default App;
