import { getReact, getRN, toast, reportError } from "./stuff/env";
import {
    listQuests,
    completeVideoQuest,
    completeGameQuest,
    completeStreamOrActivityQuest,
    enrollQuest,
    claimReward,
    dispatchQuests,
    QuestInfo,
} from "./stuff/quests";
import { getToken, getUserId } from "./stuff/api";

export const VERSION = "q2";

let state = {
    quests: [] as QuestInfo[],
    busy: new Set<string>(),
    log: "",
    claiming: false,
};

function refresh() {
    try {
        state.quests = listQuests();
    } catch (e) {
        reportError("listar misiones", e);
    }
}

const KIND_META: Record<string, { label: string; hint: string }> = {
    video: { label: "📺 video", hint: "~segundos" },
    game: { label: "🎮 juego", hint: "1 latido/60s — tarda lo que pida (min)" },
    stream: { label: "🎬 stream", hint: "1 latido/30s — mantené la app abierta" },
    activity: { label: "🎤 actividad", hint: "1 latido/20s — idealmente con alguien en el vc" },
};

async function runQuest(q: QuestInfo, rerender: () => void) {
    if (state.busy.has(q.id)) return;
    if (!q.enrolled) {
        state.log = `Aceptando ${q.name}…`;
        rerender();
        const e = await enrollQuest(q.id);
        if (!e.ok) {
            state.log = `⚠ No se pudo aceptar ${q.name}: ${e.error}`;
            toast(state.log);
            refresh();
            rerender();
            return;
        }
        q.enrolled = true;
    }
    if (q.blockedUntil && q.blockedUntil > Date.now()) {
        state.log = `⛔ Misiones bloqueadas en tu cuenta hasta ${new Date(q.blockedUntil).toLocaleString()}`;
        rerender();
        return;
    }

    state.busy.add(q.id);
    const meta = KIND_META[q.kind];
    state.log = `${meta?.label ?? q.taskName}: ${q.name} (${meta?.hint ?? ""})`;
    rerender();

    let result: { ok: boolean; error?: string } = { ok: false, error: "tipo desconocido" };
    try {
        if (q.kind === "video") {
            result = await completeVideoQuest(q, upd(q, rerender));
        } else if (q.kind === "game") {
            result = await completeGameQuest(q, upd(q, rerender));
        } else if (q.kind === "stream" || q.kind === "activity") {
            const uid = getUserId();
            result = uid
                ? await completeStreamOrActivityQuest(q, uid, upd(q, rerender))
                : { ok: false, error: "no se obtuvo tu id de usuario" };
        }

        if (result.ok) {
            state.log = `🎁 ${q.name}: completada, reclamando recompensa…`;
            rerender();
            const c = await claimReward(q.id);
            state.log = c.ok
                ? `✅ ${q.name}: ¡recompensa reclamada!`
                : `✅ ${q.name}: completada. ${c.error}`;
            toast(state.log);
        } else {
            state.log = `⚠ ${q.name}: ${result.error}`;
            toast(state.log);
        }
    } catch (e: any) {
        state.log = `✗ ${q.name}: ${String(e?.message || e).slice(0, 120)}`;
        reportError("completar misión", e);
    } finally {
        state.busy.delete(q.id);
        refresh();
        rerender();
    }
}

function upd(q: QuestInfo, rerender: () => void) {
    return (done: number, needed: number) => {
        q.secondsDone = done;
        state.log = `${q.name}: ${Math.floor(done)}/${Math.floor(needed)}s`;
        rerender();
    };
}

async function enrollAll(rerender: () => void) {
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

function buildSettings(): any {
    try {
        const RN: any = getRN();
        const React: any = getReact();
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
            err: { color: "#ff5252", fontSize: 12 },
        });

        const Btn = (props: { label: string; onPress: () => void; disabled?: boolean; key?: string }) =>
            React.createElement(
                Text,
                {
                    key: props.key,
                    style: [styles.pill, props.disabled ? styles.pillOff : null],
                    onPress: props.disabled ? undefined : props.onPress,
                },
                props.label,
            );

        return function Settings() {
            const [, force] = React.useState(0);
            const rerender = () => force((n: number) => n + 1);

            if (!getToken()) {
                return React.createElement(
                    ScrollView,
                    { style: styles.page, contentContainerStyle: styles.body },
                    React.createElement(Text, { style: styles.title }, "Quest Farmer ", VERSION),
                    React.createElement(
                        Text,
                        { style: styles.err },
                        "No se pudo obtener el token. Abre Discord y vuelve a entrar a ajustes.",
                    ),
                );
            }

            const cards = state.quests.map((q: QuestInfo) => {
                const pct = q.secondsNeeded > 0 ? Math.min(1, q.secondsDone / q.secondsNeeded) : 0;
                const running = state.busy.has(q.id);
                const meta = KIND_META[q.kind];
                return React.createElement(
                    View,
                    { key: q.id, style: styles.card },
                    React.createElement(Text, { style: styles.qname }, q.name),
                    React.createElement(Text, { style: styles.mono }, meta?.label ?? q.taskName),
                    q.enrolled ? null : React.createElement(Text, { style: styles.sub }, "Sin aceptar"),
                    React.createElement(View, { style: styles.barBg },
                        React.createElement(View, { style: [styles.barFg, { width: `${Math.round(pct * 100)}%` }] as any })),
                    React.createElement(Text, { style: styles.mono }, `${Math.floor(q.secondsDone)}s / ${Math.floor(q.secondsNeeded)}s`),
                    q.runnable
                        ? React.createElement(Btn, {
                            key: `b${q.id}`,
                            label: running ? "Ejecutando…" : q.enrolled ? "▶ Completar" : "▶ Aceptar y completar",
                            disabled: running || !!(q.blockedUntil && q.blockedUntil > Date.now()),
                            onPress: () => runQuest(q, rerender),
                        })
                        : React.createElement(Text, { style: styles.sub }, "Tipo no soportado todavía"),
                    meta?.hint ? React.createElement(Text, { style: styles.sub }, meta.hint) : null,
                );
            });

            return React.createElement(
                ScrollView,
                { style: styles.page, contentContainerStyle: styles.body },
                React.createElement(Text, { style: styles.title }, "Quest Farmer ", VERSION),
                React.createElement(
                    Text,
                    { style: styles.sub },
                    "Completa TODOS los tipos de misión desde el móvil.\nMantené la app abierta durante las misiones largas.",
                ),
                React.createElement(
                    View,
                    { style: styles.row },
                    React.createElement(Btn, { key: "ref", label: "🔄 Actualizar", onPress: () => { refresh(); rerender(); } }),
                    React.createElement(Btn, { key: "enr", label: "✅ Aceptar todas las nuevas", onPress: () => enrollAll(rerender) }),
                ),
                cards.length === 0
                    ? React.createElement(Text, { style: styles.sub }, "No hay misiones activas.")
                    : null,
                ...cards,
                state.log ? React.createElement(Text, { style: styles.mono }, String(state.log)) : null,
            );
        };
    } catch (e) {
        reportError("construir ajustes", e);
        return () => null;
    }
}

let settingsCache: any = null;
function getSettingsPanel(): any {
    if (!settingsCache) settingsCache = buildSettings();
    return settingsCache;
}

export function settings(props?: any): any {
    const React: any = getReact();
    const C: any = getSettingsPanel();
    return React?.createElement ? React.createElement(C, props) : C(props);
}

export function onLoad(): void {
    try {
        refresh();
        toast(`Quest Farmer ${VERSION}: ${state.quests.length} misión(es)`);
    } catch (e) {
        reportError("onLoad", e);
    }
}

export function onUnload(): void {}

export function getSettings(): any {
    return getSettingsPanel();
}
