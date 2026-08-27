import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ARIMUNDO MASCOTAS — configuración Capacitor (iOS + Android).
 *
 * La app es SSR (TanStack Start), por lo que el contenedor nativo carga el
 * despliegue remoto (Vercel / Lovable). Así la app nativa queda sincronizada
 * automáticamente con cada build del servidor: no hay que republicar en las
 * tiendas para cambios de front.
 *
 * Para trabajar contra el dev server local usa CAP_SERVER_URL:
 *   CAP_SERVER_URL=http://192.168.1.20:8080 npx cap sync
 */
const SERVER_URL = process.env["CAP_SERVER_URL"] ?? "https://arimundo-chef-pals.lovable.app";

const config: CapacitorConfig = {
  appId: "app.arimundo.mascotas",
  appName: "ARIMUNDO MASCOTAS",
  // Carpeta de assets estáticos empaquetados (fallback offline del contenedor).
  webDir: "public",
  bundledWebRuntime: false,
  server: {
    url: SERVER_URL,
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
    hostname: new URL(SERVER_URL).host,
    allowNavigation: [
      "arimundo-chef-pals.lovable.app",
      "*.lovable.app",
      "*.arimundo.app",
      "*.supabase.co",
      "checkout.stripe.com",
      "*.stripe.com",
      "accounts.google.com",
    ],
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
    scrollEnabled: true,
    backgroundColor: "#FFFDF7",
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: "#FFFDF7",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#FFFDF7",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#F6B221",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
      style: "LIGHT",
    },
    PushNotifications: {
      // Preparado; la implementación funcional se hará más adelante.
      presentationOptions: ["badge", "sound", "alert"],
    },
    CapacitorHttp: { enabled: false },
  },
};

export default config;
