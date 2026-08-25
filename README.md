# ARIMUNDO Chef

Quiero crear una aplicación web responsive llamada ARIMUNDO MASCOTAS.

Voy a adjuntar el logo oficial.

Analiza el logo y utiliza esa identidad visual como base para toda la aplicación.

No modifiques el logo.

No quiero definir colores ni tipografías manualmente.

Quiero que la identidad visual nazca del logo.

La aplicación debe sentirse moderna, profesional, amigable, premium y diseñada principalmente para teléfonos móviles.

No quiero una landing page.

Quiero una aplicación completa.

El objetivo principal es crear un asistente inteligente para dueños de perros que entregue recetas personalizadas diariamente.

La navegación principal debe incluir:

• Inicio

• Recetas

• Compras

• Mis Perros

• Perfil

La arquitectura debe ser escalable.

Preparar el proyecto para conectarlo posteriormente con Supabase, Stripe y OpenAI.

No implementar todavía las integraciones.

Crear toda la estructura de navegación, componentes reutilizables, layouts y pantallas vacías necesarias.

La experiencia debe sentirse como una aplicación móvil profesional. Ahora construye todo el sistema de autenticación.

Debe permitir:

• Registro mediante correo electrónico.

• Inicio de sesión mediante correo.

• Recuperación de contraseña.

• Inicio de sesión con Google (Continuar con Google).

Después del registro debe iniciar automáticamente el proceso de creación del perfil del primer perro.

Agregar un sistema de prueba gratuita.

Todos los usuarios nuevos tendrán:

3 días de prueba gratuita.

Durante la prueba:

No solicitar tarjeta de crédito.

No solicitar método de pago.

El usuario podrá utilizar todas las funciones Premium.

Mostrar en la aplicación un contador indicando los días restantes de la prueba.

Cuando la prueba termine, mostrar la pantalla de selección de plan.

Preparar la arquitectura para conectar posteriormente con Stripe.

Crear la pantalla de selección de planes.

PLAN BÁSICO

$2.99 USD

1 perro

PLAN FAMILIAR

$5.99 USD

Hasta 2 perros

PLAN PREMIUM

$9.99 USD

Hasta 5 perros.

Crear una pantalla elegante comparando los tres planes.

No implementar todavía Stripe.

Solo preparar la experiencia. Construye el proceso completo para crear el perfil del perro.

Debe solicitar:

Foto

Nombre

Sexo

Edad

Fecha de nacimiento

Peso

Unidad (kg/lb)

Raza

Nivel de actividad

Objetivo

Ingredientes favoritos

Ingredientes que no le gustan

Ingredientes prohibidos

Alergias

Tiempo disponible para cocinar

Tiene horno

Presupuesto semanal

Guardar toda la información correctamente.

Permitir editar posteriormente el perfil.

Permitir múltiples perros.

Todavía no limitar la cantidad de perros.

Eso dependerá posteriormente del plan contratado. Construye el Dashboard principal.

Debe mostrar:

Hola (usuario)

¿Qué prepararemos hoy para (nombre del perro)?

Crear una tarjeta principal llamada

RECETA DEL DÍA

Mostrar:

Imagen

Tiempo

Ingredientes

Beneficio general

Botones:

Ver receta

Cambiar receta

Agregar secciones:

Plan semanal

Lista de compras

Favoritos

Progreso

Chef IA

Todo debe sentirse muy limpio y moderno. Construye todo el sistema de recetas.

Crear biblioteca.

Crear categorías.

Crear buscador.

Crear filtros.

Tiempo

Ingredientes

Sin horno

Favoritas

Preparación

Categoría

Cada receta debe tener:

Imagen

Ingredientes

Cantidades

Preparación

Tiempo

Porciones

Conservación

Guardar favoritos.

Compartir.

Agregar a compras.

Preparada.

No utilizar afirmaciones médicas.

Agregar un aviso indicando que la información no reemplaza el consejo de un veterinario. Construye el sistema de compras.

Debe generar automáticamente la lista semanal.

Agrupar ingredientes.

Sumar cantidades.

Permitir marcar:

Ya lo tengo.

Crear la despensa.

El usuario podrá registrar ingredientes disponibles.

Crear un botón llamado:

Buscar recetas

Mostrar recetas compatibles con los ingredientes disponibles.

Agregar filtros:

5 minutos

10 minutos

20 minutos

Sin horno

Favoritas

Pocos ingredientes . Construye la interfaz del Chef IA.

No conectar todavía OpenAI.

Preparar la arquitectura.

El usuario escribirá:

Tengo pollo, avena y zanahoria.

La IA responderá utilizando principalmente las recetas existentes en la base de datos.

Nunca inventar información médica.

Nunca recomendar ingredientes registrados como alergias.

Nunca recomendar ingredientes prohibidos.

La interfaz debe parecer un chat moderno. Construye un panel administrativo.

Debe permitir:

Crear recetas.

Editar recetas.

Eliminar recetas.

Publicar.

Despublicar.

Subir imágenes.

Crear categorías.

Crear ingredientes.

Editar ingredientes.

Clasificar ingredientes.

Ver usuarios.

Ver perros.

Ver recetas más vistas.

Ver recetas favoritas.

Ver recetas preparadas.

Todo mediante tablas modernas y paneles administrativos. Prepara toda la arquitectura para Supabase.

Crear relaciones lógicas para:

users

dogs

recipes

recipe_ingredients

ingredients

ingredient_safety

favorites

shopping_lists

shopping_items

weekly_plans

daily_recipes

prepared_recipes

subscriptions

notifications

weight_records

achievements

ai_conversations

Diseñar una arquitectura limpia y escalable.

Preparar Row Level Security.

Preparar Storage para imágenes. Ahora preparar la aplicación para conectar los servicios externos.

Stripe:

Preparar Checkout.

Preparar Customer Portal.

Preparar Webhooks.

Preparar los planes:

Básico

$2.99

1 perro

Familiar

$5.99

Hasta 2 perros

Premium

$9.99

Hasta 5 perros

Cuando el usuario supere el límite de perros permitido por su plan, mostrar una invitación para actualizar la suscripción.

OpenAI:

Preparar toda la arquitectura para Chef IA.

No colocar claves API en el frontend.

Preparar funciones backend para conectar OpenAI.

Toda la comunicación con OpenAI debe realizarse desde el backend.

La IA debe utilizar primero la biblioteca de recetas de la aplicación antes de generar respuestas.

Preparar también el sistema para enviar la receta personalizada del día y futuras notificaciones.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://arimundo-chef-pals.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a2adfc9-d0ff-4d36-88fa-b8056bbcf823).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
