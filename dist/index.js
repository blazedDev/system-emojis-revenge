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
  function getUserId() {
    try {
      const b = getBunny();
      const v = getVd();
      const mod = b?.metro?.findByProps?.("getCurrentUser") ?? v?.metro?.findByProps?.("getCurrentUser");
      const id = mod?.getCurrentUser?.().id;
      if (id != null) return String(id);
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
  var VIDEO_TASKS = ["WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE"];
  var GAME_TASKS = ["PLAY_ON_DESKTOP"];
  var STREAM_TASKS = ["STREAM_ON_DESKTOP"];
  var ACTIVITY_TASKS = ["PLAY_ACTIVITY"];
  var ALL_KNOWN = [...VIDEO_TASKS, ...GAME_TASKS, ...STREAM_TASKS, ...ACTIVITY_TASKS];
  function findModule(props) {
    try {
      const b = getBunny();
      const v = getVd();
      return b?.metro?.findByProps?.(...props) ?? v?.metro?.findByProps?.(...props) ?? null;
    } catch {
      return null;
    }
  }
  function resolveTask(q) {
    const tc = q.config?.taskConfig ?? q.config?.taskConfigV2;
    if (!tc?.tasks) return null;
    for (const k of ALL_KNOWN) {
      if (tc.tasks[k] != null) return { name: k, data: tc.tasks[k] };
    }
    const keys = Object.keys(tc.tasks);
    return keys.length ? { name: keys[0], data: tc.tasks[keys[0]] } : null;
  }
  function resolveAppId(q, taskData) {
    const modern = taskData?.applications?.[0]?.id;
    if (modern != null) return String(modern);
    const legacy = q.config?.application?.id;
    return legacy != null ? String(legacy) : null;
  }
  function kindOf(taskName) {
    if (VIDEO_TASKS.includes(taskName)) return "video";
    if (GAME_TASKS.includes(taskName)) return "game";
    if (STREAM_TASKS.includes(taskName)) return "stream";
    if (ACTIVITY_TASKS.includes(taskName)) return "activity";
    return "unknown";
  }
  function blockedUntilOf(q) {
    const v = q.userStatus?.quest_enrollment_blocked_until ?? q.quest_enrollment_blocked_until;
    if (v == null) return null;
    const t = typeof v === "number" ? v : new Date(v).getTime();
    return isNaN(t) ? null : t;
  }
  function listQuests() {
    const out = [];
    const store = findModule(["getQuest"]);
    const map = store?.quests;
    if (!map || typeof map.values !== "function") return out;
    for (const q of map.values()) {
      try {
        if (!q?.config || new Date(q.config?.expiresAt).getTime() <= Date.now()) continue;
        const task = resolveTask(q);
        if (!task) continue;
        const enrolled = !!q.userStatus?.enrolledAt;
        if (!enrolled && q.userStatus?.completedAt) continue;
        out.push({
          id: q.id,
          name: q.config?.messages?.questName ?? q.id,
          taskName: task.name,
          kind: kindOf(task.name),
          secondsNeeded: task.data?.target ?? 0,
          secondsDone: q.userStatus?.progress?.[task.name]?.value ?? 0,
          appId: resolveAppId(q, task.data),
          expiresAt: q.config?.expiresAt ?? "",
          runnable: kindOf(task.name) !== "unknown",
          blockedUntil: blockedUntilOf(q),
          enrolled,
          raw: q
        });
      } catch {
      }
    }
    return out;
  }
  var cachedChannelId = null;
  function getChannelId() {
    if (cachedChannelId) return cachedChannelId;
    try {
      const dm = findModule(["getSortedPrivateChannels"]);
      const ch = dm?.getSortedPrivateChannels?.()[0]?.id;
      if (ch != null) {
        cachedChannelId = String(ch);
        return cachedChannelId;
      }
      const gs = findModule(["getAllGuilds"]);
      const guilds = gs?.getAllGuilds?.() ?? {};
      for (const g of Object.values(guilds)) {
        const voc = g?.VOCAL?.[0]?.channel?.id ?? g?.VOCAL?.[0]?.id;
        if (voc != null) {
          cachedChannelId = String(voc);
          return cachedChannelId;
        }
      }
    } catch {
    }
    return null;
  }
  function makeStreamKey(userId) {
    const ch = getChannelId();
    if (ch == null) return null;
    return `call:${ch}:${userId}`;
  }
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  var rand = (n) => Math.floor(Math.random() * n);
  var alnum = () => {
    const s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let o = "";
    for (let i = 0; i < 32; i++) o += s[rand(s.length)];
    return o;
  };
  async function completeVideoQuest(quest, onProgress, onNote) {
    let done = Math.min(quest.secondsDone, quest.secondsNeeded);
    const target = quest.secondsNeeded;
    onProgress?.(done, target);
    const fast = await apiPost(`/quests/${quest.id}/video-progress?force=true`, { timestamp: target });
    if (fast.ok && fast.data?.completed_at != null) {
      onProgress?.(target, target);
      return { ok: true };
    }
    let completedAt = null;
    let fails = 0;
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
      if (!res.ok) {
        fails++;
        onNote?.(`progreso rechazado (${res.status}), reintento ${fails}/5`);
        if (fails >= 5) return { ok: false, error: `video-progress rechazado (${res.status})` };
        continue;
      }
      fails = 0;
      done = Math.min(target, timestamp);
      onProgress?.(done, target);
    }
    if (completedAt == null && done >= target) {
      const last = await apiPost(`/quests/${quest.id}/video-progress`, { timestamp: target });
      completedAt = last.data?.completed_at ?? null;
    }
    onProgress?.(done, target);
    return completedAt != null ? { ok: true } : { ok: false, error: "el servidor no confirm\xF3" };
  }
  async function completeHeartbeatQuest(quest, intervalSec, buildBody, onProgress, onNote) {
    const target = quest.secondsNeeded;
    let done = Math.min(quest.secondsDone, target);
    onProgress?.(done, target);
    if (done >= target) {
      const fin2 = await apiPost(`/quests/${quest.id}/heartbeat`, buildBody(true));
      return fin2.ok ? { ok: true } : { ok: false, error: `cierre rechazado (${fin2.status})` };
    }
    let beats = 0;
    let fails = 0;
    while (done < target) {
      await sleep(intervalSec * 1e3);
      beats++;
      const res = await apiPost(`/quests/${quest.id}/heartbeat`, buildBody(false));
      if (!res.ok) {
        fails++;
        onNote?.(`latido ${beats} rechazado (${res.status}), reintento ${fails}/5`);
        if (fails >= 5) return { ok: false, error: `latidos rechazados (${res.status})` };
        continue;
      }
      fails = 0;
      if (res.data?.completed_at != null) {
        onProgress?.(target, target);
        return { ok: true };
      }
      const p = Number(res.data?.progress?.[quest.taskName]?.value);
      if (!isNaN(p) && p > done) {
        done = Math.min(p, target);
        onProgress?.(done, target);
      } else {
        done = Math.min(target, Math.min(quest.secondsDone, target) + beats * intervalSec);
        onProgress?.(done, target);
      }
    }
    const fin = await apiPost(`/quests/${quest.id}/heartbeat`, buildBody(true));
    if (fin.data?.completed_at != null) return { ok: true };
    const fp = Number(fin.data?.progress?.[quest.taskName]?.value);
    if (fin.ok && (isNaN(fp) || fp >= target)) return { ok: true };
    return {
      ok: false,
      error: `el servidor acredit\xF3 ${isNaN(fp) ? "?" : fp}/${target}s al cerrar`
    };
  }
  async function completeGameQuest(q, onProgress, onNote) {
    if (!q.appId) return { ok: false, error: "sin application_id en la misi\xF3n" };
    return completeHeartbeatQuest(q, 60, (terminal) => ({ application_id: q.appId, terminal }), onProgress, onNote);
  }
  async function completeStreamOrActivityQuest(q, userId, onProgress, onNote) {
    const key = makeStreamKey(userId) ?? `stream_${alnum()}`;
    const interval = q.kind === "activity" ? 20 : 30;
    return completeHeartbeatQuest(q, interval, (terminal) => ({ stream_key: key, terminal }), onProgress, onNote);
  }
  async function enrollQuest(questId) {
    const full = await apiPost(
      `/quests/${questId}/enroll`,
      { location: 11, is_targeted: false, metadata_raw: null }
    );
    if (full.ok) return { ok: true };
    const minimal = await apiPost(`/quests/${questId}/enroll`, { location: 11 });
    return minimal.ok ? { ok: true } : { ok: false, error: `enroll fall\xF3 (${minimal.status})` };
  }
  async function claimReward(questId) {
    const r = await apiPost(`/quests/${questId}/claim-reward`, {});
    if (r.ok) return { ok: true };
    return { ok: false, error: `claim fall\xF3 (${r.status})${r.status === 400 ? " \u2014 probablemente pide captcha, reclam\xE1 manual" : ""}` };
  }
  function dispatchQuests() {
    return listQuests().filter((q) => !q.enrolled && q.runnable);
  }

  // src/index.tsx
  var VERSION = "q3";
  var state = {
    quests: [],
    current: null,
    log: ""
  };
  function refresh() {
    try {
      state.quests = listQuests();
    } catch (e) {
      reportError("listar misiones", e);
    }
  }
  var KIND_META = {
    video: { label: "\u{1F4FA} video", hint: "~segundos" },
    game: { label: "\u{1F3AE} juego", hint: "1 latido/60s \u2014 tarda lo que pida (min)" },
    stream: { label: "\u{1F3AC} stream", hint: "1 latido/30s \u2014 manten\xE9 la app abierta" },
    activity: { label: "\u{1F3A4} actividad", hint: "1 latido/20s \u2014 idealmente con alguien en el vc" }
  };
  var queue = [];
  var pumping = false;
  function runQuest(q, rerender) {
    if (queue.some((e) => e.q.id === q.id)) return;
    queue.push({ q, rerender });
    state.log = `En cola: ${q.name}`;
    rerender();
    void pump();
  }
  async function pump() {
    if (pumping) return;
    pumping = true;
    try {
      while (queue.length > 0) {
        const job = queue.shift();
        await doRun(job.q, job.rerender);
      }
    } finally {
      pumping = false;
    }
  }
  async function doRun(q, rerender) {
    if (!q.enrolled) {
      state.log = `Aceptando ${q.name}\u2026`;
      rerender();
      const e = await enrollQuest(q.id);
      if (!e.ok) {
        state.log = `\u26A0 No se pudo aceptar ${q.name}: ${e.error}`;
        toast(state.log);
        refresh();
        rerender();
        return;
      }
      q.enrolled = true;
    }
    if (q.blockedUntil && q.blockedUntil > Date.now()) {
      state.log = `\u26D4 Misiones bloqueadas en tu cuenta hasta ${new Date(q.blockedUntil).toLocaleString()}`;
      rerender();
      return;
    }
    const meta = KIND_META[q.kind];
    state.current = q.id;
    state.log = `${meta?.label ?? q.taskName}: ${q.name} (${meta?.hint ?? ""})`;
    rerender();
    let result = { ok: false, error: "tipo desconocido" };
    try {
      if (q.kind === "video") {
        result = await completeVideoQuest(q, upd(q, rerender), note(rerender));
      } else if (q.kind === "game") {
        result = await completeGameQuest(q, upd(q, rerender), note(rerender));
      } else if (q.kind === "stream" || q.kind === "activity") {
        const uid = getUserId();
        result = uid ? await completeStreamOrActivityQuest(q, uid, upd(q, rerender), note(rerender)) : { ok: false, error: "no se obtuvo tu id de usuario" };
      }
      if (result.ok) {
        state.log = `\u{1F381} ${q.name}: completada, reclamando recompensa\u2026`;
        rerender();
        const c = await claimReward(q.id);
        state.log = c.ok ? `\u2705 ${q.name}: \xA1recompensa reclamada!` : `\u2705 ${q.name}: completada. ${c.error}`;
        toast(state.log);
      } else {
        state.log = `\u26A0 ${q.name}: ${result.error}`;
        toast(state.log);
      }
    } catch (e) {
      state.log = `\u2717 ${q.name}: ${String(e?.message || e).slice(0, 120)}`;
      reportError("completar misi\xF3n", e);
    } finally {
      state.current = null;
      refresh();
      rerender();
    }
  }
  function note(rerender) {
    return (s) => {
      state.log = s;
      rerender();
    };
  }
  function upd(q, rerender) {
    return (done, needed) => {
      q.secondsDone = done;
      state.log = `${q.name}: ${Math.floor(done)}/${Math.floor(needed)}s`;
      rerender();
    };
  }
  async function enrollAll(rerender) {
    const avail = dispatchQuests();
    if (!avail.length) {
      state.log = "No hay misiones nuevas para aceptar.";
      rerender();
      return;
    }
    let okN = 0;
    for (const q of avail) {
      const r = await enrollQuest(q.id);
      if (r.ok) okN++;
    }
    state.log = `Aceptadas ${okN}/${avail.length} misiones.`;
    toast(state.log);
    refresh();
    rerender();
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
        row: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
        pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#5865f2" },
        pillOff: { backgroundColor: "#4a4a55" },
        pillTxt: { color: "#fff", fontSize: 13 },
        barBg: { height: 6, borderRadius: 3, backgroundColor: "#3a3a45", overflow: "hidden" },
        barFg: { height: 6, backgroundColor: "#23a55a" },
        err: { color: "#ff5252", fontSize: 12 }
      });
      const Btn = (props) => React.createElement(
        Text,
        {
          key: props.key,
          style: [styles.pill, props.disabled ? styles.pillOff : null],
          onPress: props.disabled ? void 0 : props.onPress
        },
        props.label
      );
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
          const meta = KIND_META[q.kind];
          return React.createElement(
            View,
            { key: q.id, style: styles.card },
            React.createElement(Text, { style: styles.qname }, q.name),
            React.createElement(Text, { style: styles.mono }, meta?.label ?? q.taskName),
            q.enrolled ? null : React.createElement(Text, { style: styles.sub }, "Sin aceptar"),
            React.createElement(
              View,
              { style: styles.barBg },
              React.createElement(View, { style: [styles.barFg, { width: `${Math.round(pct * 100)}%` }] })
            ),
            React.createElement(Text, { style: styles.mono }, `${Math.floor(q.secondsDone)}s / ${Math.floor(q.secondsNeeded)}s`),
            q.runnable ? React.createElement(Btn, {
              key: `b${q.id}`,
              label: state.current === q.id ? "Ejecutando\u2026" : q.enrolled ? "\u25B6 Completar" : "\u25B6 Aceptar y completar",
              disabled: state.current != null || !!(q.blockedUntil && q.blockedUntil > Date.now()),
              onPress: () => runQuest(q, rerender)
            }) : React.createElement(Text, { style: styles.sub }, "Tipo no soportado todav\xEDa"),
            meta?.hint ? React.createElement(Text, { style: styles.sub }, meta.hint) : null
          );
        });
        return React.createElement(
          ScrollView,
          { style: styles.page, contentContainerStyle: styles.body },
          React.createElement(Text, { style: styles.title }, "Quest Farmer ", VERSION),
          React.createElement(
            Text,
            { style: styles.sub },
            "Completa TODOS los tipos de misi\xF3n desde el m\xF3vil.\nManten\xE9 la app abierta durante las misiones largas."
          ),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Btn, { key: "ref", label: "\u{1F504} Actualizar", onPress: () => {
              refresh();
              rerender();
            } }),
            React.createElement(Btn, { key: "enr", label: "\u2705 Aceptar todas las nuevas", onPress: () => enrollAll(rerender) })
          ),
          cards.length === 0 ? React.createElement(Text, { style: styles.sub }, "No hay misiones activas.") : null,
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
      toast(`Quest Farmer ${VERSION}: ${state.quests.length} misi\xF3n(es)`);
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