import React, { useEffect } from 'react';
import { useCapacitor } from '../../hooks/useCapacitor';
import { useDarkMode } from '../../hooks/useDarkMode';

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

const MobileOptimizations: React.FC<MobileOptimizationsProps> = ({ children }) => {
  const { isNative, isAndroid, isIOS } = useCapacitor();
  const { darkMode } = useDarkMode();

  // Add platform-specific classes
  const platformClasses = [
    isNative && 'native-app',
    isAndroid && 'android-app',
    isIOS && 'ios-app',
    !isNative && 'web-app',
    darkMode && 'dark'
  ].filter(Boolean).join(' ');

  // Apply dark mode to status bar on native apps
  useEffect(() => {
    if (isNative && window.StatusBar) {
      try {
        if (darkMode) {
          window.StatusBar.styleDefault();
          window.StatusBar.backgroundColorByHexString('#1f2937'); // dark:bg-gray-800
        } else {
          window.StatusBar.styleLightContent();
          window.StatusBar.backgroundColorByHexString('#2563eb'); // bg-blue-600
        }
      } catch (error) {
        console.error('Error setting status bar style:', error);
      }
    }
  }, [darkMode, isNative]);

  return (
    <div className={`${platformClasses} min-h-screen`}>
      {/* Status bar spacer for iOS */}
      {isIOS && isNative && (
        <div className={`h-11 ${darkMode ? 'bg-gray-800' : 'bg-blue-600'}`} />
      )}
      
      {/* Main content */}
      <div className={`${isNative ? 'native-content' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default MobileOptimizations;