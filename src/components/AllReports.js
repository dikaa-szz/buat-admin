import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const AllReports = () => {
  const [reports, setReports] = useState([]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      const reportsCollection = collection(db, 'reports');
      const reportsQuery = query(reportsCollection, orderBy('timestamp', 'desc'));
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsList = reportsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReports(reportsList);
    };

    fetchReports();
  }, []);

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
  };

  // FUNGSI VERIFIKASI YANG DIPERBAIKI
  const handleVerifyReport = async (id) => {
    const reportDoc = doc(db, 'reports', id);
    await updateDoc(reportDoc, {
      status: 'Dalam Proses', // Ubah dari 'Terverifikasi' ke 'Dalam Proses'
      verified_at: serverTimestamp(), // Tambahkan timestamp verifikasi
      in_progress_at: serverTimestamp(), // Tambahkan timestamp mulai proses
    });

    setReports(reports.map(report =>
      report.id === id ? { ...report, status: 'Dalam Proses' } : report
    ));
    
    setNotification('Laporan berhasil diverifikasi dan status diubah ke "Dalam Proses"');
    setTimeout(() => setNotification(''), 3000);
  };

  // FUNGSI UNTUK MENANDAI LAPORAN SELESAI
  const handleCompleteReport = async (id) => {
    const reportDoc = doc(db, 'reports', id);
    await updateDoc(reportDoc, {
      status: 'Selesai',
      completed_at: serverTimestamp(), // Tambahkan timestamp selesai
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
        return '#FF9800'; // Orange
      case 'Dalam Proses':
        return '#2196F3'; // Blue
      case 'Selesai':
        return '#4CAF50'; // Green
      case 'Ditolak':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#00897B', marginBottom: '20px' }}>Semua Laporan</h1>

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

      {Object.keys(groupedReports).map((reportType) => (
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
                          {/* Tombol Verifikasi (hanya jika Menunggu Verifikasi) */}
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
                          
                          {/* Tombol Selesai (hanya jika Dalam Proses) */}
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
                          
                          {/* Info jika sudah selesai */}
                          {report.status === 'Selesai' && (
                            <span style={{ 
                              color: '#4CAF50', 
                              fontWeight: 'bold',
                              fontSize: '13px' 
                            }}>
                              ✓ Sudah Selesai
                            </span>
                          )}
                          
                          {/* Tombol Hapus (selalu ada) */}
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