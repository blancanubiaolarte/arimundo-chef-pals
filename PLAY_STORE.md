# Publicar ARIMUNDO MASCOTAS en Google Play

La app es una web app (TanStack Start). Para Play Store se empaqueta como **TWA (Trusted Web Activity)** con Bubblewrap: es el camino oficial de Google para apps web y el que menos mantenimiento requiere.

## 1. Requisitos ya implementados en el código

- `public/manifest.webmanifest`: nombre, `start_url`, `scope`, `display: standalone`, `theme_color`, iconos 192/512 + maskable, shortcuts.
- `public/sw.js` + `public/offline.html`: service worker con pantalla offline (requisito de instalabilidad).
- `src/components/pwa/RegisterSW.tsx`: registra el SW en producción.
- Meta tags PWA e `apple-touch-icon` en `src/routes/__root.tsx`.
- `public/.well-known/assetlinks.json`: verificación de dominio (falta pegar tu huella SHA-256).
- Páginas legales obligatorias:
  - `/privacidad` — Política de privacidad (URL obligatoria en la ficha de Play).
  - `/terminos` — Términos y condiciones.
  - `/eliminar-cuenta` — Eliminación de cuenta y datos (obligatorio desde 2023).

## 2. Pasos para generar el APK/AAB

```sh
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://TU-DOMINIO/manifest.webmanifest
# packageId sugerido: app.arimundo.mascotas
bubblewrap build      # genera app-release-bundle.aab y app-release-signed.apk
```

Luego:

1. Obtén la huella de firma: `keytool -list -v -keystore android.keystore -alias android`.
2. Pega el `SHA256` en `public/.well-known/assetlinks.json` (reemplaza el placeholder) y despliega.
   Si usas **Play App Signing**, usa además la huella que Play te muestra en *Configuración > Integridad de la app*.
3. Verifica: `https://TU-DOMINIO/.well-known/assetlinks.json` debe responder JSON con `Content-Type: application/json`.
   Sin esto la app abre con barra de navegador y Play la rechaza como "solo un sitio web".

## 3. Ficha de Play Console (checklist de aprobación)

- Cuenta de desarrollador (25 USD, verificación de identidad; cuentas personales requieren pruebas cerradas con 12 testers durante 14 días).
- Assets: icono 512×512 PNG, gráfico destacado 1024×500, mínimo 2 capturas de teléfono (16:9 o 9:16, 320–3840 px).
- Descripción corta (≤80) y larga (≤4000).
- Clasificación de contenido (cuestionario IARC).
- **Política de privacidad**: `https://TU-DOMINIO/privacidad`.
- **Eliminación de cuenta**: `https://TU-DOMINIO/eliminar-cuenta`.
- **Data safety form**: declara correo, nombre, fotos, datos de la mascota y su uso (personalización), cifrado en tránsito y opción de borrado.
- Público objetivo: 18+ (evita las reglas de Families).
- Anuncios: No.

## 4. Pagos — punto crítico

Google exige **Google Play Billing** para suscripciones digitales consumidas dentro de la app. Stripe dentro del APK causa rechazo. Opciones:

- **A (recomendada al inicio)**: en la versión Android oculta la compra y deja la suscripción solo en la web; la app respeta la suscripción ya activa.
- **B**: integrar Play Billing en la capa nativa y sincronizarlo con la tabla `subscriptions` (requiere salir del TWA puro o usar el Digital Goods API con Play Billing en TWA).

## 5. Alternativa si necesitas APIs nativas

Si más adelante necesitas notificaciones push nativas, cámara avanzada o Play Billing, migra el empaquetado a **Capacitor** (`@capacitor/core`, `@capacitor/android`) apuntando `server.url` a tu dominio o a un build estático. La estructura web actual es compatible con ambos caminos.
