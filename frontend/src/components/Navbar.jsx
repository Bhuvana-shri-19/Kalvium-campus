import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import '../styles/navbar.css';

/**
 * Contextual labels and academic discipline metadata for active routes.
 */
const ROUTE_CONTEXT_MAP = {
  '/': { title: 'Home Overview', badge: null },
  '/dashboard': { title: 'Dashboard', badge: null },
  '/navigator': { title: 'Campus Navigator', badge: 'DAA' },
  '/architecture': { title: 'Computer Architecture', badge: 'COA' },
  '/workflow': { title: 'Request Workflow', badge: 'FLAT' },
  '/history': { title: 'Request History', badge: null },
  '/requests': { title: 'Request History', badge: null }
};

/**
 * Shared Top Navigation Bar component.
 * 
 * Displays brand, active route context, responsive mobile menu control, and engine status.
 * Intentionally excludes authentication, fake profiles, and mockup notification elements.
 * 
 * @param {Object} props
 * @param {Function} [props.onToggleMobileMenu] - Callback to toggle mobile sidebar drawer
 */
export default function Navbar({ onToggleMobileMenu }) {
  const location = useLocation();
  const currentContext = ROUTE_CONTEXT_MAP[location.pathname] || { title: 'Campus Simulator', badge: null };

  return (
    <header className="top-navbar" aria-label="Top navigation bar">
      <div className="top-navbar-left">
        {onToggleMobileMenu && (
          <button
            type="button"
            className="hamburger-btn"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            &#9776;
          </button>
        )}

        <Link to="/" className="navbar-brand-link" aria-label="Kalvium Campus Simulator Home">
          <span className="brand-badge">KALVIUM</span>
          <span className="brand-text">Campus Simulator</span>
        </Link>

        {currentContext.title && (
          <>
            <span className="context-divider" aria-hidden="true">/</span>
            <div className="page-context">
              <span className="page-context-title">{currentContext.title}</span>
              {currentContext.badge && (
                <span className={`academic-badge badge-${currentContext.badge.toLowerCase()}`}>
                  {currentContext.badge}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="top-navbar-right">
        <StatusBadge status="online" label="Engine Active" />
      </div>
    </header>
  );
}
