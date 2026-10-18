import React from 'react';
import { NavLink, Link } from 'react-router-dom';

/**
 * Navigation items configuration with accessible labels, paths, academic tags, and SVG icons.
 */
const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    badge: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    )
  },
  {
    to: '/navigator',
    label: 'Campus Navigator',
    badge: 'DAA',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    )
  },
  {
    to: '/architecture',
    label: 'Computer Architecture',
    badge: 'COA',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    )
  },
  {
    to: '/workflow',
    label: 'Request Workflow',
    badge: 'FLAT',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <line x1="6" y1="9" x2="6" y2="21" />
      </svg>
    )
  },
  {
    to: '/history',
    label: 'Request History',
    badge: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  }
];

/**
 * Reusable Sidebar navigation component.
 * 
 * @param {Object} props
 * @param {boolean} [props.isOpen=false] - Whether the mobile drawer is open
 * @param {Function} [props.onClose] - Callback when closing the mobile drawer
 */
export default function Sidebar({ isOpen = false, onClose }) {
  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside 
      className={`layout-sidebar ${isOpen ? 'open' : ''}`}
      aria-label="Main campus navigation"
    >
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand" onClick={handleLinkClick}>
          <span className="brand-badge">KALVIUM</span>
          <span className="brand-name">Campus Simulator</span>
        </Link>
        {onClose && (
          <button 
            type="button" 
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation sidebar"
          >
            &times;
          </button>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Sidebar navigation links">
        <div className="nav-group-title">Navigation</div>
        <ul className="sidebar-menu">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                onClick={handleLinkClick}
              >
                <span className="sidebar-link-content">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span className={`academic-badge badge-${item.badge.toLowerCase()}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div><strong>Kalvium Simulator</strong> v1.0.0</div>
        <div>DAA &bull; COA &bull; FLAT</div>
      </div>
    </aside>
  );
}
