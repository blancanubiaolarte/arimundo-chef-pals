# ARIMUNDO MASCOTAS · Checklist de publicación (App Store + Google Play)

Versión de la app: **1.0.0** (build 2026.08.27)

## 1. Listo en el código

| Ítem | Estado | Dónde |
| --- | --- | --- |
| Pantalla de carga (splash) | Listo | `src/components/common/AppSplash.tsx` (montado en `__root.tsx`) |
| Iconos Android (48–512 + maskable) | Listo | `public/icons/icon-*.png`, `maskable-512.png` |
| Iconos iOS (120/152/167/180, opacos) | Listo | `public/icons/apple-touch-icon-*.png` + `<link rel="apple-touch-icon">` |
| Nombre de la app | Listo | `manifest.webmanifest` (`ARIMUNDO MASCOTAS` / `ARIMUNDO`) |
| Descripción corta | Listo | `manifest.webmanifest` + `src/lib/app-version.ts` |
| Manejo de errores de red | Listo | `AppSplash`/`NetworkStatus`, `errorComponent` raíz, try/catch en funciones de servidor |
| Pantalla sin conexión | Listo | Banner `NetworkStatus.tsx` + `public/offline.html` (service worker) |
| Página 404 | Listo | `notFoundComponent` en `src/routes/__root.tsx` |
| Página de mantenimiento | Listo | `/mantenimiento` |
| Eliminación de cuenta funcional | Listo | `/eliminar-cuenta` + `src/lib/account.functions.ts` (borrado real de datos y usuario) |
| Política de privacidad | Listo | `/privacidad` |
| Términos y condiciones | Listo | `/terminos` |
| Página de soporte (FAQ) | Listo | `/soporte` |
| Página "Acerca de" | Listo | `/acerca` |
| Página de contacto | Listo | `/contacto` |
| Versión visible | Listo | Pie de `/perfil` y `/acerca` |
| Aviso veterinario | Listo | `Disclaimer` en recetas, Chef IA, perfil, soporte y acerca |
| Timeout + mensajes amigables en OpenAI | Listo | `src/lib/openai.server.ts` (45 s, `AbortSignal.timeout`) |
| Accesibilidad básica | Listo | `role="status"`/`aria-live` en avisos, `aria-hidden` en iconos decorativos, `label` asociado a cada input nuevo, textos ≥ 11 px, contraste sobre tokens del tema |
| Rutas verificadas | Listo | `/`, `/recetas`, `/recetas/$slug`, `/compras`, `/alacena`, `/perros`, `/perros/$dogId`, `/perfil`, `/planes`, `/chef`, `/bienestar`, `/plan-semanal`, `/admin`, `/auth`, `/auth/recuperar`, `/reset-password`, `/onboarding/perro`, `/privacidad`, `/terminos`, `/eliminar-cuenta`, `/soporte`, `/acerca`, `/contacto`, `/mantenimiento` |
| Imágenes | Listo | Todas las referencias apuntan a archivos existentes en `public/images` y `public/icons` |

## 2. Falta fuera del código (tareas de cuenta y tienda)

### Google Play
1. Cuenta de desarrollador (25 USD) y verificación de identidad; cuentas personales requieren 12 testers en prueba cerrada durante 14 días.
2. Empaquetar con Bubblewrap (ver `PLAY_STORE.md`), `packageId` sugerido `app.arimundo.mascotas`.
3. Pegar la huella SHA-256 real en `public/.well-known/assetlinks.json` (hoy es un placeholder) y desplegar.
4. Assets de ficha: icono 512×512, gráfico destacado 1024×500, mínimo 2 capturas.
5. Formulario de Data Safety, clasificación IARC, URL de privacidad y URL de eliminación de cuenta.
6. Pagos: Google exige Play Billing para suscripciones dentro de la app. Recomendación inicial: ocultar la compra en el build Android y mantener Stripe solo en la web.

### Apple App Store
1. Apple Developer Program (99 USD/año).
2. Una web app envuelta necesita **valor nativo añadido** para pasar la guía 4.2 (por ejemplo, notificaciones push, cámara, widgets). Recomendación: empaquetar con **Capacitor** en lugar de un WKWebView simple.
3. Suscripciones digitales deben usar **StoreKit / In-App Purchase**; Stripe dentro de la app iOS causa rechazo.
4. Requisitos de ficha: icono 1024×1024 sin transparencia, capturas 6.7" y 5.5", política de privacidad, App Privacy ("Nutrition labels"), eliminación de cuenta desde la app (ya implementada), edad 17+ o 4+ según contenido.
5. Añadir `NSPhotoLibraryUsageDescription` / `NSCameraUsageDescription` en el `Info.plist` si se activa la subida de fotos de la mascota.

## 3. Antes de cada release
- Ejecutar `bun run build` y comprobar que no hay errores.
- Revisar la consola del navegador en `/`, `/chef` y `/recetas` (debe estar limpia).
- Confirmar variables de entorno en producción: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, price IDs de Stripe y credenciales de Supabase.
- Subir la versión en `src/lib/app-version.ts` y en el `versionCode` del empaquetado.
