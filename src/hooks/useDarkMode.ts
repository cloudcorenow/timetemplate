import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // Only enable dark mode on mobile devices
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      return false; // Always light mode on desktop
    }
    
    // Check localStorage first for mobile
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    
    // If no localStorage value, check system preference on mobile
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;
    
    // Update document with the current theme, but only on mobile
    if (isMobile && darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage only on mobile
    if (isMobile) {
      localStorage.setItem('darkMode', darkMode.toString());
    }
  }, [darkMode]);

  // Listen for system preference changes only on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
      }
    };
    
    // Add listener for system preference changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Listen for window resize to disable dark mode when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        // Force light mode on desktop
        document.documentElement.classList.remove('dark');
        setDarkMode(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDarkMode = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setDarkMode(prev => !prev);
    }
    // Do nothing on desktop - dark mode toggle is disabled
  };

  return { 
    darkMode: window.innerWidth < 768 ? darkMode : false, // Always false on desktop
    toggleDarkMode 
  };
};