# Yapa — compras del hogar

Sitio en vivo: https://vegamorenomiguelangel1-pixel.github.io/compras-hogar/

Prototipo de **App de Gestión Inteligente de Compras para Hogares**, pensado como caso de estudio universitario en Bolivia.

Yapa ayuda a una familia a cuidar la despensa, armar la lista, comparar precios en bolivianos y botar menos comida. El nombre viene de la *yapa*: esa porción extra que dan en el mercado. La familia de ejemplo es la familia Rojas, del barrio Los Pozos, en Santa Cruz de la Sierra. Los precios están en **Bs**. Los locales de la muestra son **Hipermaxi**, **Fidalga**, **IC Norte**, **Mercado Los Pozos**, **Mercado Mutualista** y **Abasto**.

El referente de clase es Minimkt (minimarket chileno con stock, alertas, analítica, pedidos recurrentes y asistente). Yapa adapta esas ideas a la cocina de una casa cruceña. No es una app comercial: no hay servidor, no hay cuentas y los precios no se consultan en vivo.

Al abrir, Yapa pide el nombre y un código de familia (el de ejemplo es `ROJAS-2026`) o deja crear una familia y genera el código. Quien entra con el mismo código, en este celular o en otro, ve la misma despensa, la misma lista y el mismo presupuesto. La sincronización usa Firebase (plan Spark): sesión anónima y un documento por familia en Firestore. Si no hay red, queda la copia de `localStorage` y el indicador pasa a **Sin conexión**.

## Funciones

1. **Inicio.** Resumen de alertas, presupuesto del mes y ahorro por comida que no se botó.
2. **Despensa.** Cantidad, categoría y vencimiento. El estado se pinta como vencido, por vencer o bien, y avisa si el stock está bajo.
3. **Lista de compras.** Sugiere lo que está bajo o por vencer, deja anotar pedidos de la familia, marcar lo del carrito y ver el total estimado.
4. **Comparador.** El mismo producto en seis locales, con el más barato y cuánto se ahorra.
5. **Presupuesto.** Tope mensual, registro de compras y gasto por categoría.
6. **Anti-desperdicio.** Recetas de un recetario local para lo que está por vencer, y un contador de Bs y kg estimados. Lo ya vencido no se cocina.
7. **Asistente.** Chat con respuestas por reglas (preguntas frecuentes, precios y tips). No usa claves ni APIs externas.
8. **Acerca del proyecto.** Explica el prototipo y deja un lugar para los nombres del grupo.

Cada familia vive en Firestore, en `familias/{codigo}`, y también en `localStorage` de este navegador. Se puede instalar como PWA (manifest y service worker) y, después de la primera visita, abre sin conexión.

## Cómo ejecutarlo

Hace falta un servidor local. Abrir el archivo `index.html` directo (`file://`) no registra el service worker.

```bash
python3 -m http.server 8080
```

Entra a [http://localhost:8080](http://localhost:8080).

En otra máquina, con Node:

```bash
npx serve .
```

Pruebas de la lógica (fechas, despensa, presupuesto, recetas y asistente):

```bash
node --test test/logic.test.js
```

Para volver a los datos de ejemplo de la familia en curso: **Más → Restablecer datos de ejemplo**. Para salir: **Cerrar sesión**.

## Firebase

El proyecto `yapa-compras` usa Authentication anónima y Firestore. El modo de prueba de Firestore dura unos **30 días** y después deja de aceptar lecturas y escrituras abiertas.

Cuando venza, publica las reglas del archivo `firestore.rules`:

1. Abre la [consola de Firebase](https://console.firebase.google.com/) del proyecto `yapa-compras`.
2. Entra a **Firestore Database → Reglas**.
3. Pega el contenido de `firestore.rules`.
4. Pulsa **Publicar**.

Esas reglas dejan leer y escribir `familias/{codigo}` solo a quien ya inició sesión (la sesión anónima de la app cuenta). Sin sesión, no. El código de la familia es lo que comparten los celulares. El service worker no intercepta las llamadas a `googleapis.com` ni a `gstatic.com`.

## GitHub Pages

La publicación usa GitHub Actions (no Jekyll). El workflow está en `.github/workflows/deploy.yml` y despliega con `actions/deploy-pages`. Las rutas son relativas, así el sitio funciona en:

`https://vegamorenomiguelangel1-pixel.github.io/compras-hogar/`

Pasos:

1. Sube la rama `main` (el workflow se dispara al hacer push a `main`).
2. En el repositorio abre **Settings → Pages**.
3. En **Build and deployment**, elige **Source: GitHub Actions**.
4. Espera a que el workflow **Deploy to GitHub Pages** termine en la pestaña Actions.
5. La URL queda en el entorno `github-pages` de ese workflow.

La primera vez, GitHub puede pedir permiso para crear el entorno `github-pages`. Hay que aceptarlo.

## Estructura

- `index.html` — aplicación
- `css/styles.css` — interfaz mobile-first
- `js/logic.js` — reglas (vencimiento, precios, recetas, asistente)
- `js/data.js` — catálogo, recetas y datos de ejemplo
- `js/store.js` — `localStorage` y sincronización con Firestore
- `js/cloud.js` — Firebase (CDN, módulos) 
- `js/i18n.js` — textos de la interfaz (castellano, aymara, quechua y guaraní)
- `js/app.js` — pantallas
- `firestore.rules` — reglas para pegar en la consola cuando venza el modo de prueba
- `manifest.webmanifest`, `sw.js`, `icons/`, `fonts/` — PWA y tipografía Outfit (OFL)

## Idiomas

La interfaz está en castellano (el idioma de entrada), aymara, quechua sureño boliviano y guaraní boliviano. El selector está en el ingreso, en Más y en Acerca, y la elección queda en `localStorage` de este navegador (`yapa-lang`). No forma parte de los datos de la familia ni se sincroniza con Firebase.

El aymara, el quechua y el guaraní cubren la interfaz (ingresos, secciones, botones, avisos, fechas y listas). Es una primera versión y conviene que la revise una persona hablante. Donde no había una palabra segura se usó un préstamo habitual. El nombre Yapa no se traduce. El idioma elegido no se sincroniza con Firebase.

## Nota

Los precios y la despensa son de muestra para el caso. No representan una cotización actual de las tiendas.
