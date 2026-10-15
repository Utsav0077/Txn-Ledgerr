import React from 'react';
import './Globe.css';

export const Globe: React.FC = () => {
  return (
    <div className="globe-container">
      <svg viewBox="0 0 200 200" className="globe-svg" aria-label="Technical wireframe globe visualization">
        {/* Simple elegant wireframe */}
        <g className="wireframe-mesh" stroke="currentColor" fill="none" strokeWidth="0.2">
          {/* Latitude lines */}
          <circle cx="100" cy="100" r="80" />
          <ellipse cx="100" cy="100" rx="80" ry="20" />
          <ellipse cx="100" cy="100" rx="80" ry="40" />
          <ellipse cx="100" cy="100" rx="80" ry="60" />
          {/* Longitude lines */}
          <ellipse cx="100" cy="100" rx="20" ry="80" />
          <ellipse cx="100" cy="100" rx="40" ry="80" />
          <ellipse cx="100" cy="100" rx="60" ry="80" />
        </g>
      </svg>
    </div>
  );
};
