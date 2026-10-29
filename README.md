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
Graba `audio/es/<id>.mp3` (por ejemplo `sol.mp3`, `sa.mp3`, `sss.mp3`); si existe, se usa en lugar de la voz sintética.

## Nuevo idioma
Copia `data/es.js` a `data/ca.js` o `data/fr.js`, traduce, y descomenta su `<script>` en `index.html`.
La app activa sola el botón del idioma.

## Panel del adulto
Pulsación larga (~1 s) sobre el engranaje discreto de la esquina inferior derecha de la pantalla de inicio.
