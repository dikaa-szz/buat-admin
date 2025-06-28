import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('Attempting login with:', email);
      
      // Login menggunakan Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Login successful, checking admin role...');

      // Cek apakah role admin ada di Firestore
      const adminRef = doc(db, 'admins', user.uid);
      const docSnap = await getDoc(adminRef);

      if (docSnap.exists() && docSnap.data().role === 'admin') {
        console.log('Admin role verified, redirecting...');
        // Tidak perlu navigate manual, onAuthStateChanged akan handle
      } else {
        console.log('User is not admin, signing out...');
        setErrorMessage('Anda bukan admin atau belum terdaftar sebagai admin');
        await signOut(auth);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(`Login gagal: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center" 
         style={{ backgroundColor: '#f8f9fa' }}>
      <div className="card shadow-lg" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="card-title">Admin Login</h2>
            <p className="text-muted">Masuk ke Panel Admin</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Masukkan email admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            {errorMessage && (
              <div className="alert alert-danger" role="alert">
                {errorMessage}
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <small className="text-muted">
              Hanya admin yang dapat mengakses sistem ini
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;