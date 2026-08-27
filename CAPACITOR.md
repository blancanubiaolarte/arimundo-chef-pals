# ARIMUNDO MASCOTAS — apps nativas con Capacitor

Configuración lista para abrir el proyecto en **Android Studio** y **Xcode**.
No se empaqueta nada todavía. El diseño, la navegación y la lógica no cambian.

## Cómo funciona

La app es SSR (TanStack Start), así que el contenedor nativo carga el
despliegue remoto definido en `capacitor.config.ts` (`server.url`). Ventaja:
**cada build de Vercel/Lovable se sincroniza automáticamente** con las apps
publicadas; solo se sube una nueva versión a las tiendas cuando cambia algo
nativo (permisos, plugins, iconos, versión).

## 1. Generar las plataformas (una sola vez, en local)

```sh
npm install
npx cap add android
npx cap add ios          # requiere macOS + Xcode
npx cap sync
```

Apuntar a otro entorno (por ejemplo el dev server de tu red local):

```sh
CAP_SERVER_URL=http://192.168.1.20:8080 npx cap sync
```

## 2. Icono y splash nativos

Los assets fuente ya están en `resources/` (icon.png 1024×1024, splash 2732×2732).

```sh
npx capacitor-assets generate --android --ios
```

Genera mipmaps, adaptive icons, `splash` drawables y los `AppIcon`/`Splash`
imagesets de iOS con el fondo de marca `#FFFDF7`.

## 3. Abrir en los IDE

```sh
npx cap open android
npx cap open ios
```

## 4. Deep Links

- **Android App Links**: `public/.well-known/assetlinks.json` (pega el SHA-256 de
  la firma de Play). En `AndroidManifest.xml` añade al `MainActivity`:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="arimundo-chef-pals.lovable.app" />
</intent-filter>
```

- **Universal Links (iOS)**: `public/.well-known/apple-app-site-association`
  (reemplaza `TEAMID`). En Xcode: *Signing & Capabilities → Associated Domains →*
  `applinks:arimundo-chef-pals.lovable.app`.

- **Esquema propio**: `arimundo://` (Android: intent-filter adicional;
  iOS: `CFBundleURLTypes`).

Las URLs entrantes las resuelve `src/components/native/NativeBootstrap.tsx`.

## 5. Permisos

Android (`AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

iOS (`Info.plist`):

```xml
<key>NSCameraUsageDescription</key>
<string>Para tomar fotos de tu perro y de tus ingredientes.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Para elegir la foto de perfil de tu perro.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Para guardar las recetas e imágenes que compartes.</string>
<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>
```

## 6. Push Notifications (preparado, sin implementar)

`@capacitor/push-notifications` ya está instalado y configurado en
`capacitor.config.ts`. Pendiente cuando se active:

- Android: `google-services.json` en `android/app/` + plugin de Google Services.
- iOS: capability *Push Notifications*, *Background Modes → Remote notifications*
  y la clave APNs en Firebase.
- Registrar el token en el backend y solicitar permiso desde la app.

## 7. Builds

```sh
# Android AAB (Play Store)
cd android && ./gradlew bundleRelease      # app/build/outputs/bundle/release/app-release.aab

# Android APK
cd android && ./gradlew assembleRelease    # app/build/outputs/apk/release/app-release.apk

# iOS IPA
# Xcode → Product → Archive → Distribute App (o xcodebuild -archivePath ... -exportArchive)
```

Firma Android: crea `android/keystore.properties` (no versionarlo) y referencia
el keystore en `android/app/build.gradle` (`signingConfigs.release`).
