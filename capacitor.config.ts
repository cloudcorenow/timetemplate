import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timeoff.app',
  appName: 'TimeOff-Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
