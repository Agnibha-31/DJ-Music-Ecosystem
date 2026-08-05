import { useEffect } from 'react';

export function MobileOptimizer() {
  useEffect(() => {
    // Prevent zoom on mobile
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

  return null;
}
