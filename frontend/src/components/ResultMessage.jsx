import React from 'react';

/**
 * Built-in accessible SVG icons for result message variants.
 */
const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
};

/**
 * Reusable ResultMessage component.
 * 
 * Renders notifications, validation feedback, and server status messages.
 * Uses appropriate WAI-ARIA roles ('alert' for errors/warnings, 'status' for success/info).
 * 
 * @param {Object} props
 * @param {'success'|'error'|'warning'|'info'} [props.type='info'] - Message variant
 * @param {React.ReactNode} [props.text] - Primary message text
 * @param {React.ReactNode} [props.message] - Alternative alias for text
 * @param {React.ReactNode} [props.title] - Optional bold title
 * @param {React.ReactNode} [props.children] - Optional custom child content
 * @param {Function} [props.onDismiss] - Optional dismiss callback
 * @param {string} [props.className=''] - Optional custom CSS class
 */
export default function ResultMessage({
  type = 'info',
  text,
  message,
  title,
  children,
  onDismiss,
  className = ''
}) {
  const content = text || message || children;

  // Do not render empty or fake messages
  if (!content && !title) {
    return null;
  }

  const normalizedType = ['success', 'error', 'warning', 'info'].includes(type)
    ? type
    : 'info';

  const isAlert = normalizedType === 'error' || normalizedType === 'warning';
  const role = isAlert ? 'alert' : 'status';
  const ariaLive = normalizedType === 'error' ? 'assertive' : 'polite';

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`result-message ${normalizedType} ${className}`.trim()}
    >
      <span className="result-message-icon" aria-hidden="true">
        {ICONS[normalizedType]}
      </span>

      <div className="result-message-body">
        {title && (
          <div className="result-message-title">{title}</div>
        )}
        {content && (
          <div className="result-message-text">{content}</div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          className="result-message-close"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          &times;
        </button>
      )}
    </div>
  );
}
