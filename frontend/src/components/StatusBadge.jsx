import React from 'react';

export default function StatusBadge({ status, label }) {
  const normalizedStatus = (status || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  return (
    <span className={`status-pill ${normalizedStatus}`}>
      <span className="status-dot"></span>
      {label || status}
    </span>
  );
}
