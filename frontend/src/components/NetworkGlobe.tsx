import React from 'react';
import './NetworkGlobe.css';

export const NetworkGlobe: React.FC = () => {
  return (
    <div className="network-globe-container">
      <svg viewBox="0 0 200 200" className="globe-svg">
        <defs>
          <filter id="glitch">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Latitude lines - denser */}
        <g className="wireframe-lines" filter="url(#glitch)">
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
          <ellipse cx="100" cy="100" rx="80" ry="10" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <ellipse cx="100" cy="100" rx="80" ry="30" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <ellipse cx="100" cy="100" rx="80" ry="50" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <ellipse cx="100" cy="100" rx="80" ry="70" fill="none" stroke="currentColor" strokeWidth="0.4" />
        </g>

        {/* Longitude lines - denser */}
        <g className="wireframe-lines" filter="url(#glitch)">
          <ellipse cx="100" cy="100" rx="10" ry="80" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <ellipse cx="100" cy="100" rx="25" ry="80" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <ellipse cx="100" cy="100" rx="40" ry="80" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <ellipse cx="100" cy="100" rx="55" ry="80" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <ellipse cx="100" cy="100" rx="70" ry="80" fill="none" stroke="currentColor" strokeWidth="0.4" />
        </g>

        {/* Connection points/particles */}
        <g className="particles">
          <circle cx="100" cy="20" r="1.5" fill="#fff" />
          <circle cx="180" cy="100" r="1.5" fill="#fff" />
          <circle cx="100" cy="180" r="1.5" fill="#fff" />
          <circle cx="20" cy="100" r="1.5" fill="#fff" />
        </g>
      </svg>
    </div>
  );
};
