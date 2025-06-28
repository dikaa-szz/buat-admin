import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

const Profile = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    no_phone: ''
  });
  const [updating, setUpdating] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Styles object
  const styles = {
    profileContainer: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    profileHeader: {
      marginBottom: '30px'
    },
    headerTitle: {
      color: '#333',
      fontSize: '28px',
      fontWeight: '600',
      margin: '0'
    },
    profileCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '30px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    },
    profileAvatar: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    avatarCircle: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '36px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    profileInfo: {
      maxWidth: '500px',
      margin: '0 auto'
    },
    infoGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '5px',
      fontSize: '14px'
    },
    infoText: {
      background: '#f9fafb',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      margin: '0',
      color: '#6b7280',
      fontSize: '16px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'border-color 0.2s ease',
      boxSizing: 'border-box'
    },
    inputFocus: {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    editBtn: {
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      marginTop: '10px'
    },
    editBtnHover: {
      background: '#2563eb'
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px'
    },
    saveBtn: {
      background: '#10b981',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      flex: '1'
    },
    saveBtnHover: {
      background: '#059669'
    },
    saveBtnDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed'
    },
    cancelBtn: {
      background: '#6b7280',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      flex: '1'
    },
    cancelBtnHover: {
      background: '#4b5563'
    },
    cancelBtnDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      fontSize: '18px',
      color: '#6b7280'
    },
    error: {
      textAlign: 'center',
      padding: '40px',
      fontSize: '18px',
      color: '#ef4444',
      background: '#fef2f2',
      borderRadius: '8px',
      border: '1px solid #fecaca'
    }
  };

  useEffect(() => {
    // Memindahkan fungsi fetchAdminData langsung ke dalam useEffect
    const fetchAdminData = async () => {
      try {
        if (currentUser) {
          // Ambil data berdasarkan email yang login
          const adminRef = doc(db, 'admins', currentUser.uid);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            const data = adminSnap.data();
            setAdminData(data);
            setFormData({
              nama: data.nama || '',
              email: data.email || '',
              no_phone: data.no_phone || ''
            });
          } else {
            console.log('No admin data found');
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData(); // Memanggil fungsi untuk mengambil data admin

  }, [currentUser]); // Dependency array hanya bergantung pada currentUser

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form data ke data asli
    setFormData({
      nama: adminData.nama || '',
      email: adminData.email || '',
      no_phone: adminData.no_phone || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      if (currentUser) {
        const adminRef = doc(db, 'admins', currentUser.uid);
        await updateDoc(adminRef, {
          nama: formData.nama,
          email: formData.email,
          no_phone: formData.no_phone
        });

        // Update state lokal
        setAdminData(prev => ({
          ...prev,
          ...formData
        }));

        setEditing(false);
        alert('Profile berhasil diupdate!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal mengupdate profile!');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.profileContainer}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div style={styles.profileContainer}>
        <div style={styles.error}>Data admin tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div style={styles.profileContainer}>
      <div style={styles.profileHeader}>
        <h2 style={styles.headerTitle}>Profile Admin</h2>
      </div>

      <div style={styles.profileCard}>
        <div style={styles.profileAvatar}>
          <div style={styles.avatarCircle}>
            {adminData.nama ? adminData.nama.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>

        <div style={styles.profileInfo}>
          {!editing ? (
            <>
              <div style={styles.infoGroup}>
                <label style={styles.label}>Nama:</label>
                <p style={styles.infoText}>{adminData.nama || '-'}</p>
              </div>

              <div style={styles.infoGroup}>
                <label style={styles.label}>Email:</label>
                <p style={styles.infoText}>{adminData.email || '-'}</p>
              </div>

              <div style={styles.infoGroup}>
                <label style={styles.label}>No. Telepon:</label>
                <p style={styles.infoText}>{adminData.no_phone || '-'}</p>
              </div>

              <div style={styles.infoGroup}>
                <label style={styles.label}>Role:</label>
                <p style={styles.infoText}>{adminData.role || 'admin'}</p>
              </div>

              <div style={styles.infoGroup}>
                <label style={styles.label}>Dibuat pada:</label>
                <p style={styles.infoText}>
                  {adminData.createdAt ? new Date(adminData.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>

              <button
                style={styles.editBtn}
                onClick={handleEdit}
                onMouseOver={(e) => e.target.style.background = styles.editBtnHover.background}
                onMouseOut={(e) => e.target.style.background = styles.editBtn.background}
              >
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama:</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama"
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Masukkan email"
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>No. Telepon:</label>
                <input
                  type="tel"
                  name="no_phone"
                  value={formData.no_phone}
                  onChange={handleInputChange}
                  placeholder="Masukkan nomor telepon"
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>

              <div style={styles.formActions}>
                <button
                  style={{
                    ...styles.saveBtn,
                    ...(updating ? styles.saveBtnDisabled : {})
                  }}
                  onClick={handleSave}
                  disabled={updating}
                  onMouseOver={(e) => !updating && (e.target.style.background = styles.saveBtnHover.background)}
                  onMouseOut={(e) => !updating && (e.target.style.background = styles.saveBtn.background)}
                >
                  {updating ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  style={{
                    ...styles.cancelBtn,
                    ...(updating ? styles.cancelBtnDisabled : {})
                  }}
                  onClick={handleCancel}
                  disabled={updating}
                  onMouseOver={(e) => !updating && (e.target.style.background = styles.cancelBtnHover.background)}
                  onMouseOut={(e) => !updating && (e.target.style.background = styles.cancelBtn.background)}
                >
                  Batal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
