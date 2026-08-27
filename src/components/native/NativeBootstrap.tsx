import { useEffect } from "react";

/**
 * Inicialización del contenedor nativo (Capacitor).
 * En web no hace nada: todos los plugins se importan dinámicamente y solo
 * cuando la app corre dentro de iOS/Android. No altera el diseño ni la lógica.
 */
export function NativeBootstrap() {
  useEffect(() => {
    let disposed = false;
    const cleanups: Array<() => void> = [];

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      document.documentElement.dataset["native"] = Capacitor.getPlatform();

      // Status bar con los colores de marca.
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Light });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#F6B221" });
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch {
        /* plugin no disponible */
      }

      // Teclado: redimensionar la vista en lugar de taparla.
      try {
        const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
        await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
        if (Capacitor.getPlatform() === "ios") await Keyboard.setAccessoryBarVisible({ isVisible: true });
      } catch {
        /* plugin no disponible */
      }

      // Ocultar el splash nativo cuando la web ya está lista.
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch {
        /* plugin no disponible */
      }

      // Deep links / Universal Links / App Links → rutas internas.
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("appUrlOpen", ({ url }) => {
          try {
            const parsed = new URL(url);
            const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
            if (path && path !== window.location.pathname) {
              window.history.pushState({}, "", path);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          } catch {
            /* url no parseable */
          }
        });
        cleanups.push(() => void listener.remove());

        const backListener = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) window.history.back();
          else void App.exitApp();
        });
        cleanups.push(() => void backListener.remove());
      } catch {
        /* plugin no disponible */
      }

      if (disposed) cleanups.forEach((fn) => fn());
    })();

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
