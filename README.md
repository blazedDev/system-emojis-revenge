# System Emojis Everywhere (Revenge)

Plugin para [Revenge](https://github.com/revenge-mod/revenge-bundle) que reemplaza los Twemoji de Discord por los **emojis del sistema** en todo lo posible: mensajes, respuestas, citas, embeds, reacciones y más. Sin puntos ciegos.

## Cómo funciona

Dos capas de reemplazo:

1. **Mensajes y respuestas (estable)** — intercepta `updateRows` del módulo nativo del chat (`DCDChatManager` / `NativeChatModule`) y convierte las filas de emoji de Twemoji en texto, así se renderizan con la fuente de emojis de tu sistema. Técnica basada en el descubrimiento de [nexpid](https://github.com/nexpid) (`use-system-emoji`).
2. **Embeds, reacciones y demás (experimental)** — envuelve el componente `Image` de React Native: si una imagen apunta a un emoji de sistema (asset embebido `asset:/emoji-*`, o URL de Twemoji/CDN), la sustituye por el carácter unicode correspondiente renderizado como texto.

Los emojis personalizados de servidores **no** se tocan.

## Instalación

### Opción A: GitHub Pages

1. Pusheá este repo (la rama `gh-pages` ya contiene el build, generada con `build.sh && git subtree split --prefix=dist -b tmp && git push origin tmp:gh-pages`).
2. En GitHub → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `gh-pages` / root → **Save**.
3. En Revenge → Plugins → ➕ pegá:
   ```
   https://TU_USUARIO.github.io/system-emojis-revenge/
   ```

### Opción B: URL directa (raw)

Sin esperar Pages:
```
https://raw.githubusercontent.com/TU_USUARIO/system-emojis-revenge/main/dist
```

### Opción C: servidor local

```bash
npm install && npm run build
npx http-server dist --port 8080
```
y en Revenge pegá `http://IP-DE-TU-PC:8080`.

## Configuración

En los ajustes del plugin podés activar/desactivar cada capa. Los cambios aplican al instante; si algo queda inconsistente, reiniciá la app.

## Limitaciones conocidas

- La capa experimental depende de que los componentes resuelvan `RN.Image` tarde; en versiones nuevas de Discord algunos superficies pueden escaparse.
- Secuencias de emoji muy exóticas podrían no detectarse.

## Licencia

MIT. Las técnicas de parcheo están inspiradas en plugins de la comunidad Vendetta/Bunny/Revenge (créditos a nexpid y contributors).
