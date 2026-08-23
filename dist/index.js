(() => {
"use strict";
try {
var __vd_plugin = (() => {
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
    VERSION: () => VERSION,
    getSettings: () => getSettings,
    onLoad: () => onLoad,
    onUnload: () => onUnload,
    settings: () => settings
  });

  // src/stuff/env.ts
  var VD;
  try {
    VD = vendetta;
  } catch {
    VD = void 0;
  }
  var BUNNY;
  try {
    BUNNY = bunny;
  } catch {
    BUNNY = void 0;
  }
  function getVd() {
    if (VD) return VD;
    try {
      return globalThis.vendetta;
    } catch {
      return void 0;
    }
  }
  function getBunny() {
    if (BUNNY) return BUNNY;
    try {
      return globalThis.bunny;
    } catch {
      return void 0;
    }
  }
  function getRN() {
    const cands = [
      () => getVd()?.["metro.common"]?.ReactNative,
      () => getBunny()?.metro?.common?.ReactNative,
      () => getBunny()?.ReactNative,
      () => globalThis.ReactNative
    ];
    for (const c of cands) {
      try {
        const rn = c();
        if (rn) return rn;
      } catch {
      }
    }
    return void 0;
  }
  function getReact() {
    const cands = [
      () => getVd()?.["metro.common"]?.React,
      () => getBunny()?.metro?.common?.React,
      () => getBunny()?.React,
      () => globalThis.React
    ];
    for (const c of cands) {
      try {
        const r = c();
        if (r) return r;
      } catch {
      }
    }
    return void 0;
  }
  function getPatcher() {
    const cands = [
      () => getVd()?.patcher,
      () => getBunny()?.api?.patcher
    ];
    for (const c of cands) {
      try {
        const p = c();
        if (p?.before) return p;
      } catch {
      }
    }
    return void 0;
  }
  function getToasts() {
    const cands = [
      () => getVd()?.["ui.toasts"]?.showToast,
      () => getBunny()?.ui?.toasts?.showToast
    ];
    for (const c of cands) {
      try {
        const st = c();
        if (typeof st === "function") return (m) => st(m);
      } catch {
      }
    }
    return null;
  }
  var storageFallback = null;
  function getStorage() {
    try {
      const s = getVd()?.plugin?.storage;
      if (s && typeof s === "object") return s;
    } catch {
    }
    if (!storageFallback) storageFallback = {};
    return storageFallback;
  }
  function reportError(scope, e) {
    let text = "";
    try {
      text = String(e?.stack || e).slice(0, 400);
    } catch {
      text = String(e);
    }
    try {
      console.error("[SystemEmojisEverywhere]", scope, text);
    } catch {
    }
    try {
      const Alert = getRN()?.Alert;
      if (Alert?.alert) {
        Alert.alert("System Emojis ERROR", scope + "\n\n" + text);
        return;
      }
    } catch {
    }
    try {
      const t = getToasts();
      if (t) t(scope + ": " + text);
    } catch {
    }
  }
  function toast(m) {
    try {
      console.log("[SystemEmojisEverywhere]", m);
    } catch {
    }
    try {
      const t = getToasts();
      if (t) t(m);
    } catch {
    }
  }

  // src/stuff/rows.ts
  function iterateContent(rows) {
    const out = [];
    let header;
    let converted = 0;
    for (const original of rows) {
      let row = original;
      if (row?.type === "emoji") {
        row = { type: "text", content: row.surrogate };
        converted++;
      }
      if ("content" in row && Array.isArray(row.content)) {
        const [c, n] = iterateContent(row.content);
        row.content = c;
        converted += n;
      }
      if ("items" in row && Array.isArray(row.items)) {
        const [it, n] = iterateContent(row.items);
        row.items = it;
        converted += n;
      }
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
    return [out, converted];
  }
  function convertMessageRows(rows) {
    let converted = 0;
    for (const row of rows) {
      if (row?.type === 1 && row.message?.content) {
        const [content, n] = iterateContent(row.message.content);
        row.message.content = content;
        converted += n;
      }
    }
    return converted;
  }
  function getNativeModule(...names) {
    for (const name of names) {
      const turbo = globalThis.__turboModuleProxy;
      if (typeof turbo === "function") {
        try {
          const m = turbo(name);
          if (m) return m;
        } catch {
        }
      }
      const nmp = globalThis.nativeModuleProxy;
      if (nmp?.[name]) return nmp[name];
    }
    return void 0;
  }
  function getChatModule() {
    return getNativeModule("NativeChatModule", "DCDChatManager");
  }
  function patchRows(callback) {
    const mod = getChatModule();
    if (!mod?.updateRows) return null;
    const patcher = getPatcher();
    if (!patcher?.before || typeof patcher.before !== "function") return null;
    return patcher.before("updateRows", mod, (args) => {
      try {
        const rows = JSON.parse(args[1]);
        callback(rows);
        args[1] = JSON.stringify(rows);
      } catch (e) {
        console.error("[SystemEmojisEverywhere] rows:", e?.stack ?? e);
      }
    });
  }

  // node_modules/emoji-regex/index.mjs
  var emoji_regex_default = () => {
    return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
  };

  // src/stuff/emoji.ts
  var cached = null;
  var fallbackMode = false;
  function buildRegex() {
    try {
      const r = emoji_regex_default();
      if (r) {
        r.exec("\u{1F600}");
        return r;
      }
    } catch {
    }
    fallbackMode = true;
    return new RegExp(
      "(?:[\\uD83C\\uDDE6-\\uD83C\\uDDFF]{2}|[\\uD83C-\\uD83E][\\uDC00-\\uDFFF](?:[\\uFE0F]|\\uD83C[\\uDFFB-\\uDFFF]|\\u200D[\\uD83C-\\uD83E][\\uDC00-\\uDFFF])*|[#*0-9]\\u20E3|[\\u00A9\\u00AE\\u203C\\u2049\\u2122\\u2139\\u2194-\\u21AA\\u231A-\\u231B\\u2328\\u23CF\\u23E9-\\u23FA\\u24C2\\u25AA\\u25AB\\u25B6\\u25C0\\u25FB-\\u25FE\\u2600-\\u27BF\\u2934\\u2935\\u2B00-\\u2B55\\u3030\\u303D\\u3297\\u3299]\\uFE0F?)",
      "g"
    );
  }
  function getEmojiRe() {
    if (!cached) cached = buildRegex();
    cached.lastIndex = 0;
    return cached;
  }
  function isEmojiChar(text) {
    if (!text) return false;
    const re = getEmojiRe();
    const m = re.exec(text);
    return !!m && m[0] === text && m.index === 0;
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
  function installImagePatch(onHit) {
    const RN = getRN();
    const React = getReact();
    const OrigImage = RN?.Image;
    const OrigText = RN?.Text;
    if (!RN || !React || !OrigImage) {
      return {
        unwind: () => {
        },
        ok: false,
        msg: "faltan: " + [RN ? "" : "RN", OrigImage ? "" : "Image", React ? "" : "React"].filter(Boolean).join(", ")
      };
    }
    const wrapper = function EmojiAwareImage(props) {
      const emoji = uriToEmoji(props?.source?.uri);
      if (emoji) {
        try {
          onHit?.();
        } catch {
        }
        return React.createElement(
          OrigText ?? "View",
          props?.style ? { style: props.style, children: emoji } : { children: emoji }
        );
      }
      return React.createElement(OrigImage, props);
    };
    let installed = false;
    try {
      RN.Image = wrapper;
      installed = RN.Image === wrapper;
    } catch {
    }
    if (!installed) {
      try {
        Object.defineProperty(RN, "Image", {
          value: wrapper,
          writable: true,
          configurable: true
        });
        installed = RN.Image === wrapper;
      } catch {
      }
    }
    if (!installed) {
      return {
        unwind: () => {
        },
        ok: false,
        msg: "RN.Image es de solo lectura en tu build"
      };
    }
    return {
      unwind: () => {
        try {
          RN.Image = OrigImage;
        } catch {
          try {
            Object.defineProperty(RN, "Image", {
              value: OrigImage,
              writable: true,
              configurable: true
            });
          } catch {
          }
        }
      },
      ok: true
    };
  }

  // src/stuff/controller.ts
  var vstorage = getStorage();
  function getPatchMessages() {
    try {
      return vstorage.patchMessages !== false;
    } catch {
      return true;
    }
  }
  function getPatchImages() {
    try {
      return vstorage.patchImages === true;
    } catch {
      return false;
    }
  }
  function setFlag(key, v) {
    try {
      vstorage[key] = v;
    } catch {
    }
  }
  var state = {
    chat: false,
    images: false,
    err: ""
  };
  var counters = { rows: 0, emoji: 0, imgs: 0 };
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
  function resetDebug() {
    counters.rows = 0;
    counters.emoji = 0;
    counters.imgs = 0;
  }
  function applyAll() {
    unwindAll();
    state.chat = false;
    state.images = false;
    resetDebug();
    if (getPatchMessages()) {
      const mod = getChatModule();
      if (!mod || typeof mod.updateRows !== "function") {
        console.warn("[SystemEmojisEverywhere] m\xF3dulo del chat no encontrado");
      } else {
        const rowsPatch = patchRows((rows) => {
          counters.rows++;
          counters.emoji += convertMessageRows(rows);
        });
        if (rowsPatch) {
          unwinds.push(rowsPatch);
          state.chat = true;
        }
      }
    }
    if (getPatchImages()) {
      const img = installImagePatch(() => {
        counters.imgs++;
      });
      unwinds.push(img.unwind);
      state.images = img.ok;
      state.err = img.ok ? "" : `im\xE1genes: ${img.msg ?? "no disponible"}`;
    }
  }

  // src/index.tsx
  var VERSION = "v12";
  var SettingsPanel = () => null;
  function getSettingsPanel() {
    if (!settingsCache) settingsCache = buildSettings();
    return settingsCache;
  }
  var settingsCache = null;
  function buildSettings() {
    try {
      const RN = getRN();
      const React = getReact();
      if (!RN || !React) {
        reportError("ajustes", "ReactNative/React no disponibles");
        return () => null;
      }
      const { View, Text, Switch, ScrollView, StyleSheet } = RN;
      const styles = StyleSheet.create({
        page: { flex: 1 },
        body: { padding: 12, gap: 14 },
        row: { flexDirection: "row", alignItems: "center", gap: 8 },
        title: { fontSize: 15, fontWeight: "700" },
        sub: { fontSize: 13, opacity: 0.7 },
        mono: { fontFamily: "monospace", fontSize: 11, opacity: 0.8 },
        err: { color: "#ff5252", fontSize: 12 }
      });
      const Toggle = (props) => React.createElement(
        View,
        { style: styles.row },
        React.createElement(Text, { style: { flex: 1 } }, props.label),
        React.createElement(Switch, {
          value: !!props.value,
          onValueChange: props.onChange
        })
      );
      return function Settings() {
        const [, force] = React.useState(0);
        const rerender = () => force((n) => n + 1);
        return React.createElement(
          ScrollView,
          { style: styles.page, contentContainerStyle: styles.body },
          React.createElement(
            Text,
            { style: styles.title },
            "System Emojis Everywhere ",
            VERSION
          ),
          React.createElement(
            Text,
            { style: styles.sub },
            "Reemplaza Twemoji por los emojis de tu sistema."
          ),
          React.createElement(Toggle, {
            label: "Mensajes (filas del chat)",
            value: getPatchMessages(),
            onChange: (v) => {
              setFlag("patchMessages", v);
              try {
                applyAll();
              } catch {
              }
              rerender();
            }
          }),
          React.createElement(Toggle, {
            label: "Im\xE1genes (avatares/reacciones)",
            value: getPatchImages(),
            onChange: (v) => {
              setFlag("patchImages", v);
              try {
                applyAll();
              } catch {
              }
              rerender();
            }
          }),
          React.createElement(
            Text,
            { style: styles.mono },
            `chat conectado: ${state.chat ? "s\xED" : "no"}
im\xE1genes parcheadas: ${state.images ? "s\xED" : "no"}
updateRows llamado: ${counters.rows}
emojis convertidos: ${counters.emoji}
im\xE1genes reemplazadas: ${counters.imgs}`
          ),
          state.err ? React.createElement(Text, { style: styles.err }, String(state.err)) : null,
          React.createElement(
            Text,
            { style: styles.sub, onPress: () => {
              resetDebug();
              rerender();
            } },
            "Toc\xE1 aqu\xED para reiniciar el diagn\xF3stico."
          )
        );
      };
    } catch (e) {
      reportError("construir ajustes", e);
      return () => null;
    }
  }
  function onLoad() {
    try {
      applyAll();
      state.err = "";
      toast(`System Emojis ${VERSION}: activo \u2705`);
    } catch (e) {
      try {
        state.err = String(e?.stack || e).slice(0, 300);
      } catch {
      }
      reportError("onLoad", e);
    }
  }
  function onUnload() {
    try {
      unwindAll();
    } catch (e) {
      reportError("onUnload", e);
    }
  }
  function getSettings() {
    if (!SettingsPanel) SettingsPanel = buildSettings();
    return SettingsPanel;
  }
  function settings(props) {
    const React = getReact();
    const C = getSettingsPanel();
    return React?.createElement ? React.createElement(C, props) : C(props);
  }
  try {
    const instance = {
      start: onLoad,
      stop: onUnload,
      manifest: { name: "System Emojis Everywhere", version: VERSION }
    };
    Object.defineProperty(instance, "SettingsComponent", {
      configurable: true,
      get: () => getSettingsPanel()
    });
    globalThis.plugin = instance;
  } catch {
  }
  return __toCommonJS(index_exports);
})();
return __vd_plugin;

} catch (e) {
  try {
    vendetta["ui.toasts"].showToast("System Emojis ERROR eval: " + String((e && e.stack) || e).slice(0, 150));
  } catch (_e) {}
  throw e;
}
})();