import { useEffect } from 'react';

/**
 * Hook to apply client-side security measures
 */
export function useSecurityHeaders() {
  useEffect(() => {
    // Prevent clickjacking - break out of frames
    if (window.self !== window.top) {
      try {
        // Attempt to break out of frame
        if (window.top) {
          window.top.location.href = window.self.location.href;
        }
      } catch {
        // If we can't access top, hide the content
        document.body.style.display = 'none';
        console.error('Security: Application loaded in unauthorized frame');
      }
    }

    // Disable right-click context menu in production (optional, can be removed)
    // This is a minor deterrent, not a real security measure
    
    // Warn about console usage
    if (process.env.NODE_ENV === 'production') {
      const warningStyle = 'color: red; font-size: 24px; font-weight: bold;';
      console.log('%cSTOP!', warningStyle);
      console.log(
        '%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your account.',
        'color: red; font-size: 14px;'
      );
    }

    // Detect DevTools opening (optional monitoring)
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // DevTools might be open - log for monitoring but don't block
        console.log('DevTools detected');
      }
    };

    // Check periodically (only in production)
    let devToolsInterval: NodeJS.Timeout | undefined;
    if (process.env.NODE_ENV === 'production') {
      devToolsInterval = setInterval(detectDevTools, 1000);
    }

    return () => {
      if (devToolsInterval) {
        clearInterval(devToolsInterval);
      }
    };
  }, []);
}

/**
 * Hook to detect and prevent session hijacking attempts
 */
export function useSessionIntegrity() {
  useEffect(() => {
    const sessionFingerprint = generateBrowserFingerprint();
    const storedFingerprint = sessionStorage.getItem('__sf');

    if (storedFingerprint && storedFingerprint !== sessionFingerprint) {
      // Fingerprint mismatch - possible session hijacking
      console.warn('Session integrity check failed');
      // In production, you might want to force logout here
    } else {
      sessionStorage.setItem('__sf', sessionFingerprint);
    }
  }, []);
}

function generateBrowserFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ];

  // Simple hash
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return hash.toString(36);
}
