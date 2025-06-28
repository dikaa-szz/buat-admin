import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { db } from '../firebase'; // Mengimpor konfigurasi Firebase
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; // Firestore functions
import L from 'leaflet'; // Untuk ikon kustom
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'; // Untuk chart

const Dashboard = () => {
  const [reports, setReports] = useState([]);  // Data laporan untuk tabel dan chart
  const [spots, setSpots] = useState([]);  // Data lokasi dari koleksi spots untuk peta
  const [userPosition, setUserPosition] = useState(null); // Posisi pengguna
  const [mapCenter, setMapCenter] = useState([-2.548926, 118.014863]); // Pusat peta di Indonesia

  // Ambil data laporan dari Firestore
  useEffect(() => {
    const fetchReports = async () => {
      const reportsCollection = collection(db, 'reports');
      const reportsQuery = query(reportsCollection, orderBy('timestamp', 'desc'));
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsList = reportsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(reportsList);  // Simpan data laporan untuk chart dan tabel
    };
    fetchReports();
  }, []);

  // Ambil data lokasi dari Firestore untuk peta
  useEffect(() => {
    const fetchSpots = async () => {
      const spotsCollection = collection(db, 'spots');
      const spotsSnapshot = await getDocs(spotsCollection);
      const spotsList = spotsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSpots(spotsList);  // Simpan data spots untuk peta
    };
    fetchSpots();
  }, []);

  // Fungsi untuk mendapatkan posisi pengguna menggunakan Geolocation API
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

  // Menambahkan ikon kustom
  const defaultIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  // Menampilkan lokasi pengguna di peta jika ada
  useEffect(() => {
    getUserLocation();
  }, []);

  // Statistik laporan berdasarkan kategori
  const reportCategories = reports.reduce((acc, report) => {
    const category = report.report_type || report.category || 'Tidak Dikategorikan';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(reportCategories).map(key => ({
    name: key,
    value: reportCategories[key],
  }));

  const totalReports = reports.length;

  return (
    <div>
      {/* Statistik Laporan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '20px' }}>
        {/* Chart */}
        <div style={{ flex: '1', backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' }}>
          <h3>Chart Marker</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Category */}
        <div style={{ flex: '1', backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' }}>
          <h3>Summary Category</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px' }}>Name</th>
                <th style={{ backgroundColor: '#4A90E2', color: 'white', padding: '12px' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(reportCategories).map((category) => (
                <tr key={category}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>{category}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>{reportCategories[category]}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '12px', backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #4A90E2' }}>Total</td>
                <td style={{ padding: '12px', backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #4A90E2' }}>{totalReports}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Peta */}
      <MapContainer center={mapCenter} zoom={5} style={{ width: '100%', height: '500px', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {userPosition && (
          <Marker position={[userPosition.latitude, userPosition.longitude]} icon={defaultIcon}>
            <Popup>
              <strong>Lokasi Pengguna</strong><br />
              Latitude: {userPosition.latitude}<br />
              Longitude: {userPosition.longitude}
            </Popup>
          </Marker>
        )}

        {/* Marker untuk laporan dari koleksi spots */}
        {spots.map((spot) => {
          const { latitude, longitude } = spot;
          if (!latitude || !longitude) return null;
          return (
            <Marker key={spot.id} position={[latitude, longitude]} icon={defaultIcon}>
              <Popup>
                <strong>{spot.title}</strong><br />
                {spot.description}<br />
                Kategori: {spot.category}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div style={{ marginTop: '20px' }}>
        <h2>Total Laporan: {totalReports}</h2>
      </div>
    </div>
  );
};

export default Dashboard;
