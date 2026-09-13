# Windows 98 Web 🪟

Una recreación de un escritorio estilo Windows 98, hecha con **HTML, CSS y TypeScript** puro (sin frameworks ni dependencias en tiempo de ejecución).

## ¿Qué incluye?

- Escritorio con iconos (Mi PC, Papelera de reciclaje, Bloc de notas, Paint, Acerca de)
- Barra de tareas con botón **Inicio**, menú Inicio, botones de ventanas abiertas y reloj
- Ventanas arrastrables, redimensionables, minimizables y maximizables, con capa de foco (z-index)
- Aplicaciones funcionales:
  - **Bloc de notas**: editor de texto simple
  - **Paint**: lienzo con colores, grosor de pincel y botón de borrar
  - **Mi PC**: vista de "unidades" (decorativa)
  - **Papelera de reciclaje**
  - **Buscaminas**: totalmente jugable (clic izquierdo para revelar, clic derecho para marcar bandera)
  - **Acerca de este equipo**
- Pantalla de "Apagar el sistema"

## Cómo usarlo

### Opción rápida (ya compilado)
El archivo `dist/main.js` ya viene compilado. Solo abre `index.html` en tu navegador (doble clic, o arrástralo a una pestaña).

> Nota: algunos navegadores restringen ciertas cosas al abrir archivos con `file://`. Si ves algún comportamiento raro, usa un servidor local (ver abajo).

### Servidor local (recomendado)
```bash
# Con Python
python3 -m http.server 8000

# o con Node (npx)
npx serve .
```
Luego abre `http://localhost:8000` en tu navegador.

### Modificar el código TypeScript
El código fuente está en `src/main.ts`. Si lo editas, necesitas recompilar:

```bash
npm install
npm run build       # compila una vez
npm run watch        # recompila automáticamente al guardar
```

Esto regenera `dist/main.js`, que es el archivo que carga `index.html`.

## Estructura del proyecto

```
win98/
├── index.html          # Estructura del escritorio, taskbar y menú inicio
├── style.css            # Toda la estética "Windows 98" (bordes biselados, colores, etc.)
├── src/
│   └── main.ts           # Lógica: ventanas, apps, menú inicio, reloj, buscaminas...
├── dist/
│   └── main.js            # JavaScript compilado (generado por tsc)
├── tsconfig.json
├── package.json
└── README.md
```

## Ideas para extender

- Agregar más "programas" (Calculadora, Solitario, Internet Explorer falso)
- Persistir el contenido del Bloc de notas con `localStorage`
- Sonidos de inicio/clic estilo Windows 98
- Fondo de escritorio configurable, menú contextual del escritorio
- Ventanas de diálogo personalizadas (reemplazar los `alert()` nativos)

¡Diviértete recreando la nostalgia! 💾
