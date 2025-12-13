import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import L from 'leaflet';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Dashboard = () => {
  const [spots, setSpots] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([-2.548926, 118.014863]);

  // Ambil data lokasi dari Firestore untuk peta
  useEffect(() => {
    const fetchSpots = async () => {
      const spotsCollection = collection(db, 'spots');
      const spotsSnapshot = await getDocs(spotsCollection);
      const spotsList = spotsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSpots(spotsList);
    };
    fetchSpots();
  }, []);

  // Fungsi untuk mendapatkan posisi pengguna
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserPosition({ latitude, longitude });
        setMapCenter([latitude, longitude]);
      });
    } else {
      alert('Geolocation tidak tersedia di perangkat Anda.');
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // Fungsi untuk mendapatkan ikon berdasarkan status
  const getMarkerIcon = (status) => {
    const iconUrls = {
      belum_diperbaiki: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      sedang_diperbaiki: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
      sudah_diperbaiki: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    };

    return new L.Icon({
      iconUrl: iconUrls[status] || iconUrls.belum_diperbaiki,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      shadowSize: [41, 41],
    });
  };

  // Ikon untuk lokasi pengguna (biru)
  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  // Fungsi untuk mendapatkan label status
  const getStatusLabel = (status) => {
    const labels = {
      belum_diperbaiki: 'Belum Diperbaiki',
      sedang_diperbaiki: 'Sedang Diperbaiki',
      sudah_diperbaiki: 'Sudah Diperbaiki',
    };
    return labels[status] || 'Belum Diperbaiki';
  };

  // Statistik berdasarkan status perbaikan
  const statusCategories = spots.reduce((acc, spot) => {
    const status = spot.status || 'belum_diperbaiki';
    const statusLabel = getStatusLabel(status);
    acc[statusLabel] = (acc[statusLabel] || 0) + 1;
    return acc;
  }, {});

  // Statistik berdasarkan kategori kerusakan
  const damageCategories = spots.reduce((acc, spot) => {
    const category = spot.category || 'Tidak Dikategorikan';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Data untuk chart status
  const statusChartData = Object.keys(statusCategories).map(key => ({
    name: key,
    value: statusCategories[key],
  }));

  // Data untuk chart kategori
  const categoryChartData = Object.keys(damageCategories).map(key => ({
    name: key,
    value: damageCategories[key],
  }));

  const totalSpots = spots.length;

  // Warna untuk chart
  const STATUS_COLORS = {
    'Belum Diperbaiki': '#f44336',
    'Sedang Diperbaiki': '#ffc107',
    'Sudah Diperbaiki': '#4caf50',
  };

  const CATEGORY_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Dashboard Monitoring Kerusakan</h1>

      {/* Statistik Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          padding: '20px', 
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px' }}>Total Lokasi</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#4A90E2' }}>{totalSpots}</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          padding: '20px', 
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px' }}>Belum Diperbaiki</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#f44336' }}>
            {statusCategories['Belum Diperbaiki'] || 0}
          </p>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          padding: '20px', 
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px' }}>Sedang Diperbaiki</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#ffc107' }}>
            {statusCategories['Sedang Diperbaiki'] || 0}
          </p>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          padding: '20px', 
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#666', margin: '0 0 10px 0', fontSize: '14px' }}>Sudah Diperbaiki</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#4caf50' }}>
            {statusCategories['Sudah Diperbaiki'] || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Chart Status Perbaikan */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: '0' }}>Status Perbaikan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={statusChartData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={100} 
                label
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#999'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Kategori Kerusakan */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: '0' }}>Kategori Kerusakan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={categoryChartData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={100} 
                label
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabel Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Tabel Status */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: '0' }}>Summary Status</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px', textAlign: 'center' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(statusCategories).map((status) => (
                <tr key={status}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: STATUS_COLORS[status],
                      marginRight: '8px'
                    }}></span>
                    {status}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                    {statusCategories[status]}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '12px', backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #4A90E2' }}>
                  Total
                </td>
                <td style={{ padding: '12px', backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #4A90E2', textAlign: 'center' }}>
                  {totalSpots}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel Kategori */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: '0' }}>Summary Kategori</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px', textAlign: 'left' }}>Kategori</th>
                <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px', textAlign: 'center' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(damageCategories).map((category) => (
                <tr key={category}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>{category}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                    {damageCategories[category]}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '12px', backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #4A90E2' }}>
                  Total
                </td>
                <td style={{ padding: '12px', backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #4A90E2', textAlign: 'center' }}>
                  {totalSpots}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda Peta */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        padding: '15px', 
        marginBottom: '20px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Legenda Peta</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔵</span>
            <span>Lokasi Anda</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔴</span>
            <span>Belum Diperbaiki</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🟡</span>
            <span>Sedang Diperbaiki</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🟢</span>
            <span>Sudah Diperbaiki</span>
          </div>
        </div>
      </div>

      {/* Peta */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ marginTop: '0' }}>Peta Sebaran Lokasi Kerusakan</h3>
        <MapContainer 
          center={mapCenter} 
          zoom={5} 
          style={{ width: '100%', height: '500px', borderRadius: '8px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Marker lokasi pengguna */}
          {userPosition && (
            <Marker position={[userPosition.latitude, userPosition.longitude]} icon={userIcon}>
              <Popup>
                <strong>📍 Lokasi Anda</strong><br />
                Latitude: {userPosition.latitude.toFixed(6)}<br />
                Longitude: {userPosition.longitude.toFixed(6)}
              </Popup>
            </Marker>
          )}

          {/* Marker untuk lokasi kerusakan dengan warna berdasarkan status */}
          {spots.map((spot) => {
            const { latitude, longitude, status } = spot;
            if (!latitude || !longitude) return null;
            
            return (
              <Marker 
                key={spot.id} 
                position={[latitude, longitude]} 
                icon={getMarkerIcon(status || 'belum_diperbaiki')}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                      {spot.title}
                    </strong>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Kategori:</strong> {spot.category}
                    </div>
                    
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: status === 'belum_diperbaiki' ? '#ffebee' : 
                                     status === 'sedang_diperbaiki' ? '#fff9c4' : '#e8f5e9',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      {getStatusLabel(status || 'belum_diperbaiki')}
                    </div>
                    
                    <div style={{ marginBottom: '8px', color: '#666' }}>
                      {spot.description}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      <div>Lat: {latitude.toFixed ? latitude.toFixed(6) : latitude}</div>
                      <div>Lng: {longitude.toFixed ? longitude.toFixed(6) : longitude}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default Dashboard;