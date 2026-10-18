import React from 'react';

/**
 * Reusable PageHeader component providing consistent page titles,
 * descriptive subtitles, and optional action elements across all pages.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.title - Primary semantic page title (rendered in h1)
 * @param {React.ReactNode} [props.description] - Subtitle / context description
 * @param {React.ReactNode} [props.action] - Optional action controls (buttons, badges)
 * @param {React.ReactNode} [props.badge] - Optional academic badge tag
 * @param {string} [props.className] - Optional extra CSS class
 */
export default function PageHeader({ 
  title, 
  description, 
  action, 
  badge,
  className = '' 
}) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div className="page-header-text">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <h1>{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="page-subtitle">{description}</p>
        )}
      </div>

      {action && (
        <div className="page-header-actions">
          {action}
        </div>
      )}
    </header>
  );
}
