import React from 'react';
import { useCapacitor } from '../../hooks/useCapacitor';

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

const MobileOptimizations: React.FC<MobileOptimizationsProps> = ({ children }) => {
  const { isNative, isAndroid, isIOS } = useCapacitor();

  // Add platform-specific classes
  const platformClasses = [
    isNative && 'native-app',
    isAndroid && 'android-app',
    isIOS && 'ios-app',
    !isNative && 'web-app'
  ].filter(Boolean).join(' ');

  return (
    <div className={`${platformClasses} min-h-screen`}>
      {/* Status bar spacer for iOS */}
      {isIOS && isNative && (
        <div className="h-11 bg-blue-600" />
      )}
      
      {/* Main content */}
      <div className={`${isNative ? 'native-content' : ''}`}>
        {children}
      </div>

      {/* Safe area bottom spacer for iOS */}
      {isIOS && isNative && (
        <div className="h-8" />
      )}
    </div>
  );
};

export default MobileOptimizations;