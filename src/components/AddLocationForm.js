import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // Mengimpor konfigurasi Firebase
import L from 'leaflet'; // Mengimpor Leaflet untuk ikon kustom

const AddLocationForm = () => {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedPosition, setSelectedPosition] = useState([0, 0]); // Menyimpan posisi yang dipilih
  const [savedLocations, setSavedLocations] = useState([]); // Menyimpan semua lokasi yang sudah disimpan
  const [showNotification, setShowNotification] = useState(false); // Untuk menampilkan notifikasi
  const [notificationMessage, setNotificationMessage] = useState('');
  // const navigate = useNavigate(); // Navigasi ke halaman lain setelah submit

  // Koordinat untuk pusat peta di Indonesia
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

  // Fungsi untuk memilih lokasi pada peta
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setLatitude(lat.toString());    // Menyimpan latitude yang dipilih pada peta
    setLongitude(lng.toString());   // Menyimpan longitude yang dipilih pada peta
    setSelectedPosition([lat, lng]);  // Menyimpan posisi yang dipilih
  };

  // Fungsi untuk menampilkan notifikasi
  const showSuccessNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000); // Notifikasi hilang setelah 3 detik
  };

  // Fungsi untuk menyimpan lokasi ke Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi input
    if (!selectedPosition[0] || !selectedPosition[1] || selectedPosition[0] === 0 || selectedPosition[1] === 0) {
      alert('Silakan pilih lokasi pada peta terlebih dahulu');
      return;
    }

    // Menyimpan data ke Firestore
    try {
      const newLocation = {
        category: category,         // Kategori dari input
        title: title,               // Nama lokasi
        description: description,   // Deskripsi lokasi
        latitude: selectedPosition[0],  // Latitude dari posisi yang dipilih
        longitude: selectedPosition[1],  // Longitude dari posisi yang dipilih
        timestamp: new Date(),      // Waktu saat lokasi ditambahkan
      };

      const docRef = await addDoc(collection(db, 'spots'), newLocation);
      
      // Tambahkan lokasi baru ke state dengan ID dari Firestore
      const locationWithId = {
        id: docRef.id,
        ...newLocation
      };
      setSavedLocations([locationWithId, ...savedLocations]);

      // Reset form
      setCategory('');
      setTitle('');
      setDescription('');
      setLatitude('');
      setLongitude('');
      setSelectedPosition([0, 0]);

      // Tampilkan notifikasi berhasil
      showSuccessNotification(`Lokasi "${title}" berhasil ditambahkan!`);
      
    } catch (error) {
      console.error('Error adding document: ', error);
      showSuccessNotification('Terjadi kesalahan saat menyimpan lokasi');
    }
  };

  // Ikon kustom untuk marker yang baru dipilih
  const selectedIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  // Ikon kustom untuk marker yang sudah disimpan (warna berbeda)
  const savedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  // Fungsi untuk memperbarui peta berdasarkan input latitude dan longitude
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

  // Style untuk notifikasi
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
      {/* Notifikasi */}
      <div style={notificationStyle}>
        <strong>✅ {notificationMessage}</strong>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
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
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">Pilih Kategori</option>
                <option value="Jalan Rusak">Jalan Rusak</option>
                <option value="Fasilitas Umum">Fasilitas Umum</option>
                <option value="Lalin & Lampu Jalan">Lalin & Lampu Jalan</option>
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nama Lokasi"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Deskripsi</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Deskripsi Lokasi"
                style={{ width: '100%', padding: '8px', minHeight: '80px' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                placeholder="Masukkan Latitude atau klik pada peta"
                style={{ width: '100%', padding: '8px' }}
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
                style={{ width: '100%', padding: '8px' }}
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
                cursor: 'pointer'
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
                cursor: 'pointer'
              }}
            >
              Simpan Lokasi
            </button>
          </form>

          {/* Info lokasi yang dipilih */}
          {selectedPosition[0] !== 0 && selectedPosition[1] !== 0 && (
            <div style={{ 
              marginTop: '20px', 
              padding: '10px', 
              backgroundColor: '#f0f8ff', 
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}>
              <h4>Lokasi yang Dipilih:</h4>
              <p><strong>Latitude:</strong> {selectedPosition[0]}</p>
              <p><strong>Longitude:</strong> {selectedPosition[1]}</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ width: '50%' }}>
          <h3>Peta Lokasi</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Klik pada peta untuk memilih lokasi baru. 
            <br />
            🔵 Marker biru: Lokasi yang akan ditambahkan
            <br />
            🟢 Marker hijau: Lokasi yang sudah disimpan
          </p>
          <MapContainer
            center={indonesiaCenter}  // Pusat peta di Indonesia
            zoom={5}  // Zoom level untuk seluruh Indonesia
            style={{ width: '100%', height: '500px' }}
            whenCreated={(map) => map.on('click', handleMapClick)}  // Fungsi untuk memilih lokasi
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            
            {/* Marker untuk lokasi yang sedang dipilih */}
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

            {/* Marker untuk semua lokasi yang sudah disimpan */}
            {savedLocations.map((location) => {
              if (!location.latitude || !location.longitude) return null;
              return (
                <Marker 
                  key={location.id} 
                  position={[location.latitude, location.longitude]} 
                  icon={savedIcon}
                >
                  <Popup>
                    <strong>{location.title}</strong>
                    <br />
                    <em>Kategori: {location.category}</em>
                    <br />
                    {location.description}
                    <br />
                    <small>
                      Lat: {location.latitude.toFixed ? location.latitude.toFixed(6) : location.latitude}
                      <br />
                      Lng: {location.longitude.toFixed ? location.longitude.toFixed(6) : location.longitude}
                    </small>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* CSS untuk animasi notifikasi */}
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