import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

export const useCapacitor = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    const setupCapacitor = async () => {
      const native = Capacitor.isNativePlatform();
      const currentPlatform = Capacitor.getPlatform();
      
      setIsNative(native);
      setPlatform(currentPlatform);

      if (native) {
        console.log('🚀 Running on native platform:', currentPlatform);

        // Configure status bar
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#2563eb' });
        } catch (error) {
          console.log('StatusBar not available:', error);
        }

        // Hide splash screen after app loads
        try {
          await SplashScreen.hide();
        } catch (error) {
          console.log('SplashScreen not available:', error);
        }

        // Configure keyboard
        try {
          Keyboard.addListener('keyboardWillShow', (info) => {
            console.log('Keyboard will show with height:', info.keyboardHeight);
          });

          Keyboard.addListener('keyboardDidShow', (info) => {
            console.log('Keyboard shown with height:', info.keyboardHeight);
          });

          Keyboard.addListener('keyboardWillHide', () => {
            console.log('Keyboard will hide');
          });

          Keyboard.addListener('keyboardDidHide', () => {
            console.log('Keyboard hidden');
          });
        } catch (error) {
          console.log('Keyboard not available:', error);
        }

        // Handle app state changes
        try {
          App.addListener('appStateChange', ({ isActive }) => {
            console.log('App state changed. Is active?', isActive);
          });

          App.addListener('appUrlOpen', (event) => {
            console.log('App opened via URL:', event.url);
          });

          App.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              App.exitApp();
            } else {
              window.history.back();
            }
          });
        } catch (error) {
          console.log('App listeners not available:', error);
        }
      } else {
        console.log('🌐 Running on web platform');
      }
    };

    setupCapacitor();
  }, []);

  return {
    isNative,
    platform,
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web'
  };
};