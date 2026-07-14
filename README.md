# BlackMamba Music

Reproductor y biblioteca privada de BlackMamba Records. Funciona como WebUI local en `/` y como aplicación de escritorio para macOS. Los audios canónicos pueden permanecer en la USB; el DMG no incorpora MP3 ni WAV.

## Estado actual

- Biblioteca unificada USB + fichas recuperables desde Suno o SoundCloud.
- Reproducción local con `play`, pausa, stop, anterior, siguiente, ±10 segundos, volumen, timeline y shuffle.
- Canción activa centrada y siempre visible.
- Búsqueda por título, artista, archivo, URL, hashtags, letra y metadatos; ignora acentos y mayúsculas.
- Calificación de 1 a 5 estrellas durante la reproducción y ordenamiento por estrellas.
- Historial local de las últimas 100 reproducciones.
- Descarga independiente del archivo local de cada canción; recuperación guiada desde Suno o SoundCloud cuando todavía no está materializada.
- Vistas Combined, Grid, Console y Focus.
- Estudio visual por canción reutilizado de EscrituraSound: cuatro presets, siete canales de color y ritmo de animación persistente.
- Portada cuadrada 1:1 y panorámica 16:9 por canción.
- Editor de letra, género, estilo y metadatos editoriales de SoundCloud.
- Identidad fija: artista `Iyari Gomez`, autor `Iyari Cancino Gomez`, sello `BlackMamba RECORDS`.
- Revisión de pertenencia: aprobada, rechazada o para después.
- Aplicación Electron arm64 y DMG privado sin archivos de audio.
- Consulta remota de actualizaciones mediante manifiesto; no instala actualizaciones todavía.

Este repositorio contiene exclusivamente el reproductor. El juego de lectura rítmica vive en [Blackmvmba88/OidoPerfecto](https://github.com/Blackmvmba88/OidoPerfecto).

## Inicio rápido

Requisitos:

- Node.js 22 o posterior.
- npm 10 o posterior.
- `ffprobe` para importar y analizar medios.
- USB montada en `/Volumes/ADATA SC740` para usar la biblioteca canónica completa.
- `fpcalc` sólo para deduplicación acústica.

```bash
npm ci
npm run doctor
npm run dev
```

Abre `http://127.0.0.1:5173/`.

Aplicación de escritorio:

```bash
npm run desktop:dev
```

DMG privado:

```bash
npm run desktop:dmg:private
```

El artefacto queda en `release/BlackMamba-Music-0.2.0-arm64.dmg`.

## Operación

| Comando                       | Efecto                                           |
| ----------------------------- | ------------------------------------------------ |
| `npm run dev`                 | Inicia Vite con recarga automática               |
| `npm run build`               | Valida TypeScript y genera `dist/`               |
| `npm run desktop:dev`         | Compila y abre Electron                          |
| `npm run desktop:dmg:private` | Construye app y DMG sin MP3/WAV                  |
| `npm run doctor`              | Comprueba Node, dependencias, scripts y entradas |
| `npm run lint`                | Ejecuta ESLint                                   |
| `npm run typecheck`           | Valida TypeScript                                |
| `npm test -- --run`           | Ejecuta las pruebas una vez                      |
| `npm run check`               | Lint, tipos, cobertura y build                   |
| `npm run clean`               | Borra únicamente artefactos generados            |

Los comandos de biblioteca USB se documentan en [METACOMMANDS.md](./METACOMMANDS.md). Algunos eliminan archivos después de verificar hashes; deben ejecutarse deliberadamente.

Para preparar la recuperación desde Suno:

```bash
npm run library:audit-sources
npm run library:prepare-suno
```

La segunda orden coteja por título y duración y genera `suno-recovery-queue.json`
con letra (cuando Suno la expone), portada, estilo, versión y evidencia. La URL
de audio pública se conserva sólo como previsualización MP3; el WAV permanece
marcado como descarga autenticada pendiente.

## Biblioteca canónica

Ruta predeterminada:

```text
/Volumes/ADATA SC740/01_MEDIA_AUDIO/BLACKMAMBA_PLAYER
├── library.json
├── 00_COVER_INBOX/
└── <titulo>--<hash>/
    ├── audio.mp3
    ├── cover.jpg
    ├── lyrics.txt
    └── metadata.json
```

Cada canción se identifica por SHA-256. El servidor Electron detecta la USB, lee `library.json` y sirve audio con soporte HTTP Range. Cuando la USB no está conectada, la aplicación conserva la interfaz y las fichas. Una canción sin archivo local ni stream aún no puede reproducirse, pero se muestra como recuperable: primero WAV desde Suno y después SoundCloud.

## Persistencia local

La WebUI usa `localStorage`:

| Clave                         | Contenido                        |
| ----------------------------- | -------------------------------- |
| `blackmamba-vitrine-reviews`  | Decisiones de pertenencia        |
| `blackmamba-vitrine-ratings`  | Calificaciones de estrellas      |
| `blackmamba-track-metadata`   | Ediciones de fichas de canciones |
| `blackmamba-playback-history` | Últimas 100 reproducciones       |

Estas preferencias todavía no se sincronizan entre dispositivos ni se escriben automáticamente en la USB.

## Arquitectura

```text
USB / SoundCloud / Suno
        ↓
Confidence + Evidence + Warnings + Fallback
        ↓
Fingerprint y deduplicación SHA-256 / Chromaprint
        ↓
Catálogo e ingestión
        ↓
Servidor local Electron
        ↓
React WebUI / aplicación macOS
```

```text
src/app/                 Reproductor y biblioteca
src/api/                 Contrato de carga del catálogo
electron/media-server.cjs Catálogo, streaming y archivos USB
electron/main.cjs        Ventana, transporte y actualizaciones
scripts/                 Ingesta, auditoría, dedupe y releases
public/player/           Snapshot web del catálogo
```

Toda operación de ingestión debe exponer confianza, evidencia, advertencias y razón de fallback. En movimientos destructivos se verifica primero la copia canónica y el hash de origen.

## Desarrollo seguro

- No editar manualmente `dist/`, `release/`, `coverage/` ni `node_modules/`.
- No borrar audios originales hasta verificar la copia canónica por SHA-256.
- No aplicar deduplicación únicamente por nombre; usar huella acústica.
- No incrustar MP3 o WAV en builds públicos o DMG privados.
- Vite no copia `public/player/*.mp3` ni `public/music/*.mp3`; el build incluye únicamente catálogos y recursos visuales.
- No asumir que un registro remoto equivale a audio disponible.
- Mantener fijos artista, autor y sello salvo una directiva explícita del propietario.
- Ejecutar `npm run typecheck`, `npm test -- --run` y `npm run build` antes de entregar.

## Documentación

- [ROADMAP.md](./ROADMAP.md): fases terminadas y pendientes.
- [METACOMMANDS.md](./METACOMMANDS.md): órdenes cortas para operar el proyecto.
