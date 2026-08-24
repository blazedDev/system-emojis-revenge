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
  function reportError(scope, e) {
    let text = "";
    try {
      text = String(e?.stack || e).slice(0, 400);
    } catch {
      text = String(e);
    }
    try {
      console.error("[QuestFarmer]", scope, text);
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
      console.log("[QuestFarmer]", m);
    } catch {
    }
    try {
      const t = getToasts();
      if (t) t(m);
    } catch {
    }
  }

  // src/stuff/api.ts
  var cachedToken = null;
  function getToken() {
    if (cachedToken) return cachedToken;
    try {
      const b = getBunny();
      const v = getVd();
      const mod = b?.metro?.findByProps?.("getToken") ?? v?.metro?.findByProps?.("getToken");
      const t = mod?.getToken?.();
      if (typeof t === "string" && t.length > 10) {
        cachedToken = t;
        return t;
      }
    } catch {
    }
    return null;
  }
  var API_BASE = "https://discord.com/api/v9";
  async function apiPost(path, body) {
    const fallback = { ok: false, status: 0, data: null };
    try {
      const token = getToken();
      if (!token) return fallback;
      const r = await fetch(API_BASE + path, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body ?? {})
      });
      let data = null;
      try {
        data = await r.json();
      } catch {
      }
      return { ok: r.ok, status: r.status, data };
    } catch {
      return fallback;
    }
  }

  // src/stuff/quests.ts
  var SUPPORTED = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE"];
  function findQuestsStore() {
    try {
      const b = getBunny();
      const v = getVd();
      const store = b?.metro?.findByProps?.("getQuest") ?? v?.metro?.findByProps?.("getQuest");
      return store ?? null;
    } catch {
      return null;
    }
  }
  function listQuests() {
    const out = [];
    try {
      const store = findQuestsStore();
      const map = store?.quests;
      if (!map || typeof map.values !== "function") return out;
      for (const q of map.values()) {
        try {
          if (!q?.userStatus?.enrolledAt) continue;
          if (q.userStatus?.completedAt) continue;
          if (new Date(q.config?.expiresAt).getTime() <= Date.now()) continue;
          const taskConfig = q.config?.taskConfig ?? q.config?.taskConfigV2;
          if (!taskConfig?.tasks) continue;
          const allTasks = Object.keys(taskConfig.tasks);
          const taskName = SUPPORTED.find((t) => allTasks.includes(t)) ?? allTasks[0];
          if (!taskName) continue;
          const taskData = taskConfig.tasks[taskName];
          out.push({
            id: q.id,
            name: q.config?.messages?.questName ?? q.id,
            taskName,
            secondsNeeded: taskData?.target ?? 0,
            secondsDone: q.userStatus?.progress?.[taskName]?.value ?? 0,
            expiresAt: q.config?.expiresAt ?? "",
            supported: SUPPORTED.includes(taskName),
            raw: q
          });
        } catch {
        }
      }
    } catch {
    }
    return out;
  }
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function completeVideoQuest(quest, onProgress) {
    if (!quest.supported) return { ok: false, instant: false, error: "no soportada en m\xF3vil" };
    let done = Math.min(quest.secondsDone, quest.secondsNeeded);
    const target = quest.secondsNeeded;
    onProgress?.(done, target);
    const fast = await apiPost(
      `/quests/${quest.id}/video-progress?force=true`,
      { timestamp: target }
    );
    if (fast.ok && fast.data?.completed_at != null) {
      onProgress?.(target, target);
      return { ok: true, instant: true };
    }
    let completedAt = null;
    while (done < target) {
      await sleep(7e3);
      const timestamp = Math.min(target, done + 7);
      const res = await apiPost(`/quests/${quest.id}/video-progress`, {
        timestamp: Math.min(target, timestamp + Math.random())
      });
      if (res.ok && res.data?.completed_at != null) {
        completedAt = res.data.completed_at;
        done = target;
        break;
      }
      done = Math.min(target, timestamp);
      onProgress?.(done, target);
    }
    if (completedAt == null && done >= target) {
      const last = await apiPost(`/quests/${quest.id}/video-progress`, {
        timestamp: target
      });
      completedAt = last.data?.completed_at ?? null;
    }
    onProgress?.(done, target);
    return completedAt != null ? { ok: true, instant: false } : { ok: false, instant: false, error: "el servidor no confirm\xF3 la finalizaci\xF3n" };
  }

  // src/index.tsx
  var VERSION = "q1";
  var state = {
    quests: [],
    busy: /* @__PURE__ */ new Set(),
    log: "",
    lastRefresh: 0
  };
  function refresh() {
    try {
      state.quests = listQuests();
      state.lastRefresh = Date.now();
    } catch (e) {
      reportError("listar misiones", e);
    }
  }
  async function runQuest(q, rerender) {
    if (state.busy.has(q.id)) return;
    state.busy.add(q.id);
    state.log = `Ejecutando: ${q.name}\u2026`;
    rerender();
    try {
      const res = await completeVideoQuest(q, (done, needed) => {
        q.secondsDone = done;
        state.log = `${q.name}: ${done}/${needed}s`;
        rerender();
      });
      if (res.ok) {
        state.log = `\u2705 ${q.name}${res.instant ? " (instant\xE1nea)" : " completada"} \u2014 reclam\xE1 la recompensa en la pesta\xF1a Misiones`;
        toast(state.log);
      } else {
        state.log = `\u26A0 ${q.name}: ${res.error ?? "fall\xF3"}`;
        toast(state.log);
      }
    } catch (e) {
      state.log = `\u2717 ${q.name}: ${String(e?.message || e).slice(0, 120)}`;
      reportError("completar misi\xF3n", e);
    } finally {
      state.busy.delete(q.id);
      refresh();
      rerender();
    }
  }
  function buildSettings() {
    try {
      const RN = getRN();
      const React = getReact();
      if (!RN || !React) {
        reportError("ajustes", "ReactNative/React no disponibles");
        return () => null;
      }
      const { View, Text, ScrollView, StyleSheet } = RN;
      const styles = StyleSheet.create({
        page: { flex: 1 },
        body: { padding: 12, gap: 12 },
        title: { fontSize: 16, fontWeight: "700" },
        sub: { fontSize: 13, opacity: 0.7 },
        card: { borderRadius: 10, borderWidth: 1, borderColor: "#3a3a45", padding: 10, gap: 4 },
        qname: { fontSize: 14, fontWeight: "600" },
        mono: { fontFamily: "monospace", fontSize: 11, opacity: 0.8 },
        pill: {
          alignSelf: "flex-start",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: "#5865f2",
          marginTop: 4
        },
        pillOff: { backgroundColor: "#4a4a55" },
        pillTxt: { color: "#fff", fontSize: 13 },
        barBg: { height: 6, borderRadius: 3, backgroundColor: "#3a3a45", overflow: "hidden" },
        barFg: { height: 6, backgroundColor: "#23a55a" },
        err: { color: "#ff5252", fontSize: 12 }
      });
      const Btn = (props) => React.createElement(
        Text,
        { style: [styles.pill, props.disabled ? styles.pillOff : null], onPress: props.disabled ? void 0 : props.onPress },
        props.label
      );
      const TaskBadge = (t) => {
        const map = {
          WATCH_VIDEO: "\u{1F4FA} video",
          WATCH_VIDEO_ON_MOBILE: "\u{1F4F1} video m\xF3vil",
          PLAY_ON_DESKTOP: "\u{1F3AE} juego (PC)",
          STREAM_ON_DESKTOP: "\u{1F3AC} stream (PC)",
          PLAY_ACTIVITY: "\u{1F3A4} actividad"
        };
        return map[t] ?? t;
      };
      return function Settings() {
        const [, force] = React.useState(0);
        const rerender = () => force((n) => n + 1);
        if (!getToken()) {
          return React.createElement(
            ScrollView,
            { style: styles.page, contentContainerStyle: styles.body },
            React.createElement(Text, { style: styles.title }, "Quest Farmer ", VERSION),
            React.createElement(
              Text,
              { style: styles.err },
              "No se pudo obtener el token. Abre Discord y vuelve a entrar a ajustes."
            )
          );
        }
        const cards = state.quests.map((q) => {
          const pct = q.secondsNeeded > 0 ? Math.min(1, q.secondsDone / q.secondsNeeded) : 0;
          const running = state.busy.has(q.id);
          return React.createElement(
            View,
            { key: q.id, style: styles.card },
            React.createElement(Text, { style: styles.qname }, q.name),
            React.createElement(Text, { style: styles.mono }, TaskBadge(q.taskName)),
            React.createElement(
              View,
              { style: styles.barBg },
              React.createElement(View, { style: [styles.barFg, { width: `${Math.round(pct * 100)}%` }] })
            ),
            React.createElement(
              Text,
              { style: styles.mono },
              `${Math.floor(q.secondsDone)}s / ${Math.floor(q.secondsNeeded)}s`
            ),
            q.supported ? React.createElement(Btn, {
              label: running ? "Ejecutando\u2026" : "\u25B6 Completar",
              disabled: running,
              onPress: () => runQuest(q, rerender)
            }) : React.createElement(Text, { style: styles.sub }, "No soportada en m\xF3vil")
          );
        });
        return React.createElement(
          ScrollView,
          { style: styles.page, contentContainerStyle: styles.body },
          React.createElement(Text, { style: styles.title }, "Quest Farmer ", VERSION),
          React.createElement(
            Text,
            { style: styles.sub },
            "Completa autom\xE1ticamente las misiones de video de Discord."
          ),
          React.createElement(
            View,
            { style: { flexDirection: "row", gap: 8 } },
            React.createElement(Btn, { label: "\u{1F504} Actualizar lista", onPress: () => {
              refresh();
              rerender();
            } })
          ),
          cards.length === 0 ? React.createElement(
            Text,
            { style: styles.sub },
            "No hay misiones activas sin completar.\nAcept\xE1 una misi\xF3n en la pesta\xF1a Misiones y volv\xE9 ac\xE1."
          ) : null,
          ...cards,
          state.log ? React.createElement(Text, { style: styles.mono }, String(state.log)) : null
        );
      };
    } catch (e) {
      reportError("construir ajustes", e);
      return () => null;
    }
  }
  var settingsCache = null;
  function getSettingsPanel() {
    if (!settingsCache) settingsCache = buildSettings();
    return settingsCache;
  }
  function settings(props) {
    const React = getReact();
    const C = getSettingsPanel();
    return React?.createElement ? React.createElement(C, props) : C(props);
  }
  function onLoad() {
    try {
      refresh();
      toast(`Quest Farmer ${VERSION}: ${state.quests.length} misi\xF3n(es) activa(s)`);
    } catch (e) {
      reportError("onLoad", e);
    }
  }
  function onUnload() {
  }
  function getSettings() {
    return getSettingsPanel();
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