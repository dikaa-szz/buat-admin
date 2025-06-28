// src/components/Users.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Mengimpor konfigurasi Firebase
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'; // Firestore functions

const Users = () => {
  const [users, setUsers] = useState([]);  // Data user yang akan ditampilkan
  const [loading, setLoading] = useState(true);

  // Ambil data user dari Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users'); // Koleksi 'users' di Firestore
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);  // Menyimpan data user
      setLoading(false);  // Mengubah status loading setelah data selesai diambil
    };

    fetchUsers();
  }, []);

  // Fungsi untuk memblokir akun
  const handleBlock = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId); // Referensi ke user yang akan diblokir
      await updateDoc(userRef, { status: 'blocked' }); // Menandai akun sebagai diblokir
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: 'blocked' } : user
        )
      );
      alert('Akun berhasil diblokir!');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Gagal memblokir akun!');
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Menampilkan loading saat data sedang diambil
  }

  return (
    <div>
      <h2>Daftar User</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px' }}>Name</th>
            <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px' }}>Email</th>
            <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px' }}>Phone</th>
            <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px' }}>Status</th>
            <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>{user.name}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>{user.email}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>{user.phone}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>{user.status || 'Active'}</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                {user.status !== 'blocked' ? (
                  <button
                    onClick={() => handleBlock(user.id)}
                    style={{ backgroundColor: '#FF6347', color: 'white', padding: '8px 12px', borderRadius: '4px' }}
                  >
                    Block Account
                  </button>
                ) : (
                  <button
                    disabled
                    style={{ backgroundColor: '#D3D3D3', color: 'gray', padding: '8px 12px', borderRadius: '4px' }}
                  >
                    Blocked
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
