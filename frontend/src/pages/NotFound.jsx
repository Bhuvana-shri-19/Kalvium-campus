import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

export default function NotFound() {
  return (
    <div className="not-found-wrapper">
      <div className="not-found-card" role="main">
        <div className="not-found-code" aria-hidden="true">
          404
        </div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The requested page could not be found. It may have been moved, deleted, or does not exist.
        </p>
        <div className="not-found-actions">
          <Link to="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
