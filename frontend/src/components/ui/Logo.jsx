import React from 'react';

export function Logo({ size = 24, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle / wave outline */}
      <circle cx="50" cy="50" r="45" fill="url(#dolphinGradient)" opacity="0.1" />
      
      {/* Wave / Splash at the bottom */}
      <path 
        d="M25 65 C 35 85, 65 85, 80 65 C 75 80, 50 90, 20 60 Z" 
        fill="#38bdf8" 
      />
      <path 
        d="M35 60 C 40 75, 60 75, 70 60 C 65 72, 45 78, 30 55 Z" 
        fill="#7dd3fc" 
      />
      
      {/* Dolphin Body */}
      <path 
        d="M85 45 C 80 35, 65 25, 45 25 C 25 25, 20 40, 25 55 C 30 75, 55 60, 55 60 C 55 60, 50 55, 45 55 C 40 55, 35 45, 40 40 C 45 35, 60 35, 70 45 C 70 45, 80 50, 85 45 Z" 
        fill="#2563eb" 
      />
      
      {/* Dorsal Fin */}
      <path 
        d="M45 25 C 40 15, 30 15, 30 15 C 35 20, 35 25, 40 28 Z" 
        fill="#60a5fa" 
      />

      {/* Pectoral Fin */}
      <path 
        d="M45 55 C 45 65, 55 70, 55 70 C 50 60, 48 55, 45 55 Z" 
        fill="#1d4ed8" 
      />

      <defs>
        <linearGradient id="dolphinGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
