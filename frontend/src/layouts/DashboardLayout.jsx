import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import '../styles/layout.css';

export default function DashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      {/* Mobile Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Reusable Sidebar */}
      <Sidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* Main Layout Area */}
      <div className="layout-main-wrapper">
        {/* Shared Top Navigation Bar */}
        <Navbar 
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} 
        />

        {/* Content Outlet or Children */}
        <main className="main-content">
          {children || <Outlet />}
        </main>

        {/* Application Footer */}
        <Footer />
      </div>
    </div>
  );
}
