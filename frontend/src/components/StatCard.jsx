import React from 'react';

/**
 * Reusable StatCard component for displaying key quantitative metrics and statuses.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.label - Metric title / label (e.g., 'Total Requests')
 * @param {React.ReactNode} props.value - Primary metric value or status string
 * @param {React.ReactNode} [props.description] - Contextual detail or subtext
 * @param {React.ReactNode} [props.icon] - Optional visual icon element
 * @param {React.ReactNode} [props.badge] - Optional badge or status pill
 * @param {string} [props.className] - Optional custom CSS class
 */
export default function StatCard({
  label,
  value,
  description,
  icon,
  badge,
  className = ''
}) {
  const ariaLabel = typeof label === 'string' && typeof value === 'string'
    ? `${label}: ${value}`
    : typeof label === 'string'
    ? label
    : 'Statistical Metric Card';

  return (
    <article 
      className={`stat-card ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {icon && (
          <span className="stat-card-icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <div className="stat-card-value">
        {value !== undefined && value !== null ? value : '—'}
      </div>

      {(description || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.25rem' }}>
          {description && (
            <span className="stat-card-description">{description}</span>
          )}
          {badge && badge}
        </div>
      )}
    </article>
  );
}
