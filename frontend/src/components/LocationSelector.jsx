import React from 'react';

/**
 * Reusable LocationSelector component for DAA Graph Navigation.
 * 
 * Renders accessible start and destination dropdowns from the locations array passed by the parent.
 * Prevents or alerts when the start and destination match.
 * 
 * @param {Object} props
 * @param {Array<Object>} props.locations - Array of landmark objects [{ id, name, category, ... }]
 * @param {string} props.startLocation - Selected start landmark ID
 * @param {string} props.destinationLocation - Selected destination landmark ID
 * @param {Function} [props.onStartChange] - Callback when start location changes
 * @param {Function} [props.onDestinationChange] - Callback when destination changes
 * @param {Function} [props.onChange] - Combined callback ({ start, destination })
 * @param {boolean} [props.disabled=false] - Whether inputs are disabled
 * @param {string} [props.className] - Optional extra CSS class
 */
export default function LocationSelector({
  locations = [],
  startLocation = '',
  destinationLocation = '',
  onStartChange,
  onDestinationChange,
  onChange,
  disabled = false,
  className = ''
}) {
  const isSameLocation = Boolean(
    startLocation && destinationLocation && startLocation === destinationLocation
  );

  const handleStartSelect = (e) => {
    const nextStart = e.target.value;
    if (onStartChange) onStartChange(nextStart);
    if (onChange) onChange({ start: nextStart, destination: destinationLocation });
  };

  const handleDestinationSelect = (e) => {
    const nextDestination = e.target.value;
    if (onDestinationChange) onDestinationChange(nextDestination);
    if (onChange) onChange({ start: startLocation, destination: nextDestination });
  };

  const handleSwap = () => {
    if (!startLocation || !destinationLocation || startLocation === destinationLocation) return;
    if (onStartChange) onStartChange(destinationLocation);
    if (onDestinationChange) onDestinationChange(startLocation);
    if (onChange) onChange({ start: destinationLocation, destination: startLocation });
  };

  return (
    <div className={`location-selector-container ${className}`.trim()}>
      <div className="form-row">
        {/* Start Location Dropdown */}
        <div className="form-group">
          <label htmlFor="start-location-select" className="form-label">
            <span>Start Location (Node A)</span>
          </label>
          <select
            id="start-location-select"
            className={`form-select ${isSameLocation ? 'has-error' : ''}`}
            value={startLocation}
            onChange={handleStartSelect}
            disabled={disabled || locations.length === 0}
            aria-describedby={isSameLocation ? 'location-error-msg' : undefined}
            aria-invalid={isSameLocation}
          >
            <option value="" disabled>-- Select Starting Landmark --</option>
            {locations.map((loc) => {
              const isSelectedAsTarget = loc.id === destinationLocation;
              return (
                <option key={`start-${loc.id}`} value={loc.id}>
                  {loc.name} ({loc.id}){isSelectedAsTarget ? ' — (Current Destination)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Swap Button */}
        <div>
          <button
            type="button"
            className="form-swap-btn"
            onClick={handleSwap}
            disabled={disabled || !startLocation || !destinationLocation || isSameLocation}
            title="Swap start and destination locations"
            aria-label="Swap starting and destination locations"
          >
            &#8644;
          </button>
        </div>

        {/* Destination Location Dropdown */}
        <div className="form-group">
          <label htmlFor="destination-location-select" className="form-label">
            <span>Destination (Node B)</span>
          </label>
          <select
            id="destination-location-select"
            className={`form-select ${isSameLocation ? 'has-error' : ''}`}
            value={destinationLocation}
            onChange={handleDestinationSelect}
            disabled={disabled || locations.length === 0}
            aria-describedby={isSameLocation ? 'location-error-msg' : undefined}
            aria-invalid={isSameLocation}
          >
            <option value="" disabled>-- Select Destination Landmark --</option>
            {locations.map((loc) => {
              const isSelectedAsStart = loc.id === startLocation;
              return (
                <option key={`dest-${loc.id}`} value={loc.id}>
                  {loc.name} ({loc.id}){isSelectedAsStart ? ' — (Current Start)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Same Location Warning Alert */}
      {isSameLocation && (
        <div 
          id="location-error-msg" 
          className="location-validation-alert" 
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden="true">&#9888;</span>
          <span>
            <strong>Identical Location Selected:</strong> Start and destination cannot be the same landmark. Please pick a distinct destination to compute a navigation path.
          </span>
        </div>
      )}
    </div>
  );
}
