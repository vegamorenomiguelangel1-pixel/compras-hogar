# Yapa — compras del hogar

Sitio en vivo: https://vegamorenomiguelangel1-pixel.github.io/compras-hogar/

Prototipo de **App de Gestión Inteligente de Compras para Hogares**, pensado como caso de estudio universitario en Bolivia.

Yapa ayuda a una familia a cuidar la despensa, armar la lista, comparar precios en bolivianos y botar menos comida. El nombre viene de la *yapa*: esa porción extra que dan en el mercado. La familia de ejemplo es la familia Rojas, de Cochabamba. Los precios están en **Bs** y los locales de la muestra son **Hipermaxi**, **Fidalga**, **IC Norte** y el **mercado local**.

El referente de clase es Minimkt (minimarket chileno con stock, alertas, analítica, pedidos recurrentes y asistente). Yapa adapta esas ideas a la cocina de una casa. No es una app comercial: no hay servidor, no hay cuentas y los precios no se consultan en vivo.

## Funciones

1. **Inicio.** Resumen de alertas, presupuesto del mes y ahorro por comida que no se botó.
2. **Despensa.** Cantidad, categoría y vencimiento. El estado se pinta como vencido, por vencer o bien, y avisa si el stock está bajo.
3. **Lista de compras.** Sugiere lo que está bajo o por vencer, deja anotar pedidos de la familia, marcar lo del carrito y ver el total estimado.
4. **Comparador.** El mismo producto en cuatro locales, con el más barato y cuánto se ahorra.
5. **Presupuesto.** Tope mensual, registro de compras y gasto por categoría.
6. **Anti-desperdicio.** Recetas de un recetario local para lo que está por vencer, y un contador de Bs y kg estimados. Lo ya vencido no se cocina.
7. **Asistente.** Chat con respuestas por reglas (preguntas frecuentes, precios y tips). No usa claves ni APIs externas.
8. **Acerca del proyecto.** Explica el prototipo y deja un lugar para los nombres del grupo.

Todo se guarda en `localStorage` de este navegador. Se puede instalar como PWA (manifest y service worker) y, después de la primera visita, abre sin conexión.

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

Para volver a los datos de la familia Rojas: **Más → Restablecer datos de ejemplo**.

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
- `js/store.js` — `localStorage`
- `js/app.js` — pantallas
- `manifest.webmanifest`, `sw.js`, `icons/`, `fonts/` — PWA y tipografía Outfit (OFL)

## Nota

Los precios y la despensa son de muestra para el caso. No representan una cotización actual de las tiendas.
