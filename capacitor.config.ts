import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ocampista.app',
  appName: 'O Campista',
  webDir: 'dist/o-campista/browser',
  server: {
    androidScheme: 'https',
  },
};

export default config;
