import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import L from 'leaflet';

const AddLocationForm = () => {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('belum_diperbaiki'); // Status baru
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedPosition, setSelectedPosition] = useState([0, 0]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const indonesiaCenter = [-2.548926, 118.014863];

  // Fungsi untuk mengambil semua lokasi yang sudah disimpan dari Firestore
  useEffect(() => {
    const fetchSavedLocations = async () => {
      try {
        const locationsCollection = collection(db, 'spots');
        const locationsQuery = query(locationsCollection, orderBy('timestamp', 'desc'));
        const locationsSnapshot = await getDocs(locationsQuery);
        const locationsList = locationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSavedLocations(locationsList);
      } catch (error) {
        console.error('Error fetching locations: ', error);
      }
    };
    fetchSavedLocations();
  }, []);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    setSelectedPosition([lat, lng]);
  };

  const showSuccessNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPosition[0] || !selectedPosition[1] || selectedPosition[0] === 0 || selectedPosition[1] === 0) {
      alert('Silakan pilih lokasi pada peta terlebih dahulu');
      return;
    }

    try {
      const newLocation = {
        category: category,
        title: title,
        description: description,
        status: status, // Menyimpan status perbaikan
        latitude: selectedPosition[0],
        longitude: selectedPosition[1],
        timestamp: new Date(),
      };

      const docRef = await addDoc(collection(db, 'spots'), newLocation);
      
      const locationWithId = {
        id: docRef.id,
        ...newLocation
      };
      setSavedLocations([locationWithId, ...savedLocations]);

      // Reset form
      setCategory('');
      setTitle('');
      setDescription('');
      setStatus('belum_diperbaiki');
      setLatitude('');
      setLongitude('');
      setSelectedPosition([0, 0]);

      showSuccessNotification(`Lokasi "${title}" berhasil ditambahkan!`);
      
    } catch (error) {
      console.error('Error adding document: ', error);
      showSuccessNotification('Terjadi kesalahan saat menyimpan lokasi');
    }
  };

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

  // Ikon untuk lokasi yang sedang dipilih (biru)
  const selectedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  const handleManualLocationUpdate = () => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedPosition([lat, lng]);
      } else {
        alert('Masukkan koordinat yang valid');
      }
    }
  };

  // Fungsi untuk mendapatkan label status
  const getStatusLabel = (status) => {
    const labels = {
      belum_diperbaiki: 'Belum Diperbaiki',
      sedang_diperbaiki: 'Sedang Diperbaiki',
      sudah_diperbaiki: 'Sudah Diperbaiki',
    };
    return labels[status] || 'Belum Diperbaiki';
  };

  const notificationStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '5px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 1000,
    display: showNotification ? 'block' : 'none',
    animation: showNotification ? 'slideIn 0.3s ease-in' : 'slideOut 0.3s ease-out'
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={notificationStyle}>
        <strong>✅ {notificationMessage}</strong>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', gap: '20px' }}>
        {/* Form Input */}
        <div style={{ width: '45%' }}>
          <h1>Tambah Titik Lokasi Kerusakan</h1>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '10px' }}>
              <label>Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">Pilih Kategori</option>
                <option value="Jalan Rusak">Jalan Rusak</option>
                <option value="Fasilitas Umum">Fasilitas Umum</option>
                <option value="Lalin & Lampu Jalan">Lalin & Lampu Jalan</option>
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Judul</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nama Lokasi"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Deskripsi</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Deskripsi Lokasi"
                style={{ width: '100%', padding: '8px', minHeight: '80px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Status Perbaikan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="belum_diperbaiki">🔴 Belum Diperbaiki</option>
                <option value="sedang_diperbaiki">🟡 Sedang Diperbaiki</option>
                <option value="sudah_diperbaiki">🟢 Sudah Diperbaiki</option>
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                placeholder="Masukkan Latitude atau klik pada peta"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                placeholder="Masukkan Longitude atau klik pada peta"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <button 
              type="button" 
              onClick={handleManualLocationUpdate} 
              style={{ 
                marginBottom: '20px', 
                backgroundColor: '#2196F3', 
                color: 'white', 
                padding: '10px', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Perbarui Lokasi dari Koordinat
            </button>

            <button 
              type="submit" 
              style={{ 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                padding: '10px', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Simpan Lokasi
            </button>
          </form>

          {selectedPosition[0] !== 0 && selectedPosition[1] !== 0 && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '5px',
              border: '1px solid #2196F3'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Lokasi yang Dipilih:</h4>
              <p style={{ margin: '5px 0' }}><strong>Latitude:</strong> {selectedPosition[0].toFixed(6)}</p>
              <p style={{ margin: '5px 0' }}><strong>Longitude:</strong> {selectedPosition[1].toFixed(6)}</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ width: '50%' }}>
          <h3>Peta Lokasi</h3>
          
          {/* Legenda */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '5px',
            marginBottom: '15px',
            border: '1px solid #ddd'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Legenda Marker:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔵</span>
                <span>Lokasi yang akan ditambahkan</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔴</span>
                <span>Belum Diperbaiki</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🟡</span>
                <span>Sedang Diperbaiki</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🟢</span>
                <span>Sudah Diperbaiki</span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Klik pada peta untuk memilih lokasi baru
          </p>
          
          <MapContainer
            center={indonesiaCenter}
            zoom={5}
            style={{ width: '100%', height: '500px', borderRadius: '5px' }}
            whenCreated={(map) => map.on('click', handleMapClick)}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            
            {selectedPosition[0] !== 0 && selectedPosition[1] !== 0 && (
              <Marker position={selectedPosition} icon={selectedIcon}>
                <Popup>
                  <strong>Lokasi yang akan ditambahkan</strong>
                  <br />
                  Lat: {selectedPosition[0].toFixed(6)}
                  <br />
                  Lng: {selectedPosition[1].toFixed(6)}
                </Popup>
              </Marker>
            )}

            {savedLocations.map((location) => {
              if (!location.latitude || !location.longitude) return null;
              return (
                <Marker 
                  key={location.id} 
                  position={[location.latitude, location.longitude]} 
                  icon={getMarkerIcon(location.status || 'belum_diperbaiki')}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <strong style={{ fontSize: '16px' }}>{location.title}</strong>
                      <br />
                      <em>Kategori: {location.category}</em>
                      <br />
                      <div style={{ 
                        marginTop: '5px', 
                        padding: '5px 10px', 
                        backgroundColor: location.status === 'belum_diperbaiki' ? '#ffebee' : 
                                       location.status === 'sedang_diperbaiki' ? '#fff9c4' : '#e8f5e9',
                        borderRadius: '3px',
                        fontWeight: 'bold'
                      }}>
                        Status: {getStatusLabel(location.status || 'belum_diperbaiki')}
                      </div>
                      <br />
                      {location.description}
                      <br />
                      <small style={{ color: '#666' }}>
                        Lat: {location.latitude.toFixed ? location.latitude.toFixed(6) : location.latitude}
                        <br />
                        Lng: {location.longitude.toFixed ? location.longitude.toFixed(6) : location.longitude}
                      </small>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AddLocationForm;