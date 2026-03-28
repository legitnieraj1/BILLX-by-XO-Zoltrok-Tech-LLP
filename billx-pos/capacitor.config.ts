import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zoltrok.billx.pos',
  appName: 'billX POS',
  webDir: 'out', // Next.js static export directory
  bundledWebRuntime: false,
  server: {
    // For local development on device, uncomment and add your local IP
    // url: 'http://192.168.1.xxx:3000',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#022448",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
