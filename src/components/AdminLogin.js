import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminLogin = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('Attempting login with:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Login successful, checking admin role...');

      const adminRef = doc(db, 'admins', user.uid);
      const docSnap = await getDoc(adminRef);

      if (docSnap.exists() && docSnap.data().role === 'admin') {
        console.log('Admin role verified, redirecting...');
      } else {
        console.log('User is not admin, signing out...');
        setErrorMessage('Anda bukan admin atau belum terdaftar sebagai admin');
        await signOut(auth);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('Email tidak terdaftar');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage('Password salah');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Format email tidak valid');
      } else {
        setErrorMessage(`Login gagal: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validasi
    if (password !== confirmPassword) {
      setErrorMessage('Password dan konfirmasi password tidak cocok');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password minimal 6 karakter');
      setIsLoading(false);
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Nama tidak boleh kosong');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting registration with:', email);
      
      // Buat akun baru di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User created, saving to Firestore...');

      // Simpan data admin ke Firestore collection 'admins'
      await setDoc(doc(db, 'admins', user.uid), {
        email: email,
        name: name,
        no_phone: phone || '',
        role: 'admin',
        createdAt: new Date()
      });

      console.log('Admin registered successfully');
      setSuccessMessage('Registrasi berhasil! Silakan login.');
      
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setPhone('');
      
      // Sign out setelah registrasi agar admin login manual
      await signOut(auth);
      
      // Pindah ke mode login setelah 2 detik
      setTimeout(() => {
        setIsLoginMode(true);
        setSuccessMessage('');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Email sudah terdaftar');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Format email tidak valid');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password terlalu lemah');
      } else {
        setErrorMessage(`Registrasi gagal: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrorMessage('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
  };

  return (
    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center" 
         style={{ backgroundColor: '#f8f9fa' }}>
      <div className="card shadow-lg" style={{ width: '100%', maxWidth: '450px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="card-title">
              {isLoginMode ? 'Admin Login' : 'Registrasi Admin'}
            </h2>
            <p className="text-muted">
              {isLoginMode ? 'Masuk ke Panel Admin' : 'Buat Akun Admin Baru'}
            </p>
          </div>
          
          {isLoginMode ? (
            // FORM LOGIN
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
              
              {successMessage && (
                <div className="alert alert-success" role="alert">
                  {successMessage}
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-primary w-100 mb-3"
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

              <div className="text-center">
                <small className="text-muted">
                  Belum punya akun?{' '}
                  <button 
                    type="button"
                    onClick={toggleMode}
                    style={{ 
                      color: '#007bff', 
                      textDecoration: 'none', 
                      fontWeight: '500',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                  >
                    Registrasi di sini
                  </button>
                </small>
              </div>
            </form>
          ) : (
            // FORM REGISTRASI
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Nama Lengkap *</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  placeholder="Masukkan nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="reg-email" className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  id="reg-email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="phone" className="form-label">Nomor Telepon</label>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  placeholder="Masukkan nomor telepon (opsional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="reg-password" className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-control"
                  id="reg-password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <small className="text-muted">Password minimal 6 karakter</small>
              </div>

              <div className="mb-3">
                <label htmlFor="confirm-password" className="form-label">Konfirmasi Password *</label>
                <input
                  type="password"
                  className="form-control"
                  id="confirm-password"
                  placeholder="Masukkan ulang password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}
              
              {successMessage && (
                <div className="alert alert-success" role="alert">
                  {successMessage}
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-success w-100 mb-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Registering...
                  </>
                ) : (
                  'Daftar'
                )}
              </button>

              <div className="text-center">
                <small className="text-muted">
                  Sudah punya akun?{' '}
                  <button 
                    type="button"
                    onClick={toggleMode}
                    style={{ 
                      color: '#007bff', 
                      textDecoration: 'none', 
                      fontWeight: '500',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                  >
                    Login di sini
                  </button>
                </small>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;