import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const AllReports = () => {
  const [reports, setReports] = useState([]);
  const [notification, setNotification] = useState('');
  const [locationClusters, setLocationClusters] = useState([]);
  const [showClusters, setShowClusters] = useState(false);

  // Fungsi untuk menghitung jarak antara dua koordinat (Haversine formula)
  const calculateDistance = React.useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Konversi ke meter
    return distance;
  }, []);

  // Fungsi untuk mengelompokkan laporan berdasarkan lokasi yang berdekatan
  const clusterReportsByLocation = React.useCallback((reportsList) => {
    const radiusThreshold = 100; // 100 meter radius untuk dianggap lokasi yang sama
    const clusters = [];
    const processed = new Set();

    reportsList.forEach((report, index) => {
      if (processed.has(report.id) || !report.latitude || !report.longitude) return;

      const cluster = {
        location: report.location,
        latitude: report.latitude,
        longitude: report.longitude,
        reports: [report],
        count: 1
      };

      // Cari laporan lain yang berdekatan
      reportsList.forEach((otherReport, otherIndex) => {
        if (
          index !== otherIndex &&
          !processed.has(otherReport.id) &&
          otherReport.latitude &&
          otherReport.longitude
        ) {
          const distance = calculateDistance(
            parseFloat(report.latitude),
            parseFloat(report.longitude),
            parseFloat(otherReport.latitude),
            parseFloat(otherReport.longitude)
          );

          if (distance <= radiusThreshold) {
            cluster.reports.push(otherReport);
            cluster.count++;
            processed.add(otherReport.id);
          }
        }
      });

      if (cluster.count > 1) {
        processed.add(report.id);
        clusters.push(cluster);
      }
    });

    // Urutkan berdasarkan jumlah laporan terbanyak
    return clusters.sort((a, b) => b.count - a.count);
  }, [calculateDistance]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsCollection = collection(db, 'reports');
        const reportsQuery = query(reportsCollection, orderBy('timestamp', 'desc'));
        const reportsSnapshot = await getDocs(reportsQuery);
        
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersMap = {};
        usersSnapshot.docs.forEach((doc) => {
          usersMap[doc.id] = doc.data();
        });

        const reportsList = reportsSnapshot.docs.map((doc) => {
          const reportData = doc.data();
          const userId = reportData.user_id || reportData.userId;
          const userData = userId ? usersMap[userId] : null;
          
          return {
            id: doc.id,
            ...reportData,
            sender_name: userData?.name || 'Pengguna Tidak Dikenal',
            sender_email: userData?.email || '-',
            sender_phone: userData?.no_phone || '-',
          };
        });

        setReports(reportsList);
        
        // Deteksi lokasi yang sama/berdekatan
        const clusters = clusterReportsByLocation(reportsList);
        setLocationClusters(clusters);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, [clusterReportsByLocation]);

  const groupedReports = reports.reduce((acc, report) => {
    const { report_type } = report;
    if (!acc[report_type]) {
      acc[report_type] = [];
    }
    acc[report_type].push(report);
    return acc;
  }, {});

  const handleDeleteReport = async (id) => {
    const reportDoc = doc(db, 'reports', id);
    await deleteDoc(reportDoc);
    setReports(reports.filter((report) => report.id !== id));
    
    // Update clusters setelah delete
    const updatedReports = reports.filter((report) => report.id !== id);
    const clusters = clusterReportsByLocation(updatedReports);
    setLocationClusters(clusters);
  };

  const handleVerifyReport = async (id) => {
    const reportDoc = doc(db, 'reports', id);
    await updateDoc(reportDoc, {
      status: 'Dalam Proses',
      verified_at: serverTimestamp(),
      in_progress_at: serverTimestamp(),
    });

    setReports(reports.map(report =>
      report.id === id ? { ...report, status: 'Dalam Proses' } : report
    ));
    
    setNotification('Laporan berhasil diverifikasi dan status diubah ke "Dalam Proses"');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleCompleteReport = async (id) => {
    const reportDoc = doc(db, 'reports', id);
    await updateDoc(reportDoc, {
      status: 'Selesai',
      completed_at: serverTimestamp(),
    });

    setReports(reports.map(report =>
      report.id === id ? { ...report, status: 'Selesai' } : report
    ));
    
    setNotification('Laporan berhasil diselesaikan');
    setTimeout(() => setNotification(''), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Menunggu Verifikasi':
        return '#FF9800';
      case 'Dalam Proses':
        return '#2196F3';
      case 'Selesai':
        return '#4CAF50';
      case 'Ditolak':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#00897B', margin: 0 }}>Semua Laporan</h1>
        
        <button
          onClick={() => setShowClusters(!showClusters)}
          style={{
            padding: '10px 20px',
            backgroundColor: showClusters ? '#F44336' : '#00897B',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.3s'
          }}
        >
          {showClusters ? '📋 Tampilkan Semua Laporan' : '📍 Deteksi Lokasi Sama'}
        </button>
      </div>

      {notification && (
        <div style={{
          padding: '15px',
          backgroundColor: '#4CAF50',
          color: 'white',
          borderRadius: '5px',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          {notification}
        </div>
      )}

      {/* TAMPILAN CLUSTER LOKASI */}
      {showClusters && (
        <div style={{ marginBottom: '40px' }}>
          {locationClusters.length > 0 ? (
            <>
              <div style={{
                backgroundColor: '#FFF3E0',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '2px solid #FF9800'
              }}>
                <h3 style={{ color: '#E65100', margin: '0 0 10px 0' }}>
                  🚨 Deteksi Lokasi dengan Banyak Laporan
                </h3>
                <p style={{ margin: 0, color: '#666' }}>
                  Ditemukan <strong>{locationClusters.length}</strong> lokasi dengan 2 atau lebih laporan dalam radius 100 meter
                </p>
              </div>

              {locationClusters.map((cluster, clusterIndex) => (
                <div key={clusterIndex} style={{
                  backgroundColor: '#FFF',
                  border: '3px solid #FF5722',
                  borderRadius: '10px',
                  padding: '20px',
                  marginBottom: '25px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                    paddingBottom: '15px',
                    borderBottom: '2px solid #FFE0B2'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: '#E65100', margin: '0 0 5px 0' }}>
                        📍 Lokasi #{clusterIndex + 1}
                      </h3>
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Alamat:</strong> {cluster.location}
                      </p>
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '12px', fontFamily: 'monospace' }}>
                        <strong>Koordinat:</strong> {cluster.latitude}, {cluster.longitude}
                      </p>
                    </div>
                    <div style={{
                      backgroundColor: '#FF5722',
                      color: 'white',
                      padding: '15px 25px',
                      borderRadius: '50px',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      textAlign: 'center',
                      minWidth: '80px'
                    }}>
                      {cluster.count}<br/>
                      <span style={{ fontSize: '12px' }}>Laporan</span>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      backgroundColor: 'white'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#FF5722', color: 'white' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Nama Pengirim</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Tipe Laporan</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Deskripsi</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Status</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Waktu</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Gambar</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cluster.reports.map((report) => {
                          const timestamp = report.timestamp 
                            ? new Date(report.timestamp.seconds * 1000).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-';
                          
                          return (
                            <tr key={report.id} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '10px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontWeight: '600', color: '#00897B', fontSize: '13px' }}>
                                    {report.sender_name}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#666' }}>
                                    {report.sender_email}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '10px', fontSize: '12px' }}>{report.report_type}</td>
                              <td style={{ padding: '10px', maxWidth: '200px', fontSize: '12px' }}>
                                {report.description}
                              </td>
                              <td style={{ padding: '10px' }}>
                                <span style={{
                                  padding: '5px 10px',
                                  borderRadius: '20px',
                                  backgroundColor: getStatusColor(report.status),
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {report.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px', fontSize: '11px' }}>
                                {timestamp}
                              </td>
                              <td style={{ padding: '10px' }}>
                                {report.image_url && (
                                  <img 
                                    src={report.image_url} 
                                    alt="Report" 
                                    style={{ 
                                      width: '60px', 
                                      height: '60px', 
                                      objectFit: 'cover',
                                      borderRadius: '8px',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(report.image_url, '_blank')}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '10px' }}>
                                <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                                  {report.status === 'Menunggu Verifikasi' && (
                                    <button
                                      onClick={() => handleVerifyReport(report.id)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '11px'
                                      }}
                                    >
                                      ✓ Verifikasi
                                    </button>
                                  )}
                                  
                                  {report.status === 'Dalam Proses' && (
                                    <button
                                      onClick={() => handleCompleteReport(report.id)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '11px'
                                      }}
                                    >
                                      ✓ Selesai
                                    </button>
                                  )}
                                  
                                  {report.status === 'Selesai' && (
                                    <span style={{ 
                                      color: '#4CAF50', 
                                      fontWeight: 'bold',
                                      fontSize: '11px' 
                                    }}>
                                      ✓ Selesai
                                    </span>
                                  )}
                                  
                                  <button
                                    onClick={() => handleDeleteReport(report.id)}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#F44336',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      fontSize: '11px'
                                    }}
                                  >
                                    🗑 Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{
              backgroundColor: '#E8F5E9',
              padding: '30px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '2px solid #4CAF50'
            }}>
              <h3 style={{ color: '#2E7D32', margin: '0 0 10px 0' }}>
                ✅ Tidak Ada Lokasi dengan Laporan Ganda
              </h3>
              <p style={{ margin: 0, color: '#666' }}>
                Tidak ditemukan lokasi dengan 2 atau lebih laporan dalam radius 100 meter
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAMPILAN NORMAL - SEMUA LAPORAN */}
      {!showClusters && Object.keys(groupedReports).map((reportType) => (
        <div key={reportType} style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            color: '#00897B', 
            borderBottom: '2px solid #00897B',
            paddingBottom: '10px',
            marginBottom: '15px'
          }}>
            {reportType}
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              border: '1px solid #ddd',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#00897B', color: 'white' }}>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Nama Pengirim</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Tipe Laporan</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Deskripsi</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Lokasi</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Latitude</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Longitude</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Waktu</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Gambar</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {groupedReports[reportType].map((report) => {
                  const timestamp = report.timestamp 
                    ? new Date(report.timestamp.seconds * 1000).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Tidak ada timestamp';
                  
                  return (
                    <tr key={report.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: '600', color: '#00897B' }}>
                            {report.sender_name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#666' }}>
                            {report.sender_email}
                          </span>
                          {report.sender_phone !== '-' && (
                            <span style={{ fontSize: '11px', color: '#666' }}>
                              📞 {report.sender_phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px' }}>{report.report_type}</td>
                      <td style={{ padding: '12px 15px', maxWidth: '200px' }}>
                        {report.description}
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '12px' }}>
                        {report.location}
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '13px', fontFamily: 'monospace' }}>
                        {report.latitude || '-'}
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '13px', fontFamily: 'monospace' }}>
                        {report.longitude || '-'}
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          backgroundColor: getStatusColor(report.status),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}>
                          {report.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '13px' }}>
                        {timestamp}
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        {report.image_url && (
                          <img 
                            src={report.image_url} 
                            alt="Report" 
                            style={{ 
                              width: '80px', 
                              height: '80px', 
                              objectFit: 'cover',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(report.image_url, '_blank')}
                          />
                        )}
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          {report.status === 'Menunggu Verifikasi' && (
                            <button
                              onClick={() => handleVerifyReport(report.id)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '13px'
                              }}
                            >
                              ✓ Verifikasi
                            </button>
                          )}
                          
                          {report.status === 'Dalam Proses' && (
                            <button
                              onClick={() => handleCompleteReport(report.id)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '13px'
                              }}
                            >
                              ✓ Selesai
                            </button>
                          )}
                          
                          {report.status === 'Selesai' && (
                            <span style={{ 
                              color: '#4CAF50', 
                              fontWeight: 'bold',
                              fontSize: '13px' 
                            }}>
                              ✓ Sudah Selesai
                            </span>
                          )}
                          
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#F44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '13px'
                            }}
                          >
                            🗑 Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllReports;