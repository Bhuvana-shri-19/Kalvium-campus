import React from 'react';
import '../styles/layout.css';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div>
          <strong>Kalvium Campus Navigator & Request Processing Simulator</strong> &copy; 2026
        </div>
        <div className="footer-academic-tags">
          <span className="academic-badge badge-daa">DAA</span>
          <span className="academic-badge badge-coa">COA</span>
          <span className="academic-badge badge-flat">FLAT</span>
        </div>
      </div>
    </footer>
  );
}
