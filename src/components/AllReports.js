import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // Mengimpor konfigurasi Firebase

const AllReports = () => {
  const [reports, setReports] = useState([]);

  // Ambil semua laporan dari Firestore
  useEffect(() => {
    const fetchReports = async () => {
      const reportsCollection = collection(db, 'reports');
      const reportsQuery = query(reportsCollection, orderBy('timestamp', 'desc')); // Urutkan berdasarkan timestamp (terbaru)
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsList = reportsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReports(reportsList);
    };

    fetchReports();
  }, []);

  // Fungsi untuk menghapus laporan
  const handleDeleteReport = async (id) => {
    const reportDoc = doc(db, 'reports', id);
    await deleteDoc(reportDoc); // Menghapus laporan dari Firestore

    // Memperbarui state secara real-time untuk menghilangkan laporan yang dihapus
    setReports(reports.filter((report) => report.id !== id));
  };

  // Fungsi untuk memverifikasi laporan
  const handleVerifyReport = async (id) => {
    const reportDoc = doc(db, 'reports', id);
    await updateDoc(reportDoc, {
      status: 'Terverifikasi',  // Update status menjadi 'Terverifikasi'
    });

    // Memperbarui status pada laporan yang terverifikasi di state secara realtime
    setReports(reports.map(report =>
      report.id === id ? { ...report, status: 'Terverifikasi' } : report
    ));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Semua Laporan</h1>
      <table style={{ width: '100%', margin: '10px 0', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Nama Produk</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Deskripsi</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Latitude</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Longitude</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Timestamp</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Pengirim</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Lokasi</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Gambar</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Verifikasi</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>Aksi</th> {/* Kolom untuk aksi seperti verifikasi dan hapus */}
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const timestamp = report.timestamp ? new Date(report.timestamp.seconds * 1000).toLocaleString() : 'Tidak ada timestamp'; // Validasi timestamp
            return (
              <tr key={report.id}>
                <td style={{ padding: '12px 15px' }}>{report.report_type}</td>
                <td style={{ padding: '12px 15px' }}>{report.description}</td>
                <td style={{ padding: '12px 15px' }}>{report.latitude}</td>
                <td style={{ padding: '12px 15px' }}>{report.longitude}</td>
                <td style={{ padding: '12px 15px' }}>{report.status}</td>
                <td style={{ padding: '12px 15px' }}>{timestamp}</td> {/* Tampilkan timestamp yang sudah diurutkan */}
                <td style={{ padding: '12px 15px' }}>{report.user_id}</td>
                <td style={{ padding: '12px 15px' }}>{report.location}</td>
                <td style={{ padding: '12px 15px' }}>
                  {report.image_url && (
                    <img src={report.image_url} alt="Report" width="100" height="100" />
                  )}
                </td>
                <td style={{ padding: '12px 15px' }}>
                  {report.status === 'Menunggu Verifikasi' && (
                    <button
                      onClick={() => handleVerifyReport(report.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Verifikasi
                    </button>
                  )}
                  {report.status === 'Terverifikasi' && (
                    <span>Sudah Terverifikasi</span>
                  )}
                </td>
                <td style={{ padding: '12px 15px' }}>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#F44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Hapus
                  </button>
                </td> {/* Tombol Hapus */}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AllReports;
