import React from 'react';

const ReportCard = ({ report }) => {
  // Mengonversi timestamp ke Date
  const date = new Date(report.timestamp.seconds * 1000);
  const formattedDate = date.toLocaleString();

  return (
    <div className="report-card">
      <h2>{report.report_type}</h2>
      <table border="1" style={{ width: '100%', margin: '10px 0', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td><strong>Deskripsi:</strong></td>
            <td>{report.description}</td>
          </tr>
          <tr>
            <td><strong>Latitude:</strong></td>
            <td>{report.latitude}</td>
          </tr>
          <tr>
            <td><strong>Longitude:</strong></td>
            <td>{report.longitude}</td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td>{report.status}</td>
          </tr>
          <tr>
            <td><strong>Timestamp:</strong></td>
            <td>{formattedDate}</td>
          </tr>
        </tbody>
      </table>
      <img src={report.image_url} alt="Report" width="200" />
    </div>
  );
};

export default ReportCard;
