# La Serpiente 🐍

Web estática para practicar el sonido /s/ (español de España). Sin build ni dependencias.

## Probar en el ordenador
```bash
python3 -m http.server 8000
```
Abrir http://localhost:8000 (el micrófono funciona en `localhost`).

## Probar en un iPad
El iPad exige **HTTPS** para el micrófono (y `localhost` en el iPad no es tu ordenador).
Lo más sencillo, un túnel HTTPS temporal con el servidor anterior en marcha:
```bash
npx cloudflared tunnel --url http://localhost:8000
```
Abre en Safari la URL `https://….trycloudflare.com` que imprime. Alternativas: `ngrok http 8000`,
o subir la carpeta a GitHub Pages / Netlify Drop (HTTPS gratis).
Luego: Compartir → «Añadir a pantalla de inicio».

## Voces propias
Dos formas, por orden de prioridad:
1. **En la propia app** (recomendado): panel del adulto → «Grabar voces». Se guardan en el dispositivo (IndexedDB) y se usan en lugar de la voz sintética. No se borran con «Borrar progreso».
2. **Como archivos**: `audio/es/<id>.mp3` (por ejemplo `sol.mp3`, `sa.mp3`, `sss.mp3`).
Si no hay grabación, se usa la voz del dispositivo.

## Nuevo idioma
Copia `data/es.js` a `data/ca.js` o `data/fr.js`, traduce, y descomenta su `<script>` en `index.html`.
La app activa sola el botón del idioma.

## Panel del adulto
Pulsación larga (~1 s) sobre el engranaje discreto de la esquina inferior derecha de la pantalla de inicio.

## Qué incluye
- **Sesión de hoy** (~5 min): trazar la S → 5 palabras → vagones → sílabas.
- **La serpiente**: seguir con el dedo el camino de una S mientras se hace «sssss» (no usa micrófono).
- **Escucha y repite**: el adulto juzga con ✅ / 🔁. ✅ da una pegatina; 🔁 manda la palabra a «Repasar».
- **Mis pegatinas**: álbum con una pegatina por palabra dicha bien, y premios por sesión completa.
- Panel del adulto: palabras por ronda (5/8/10), voz, posiciones y palabras activas.
