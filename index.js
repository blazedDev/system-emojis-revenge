"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var index_exports = {};
__export(index_exports, {
  Settings: () => Settings,
  onLoad: () => onLoad,
  onUnload: () => onUnload
});
module.exports = __toCommonJS(index_exports);
var import_common3 = require("@vendetta/metro/common");
var import_plugin2 = require("@vendetta/plugin");
var import_components = require("@vendetta/ui/components");
var import_storage = require("@vendetta/storage");

// src/stuff/controller.ts
var import_plugin = require("@vendetta/plugin");
var import_toasts = require("@vendetta/ui/toasts");
var import_assets = require("@vendetta/ui/assets");

// src/stuff/rows.ts
var import_common = require("@vendetta/metro/common");
var import_patcher = require("@vendetta/patcher");
function iterateContent(rows) {
  const out = [];
  let header;
  for (const original of rows) {
    let row = original;
    if (row?.type === "emoji") row = { type: "text", content: row.surrogate };
    if ("content" in row && Array.isArray(row.content)) row.content = iterateContent(row.content);
    if ("items" in row && Array.isArray(row.items)) row.items = iterateContent(row.items);
    if ("jumboable" in original && original.jumboable && !header) {
      header = { type: "heading", level: 1, content: [] };
    }
    if ((original.type === "emoji" || original.type === "customEmoji") && !original.jumboable && header) {
      out.push(header);
      header = void 0;
    }
    if (header) header.content.push(row);
    else out.push(row);
  }
  if (header) out.push(header);
  return out;
}
function convertMessageRows(rows) {
  for (const row of rows) {
    if (row?.type === 1 && row.message?.content) {
      row.message.content = iterateContent(row.message.content);
    }
  }
}
function getChatModule() {
  const nm = import_common.ReactNative?.NativeModules ?? {};
  return nm.DCDChatManager ?? nm.NativeChatModule ?? null;
}
function patchRows(callback) {
  const mod = getChatModule();
  if (!mod?.updateRows) return null;
  return (0, import_patcher.before)("updateRows", mod, (args) => {
    try {
      const rows = JSON.parse(args[1]);
      callback(rows);
      args[1] = JSON.stringify(rows);
    } catch (e) {
      console.error("[SystemEmojisEverywhere] rows:", e?.stack ?? e);
    }
  });
}

// src/stuff/images.ts
var import_common2 = require("@vendetta/metro/common");

// src/stuff/emoji.ts
var TEXT_DEFAULT = "[\\u00A9\\u00AE\\u203C\\u2049\\u2122\\u2139\\u2194-\\u21AA\\u24C2\\u25AA\\u25AB\\u25B6\\u25C0\\u25FB-\\u25FE\\u3030\\u303D\\u3297\\u3299]";
var CORE = `(?:[#*0-9]\\uFE0F?\\u20E3|${TEXT_DEFAULT}\\uFE0F|\\p{Extended_Pictographic})(?:\\p{Emoji_Modifier}|\\uFE0F)?`;
var SEQUENCE = `${CORE}(?:\\u200D${CORE})*`;
var FLAGS = "\\p{Regional_Indicator}\\p{Regional_Indicator}";
var EMOJI_SOURCE = `(?:${FLAGS}|${SEQUENCE})`;
var EMOJI_RE = new RegExp(EMOJI_SOURCE, "gu");
function isEmojiChar(text) {
  if (!text) return false;
  EMOJI_RE.lastIndex = 0;
  const m = EMOJI_RE.exec(text);
  return !!m && m[0] === text && m[0].length === text.length;
}
function fromCodePoints(cps) {
  try {
    return String.fromCodePoint(...cps.map((c) => Number.parseInt(c, 16)));
  } catch {
    return "";
  }
}
var HEX_TOKEN = /^[0-9a-f]{1,7}$/i;
var EMOJI_URI_HOSTS = new RegExp(
  "(?:^|//)(?:cdn\\.discordapp\\.com/emojis/|twemoji\\.maxcdn\\.com/|cdn\\.jsdelivr\\.net/(?:gh/jdecked/twemoji@[^/]+/assets/|gh/twitter/twemoji@[^/]+/assets/)|cdnjs\\.cloudflare\\.com/ajax/libs/twemoji/|abs\\.twimg\\.com/emoji/v2/)"
);
function uriToEmoji(uri) {
  if (typeof uri !== "string") return null;
  try {
    if (uri.startsWith("asset:/emoji-")) {
      const name = uri.slice("asset:/emoji-".length).replace(/\.(png|webp).*$/i, "");
      const emoji2 = fromCodePoints(name.split("-"));
      return isEmojiChar(emoji2) ? emoji2 : null;
    }
    const path = uri.split("?")[0];
    if (!EMOJI_URI_HOSTS.test(path)) return null;
    const m = path.match(/([0-9a-f]+(?:-[0-9a-f]+)*)\.(?:png|svg)$/i);
    if (!m) return null;
    const cps = m[1].toLowerCase().split("-");
    if (!cps.every((t) => HEX_TOKEN.test(t))) return null;
    const emoji = fromCodePoints(cps);
    return isEmojiChar(emoji) ? emoji : null;
  } catch {
    return null;
  }
}

// src/stuff/images.ts
function installImagePatch() {
  const OrigImage = import_common2.ReactNative.Image;
  const OrigText = import_common2.ReactNative.Text;
  const wrapper = function EmojiAwareImage(props) {
    const emoji = uriToEmoji(props?.source?.uri);
    if (emoji) {
      return import_common2.React.createElement(
        OrigText ?? "View",
        props?.style ? { style: props.style, children: emoji } : { children: emoji }
      );
    }
    return import_common2.React.createElement(OrigImage, props);
  };
  try {
    for (const key of Object.keys(OrigImage ?? {})) {
      try {
        Object.defineProperty(wrapper, key, Object.getOwnPropertyDescriptor(OrigImage, key));
      } catch {
      }
    }
    import_common2.ReactNative.Image = wrapper;
  } catch (e) {
    console.error("[SystemEmojisEverywhere] no se pudo parchear RN.Image:", e?.message);
    return () => {
    };
  }
  return () => {
    try {
      import_common2.ReactNative.Image = OrigImage;
    } catch {
    }
  };
}

// src/stuff/controller.ts
var vstorage = import_plugin.storage;
var unwinds = [];
function unwindAll() {
  let u;
  while (u = unwinds.pop()) {
    try {
      u();
    } catch {
    }
  }
}
function applyAll() {
  unwindAll();
  if (vstorage.patchMessages !== false) {
    const rowsPatch = patchRows(convertMessageRows);
    if (rowsPatch) unwinds.push(rowsPatch);
    else {
      console.warn("[SystemEmojisEverywhere] No se encontr\xF3 el m\xF3dulo nativo del chat");
      (0, import_toasts.showToast)(
        "System Emojis: m\xF3dulo del chat no encontrado",
        (0, import_assets.getAssetIDByName)("CircleXIcon-primary")
      );
    }
  }
  if (vstorage.patchImages === true) {
    unwinds.push(installImagePatch());
  }
}

// src/index.tsx
var { FormSection, FormSwitchRow, FormDivider, FormText } = import_components.Forms;
function onLoad() {
  if (typeof vstorage.patchMessages !== "boolean") vstorage.patchMessages = true;
  if (typeof vstorage.patchImages !== "boolean") vstorage.patchImages = true;
  applyAll();
}
var onUnload = () => unwindAll();
function toggle(key) {
  vstorage[key] = !vstorage[key];
  applyAll();
}
function SettingsPanel() {
  (0, import_storage.useProxy)(import_plugin2.storage);
  return /* @__PURE__ */ import_common3.React.createElement(import_common3.React.Fragment, null, /* @__PURE__ */ import_common3.React.createElement(FormSection, { title: "Reemplazo" }, /* @__PURE__ */ import_common3.React.createElement(
    FormSwitchRow,
    {
      title: "Mensajes y respuestas",
      subTitle: "M\xE9todo estable: convierte los Twemoji a emojis del sistema en el chat",
      value: vstorage.patchMessages,
      onPress: () => toggle("patchMessages")
    }
  ), /* @__PURE__ */ import_common3.React.createElement(FormDivider, null), /* @__PURE__ */ import_common3.React.createElement(
    FormSwitchRow,
    {
      title: "Embeds, reacciones y m\xE1s (experimental)",
      subTitle: "Intercepta todas las im\xE1genes de emoji. Puede fallar seg\xFAn la versi\xF3n de Discord",
      value: vstorage.patchImages,
      onPress: () => toggle("patchImages")
    }
  ), /* @__PURE__ */ import_common3.React.createElement(FormDivider, null), /* @__PURE__ */ import_common3.React.createElement(FormText, null, "Los emojis personalizados de servidores no se modifican. Si algo queda raro, desactiv\xE1 y activ\xE1 el plugin o reinici\xE1 la app.")));
}
var Settings = SettingsPanel;
