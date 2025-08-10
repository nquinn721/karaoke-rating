import { useEffect, useState } from 'react';

interface KeyboardAvoidanceOptions {
  enableOnMobile?: boolean;
  offsetPercent?: number;
}

/**
 * Hook to help modals avoid virtual keyboards on mobile devices
 * Returns styles that should be applied to Dialog components
 */
export const useKeyboardAvoidance = (options: KeyboardAvoidanceOptions = {}) => {
  const { enableOnMobile = true, offsetPercent = 15 } = options;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on a mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (enableOnMobile && typeof window !== 'undefined') {
      // Method 1: Visual Viewport API (most accurate, but limited support)
      if ('visualViewport' in window && window.visualViewport) {
        const handleViewportChange = () => {
          const viewport = window.visualViewport!;
          const viewportHeightDifference = window.innerHeight - viewport.height;
          setIsKeyboardVisible(viewportHeightDifference > 150); // threshold for keyboard
        };

        window.visualViewport.addEventListener('resize', handleViewportChange);
        
        return () => {
          if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleViewportChange);
          }
          window.removeEventListener('resize', checkMobile);
        };
      }

      // Method 2: Fallback using window resize (less accurate but wider support)
      let initialHeight = window.innerHeight;
      
      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialHeight - currentHeight;
        
        // If height decreased by more than 150px, assume keyboard is visible
        setIsKeyboardVisible(heightDifference > 150);
      };

      // Store initial height after a brief delay to avoid false positives
      const timeoutId = setTimeout(() => {
        initialHeight = window.innerHeight;
      }, 500);

      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('resize', checkMobile);
      };
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [enableOnMobile]);

  // Return styles object for Dialog component
  const dialogStyles = {
    '& .MuiDialog-container': {
      alignItems: isMobile && isKeyboardVisible ? 'flex-start' : 'center',
      paddingTop: isMobile && isKeyboardVisible ? `${offsetPercent}vh` : 'auto',
    },
    '& .MuiDialog-paper': {
      margin: isMobile && isKeyboardVisible ? '8px' : '32px',
      maxHeight: isMobile && isKeyboardVisible ? `${85 - offsetPercent}vh` : 'calc(100% - 64px)',
      width: isMobile ? '100%' : 'auto',
      maxWidth: isMobile ? 'calc(100% - 16px)' : '600px',
    },
  };

  return {
    isKeyboardVisible: isMobile && isKeyboardVisible,
    isMobile,
    dialogStyles,
  };
};
