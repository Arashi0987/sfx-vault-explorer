import { useState, useEffect } from 'react';

export type OSType = 'windows' | 'linux' | 'mac';

export function useOperatingSystem() {
  const [os, setOS] = useState<OSType>(() => {
    // Check localStorage first for user preference
    const saved = localStorage.getItem('preferredOS');
    if (saved === 'windows' || saved === 'linux' || saved === 'mac') {
      return saved as OSType;
    }
    
    // Auto-detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('win') !== -1) {
      return 'windows';
    } else if (userAgent.indexOf('mac') !== -1) {
      return 'mac';
    } else {
      return 'linux';
    }
  });

  const setOperatingSystem = (newOS: OSType) => {
    setOS(newOS);
    localStorage.setItem('preferredOS', newOS);
  };

  return { os, setOS: setOperatingSystem };
}