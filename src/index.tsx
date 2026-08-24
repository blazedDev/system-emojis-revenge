import { getReact, getRN, toast, reportError } from "./stuff/env";
import { listQuests, completeVideoQuest, QuestInfo } from "./stuff/quests";
import { getToken } from "./stuff/api";

export const VERSION = "q1";

let state = {
    quests: [] as QuestInfo[],
    busy: new Set<string>(),
    log: "",
    lastRefresh: 0,
};

function refresh() {
    try {
        state.quests = listQuests();
        state.lastRefresh = Date.now();
    } catch (e) {
        reportError("listar misiones", e);
    }
}

async function runQuest(q: QuestInfo, rerender: () => void) {
    if (state.busy.has(q.id)) return;
    state.busy.add(q.id);
    state.log = `Ejecutando: ${q.name}…`;
    rerender();
    try {
        const res = await completeVideoQuest(q, (done, needed) => {
            q.secondsDone = done;
            state.log = `${q.name}: ${done}/${needed}s`;
            rerender();
        });
        if (res.ok) {
            state.log = `✅ ${q.name}${res.instant ? " (instantánea)" : " completada"} — reclamá la recompensa en la pestaña Misiones`;
            toast(state.log);
        } else {
            state.log = `⚠ ${q.name}: ${res.error ?? "falló"}`;
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
            pill: {
                alignSelf: "flex-start",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: "#5865f2",
                marginTop: 4,
            },
            pillOff: { backgroundColor: "#4a4a55" },
            pillTxt: { color: "#fff", fontSize: 13 },
            barBg: { height: 6, borderRadius: 3, backgroundColor: "#3a3a45", overflow: "hidden" },
            barFg: { height: 6, backgroundColor: "#23a55a" },
            err: { color: "#ff5252", fontSize: 12 },
        });

        const Btn = (props: { label: string; onPress: () => void; disabled?: boolean }) =>
            React.createElement(
                Text,
                { style: [styles.pill, props.disabled ? styles.pillOff : null], onPress: props.disabled ? undefined : props.onPress },
                props.label,
            );

        const TaskBadge = (t: string) => {
            const map: Record<string, string> = {
                WATCH_VIDEO: "📺 video",
                WATCH_VIDEO_ON_MOBILE: "📱 video móvil",
                PLAY_ON_DESKTOP: "🎮 juego (PC)",
                STREAM_ON_DESKTOP: "🎬 stream (PC)",
                PLAY_ACTIVITY: "🎤 actividad",
            };
            return map[t] ?? t;
        };

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
                return React.createElement(
                    View,
                    { key: q.id, style: styles.card },
                    React.createElement(Text, { style: styles.qname }, q.name),
                    React.createElement(Text, { style: styles.mono }, TaskBadge(q.taskName)),
                    React.createElement(View, { style: styles.barBg },
                        React.createElement(View, { style: [styles.barFg, { width: `${Math.round(pct * 100)}%` }] as any })),
                    React.createElement(
                        Text,
                        { style: styles.mono },
                        `${Math.floor(q.secondsDone)}s / ${Math.floor(q.secondsNeeded)}s`,
                    ),
                    q.supported
                        ? React.createElement(Btn, {
                            label: running ? "Ejecutando…" : "▶ Completar",
                            disabled: running,
                            onPress: () => runQuest(q, rerender),
                        })
                        : React.createElement(Text, { style: styles.sub }, "No soportada en móvil"),
                );
            });

            return React.createElement(
                ScrollView,
                { style: styles.page, contentContainerStyle: styles.body },
                React.createElement(Text, { style: styles.title }, "Quest Farmer ", VERSION),
                React.createElement(
                    Text,
                    { style: styles.sub },
                    "Completa automáticamente las misiones de video de Discord.",
                ),
                React.createElement(
                    View,
                    { style: { flexDirection: "row", gap: 8 } as any },
                    React.createElement(Btn, { label: "🔄 Actualizar lista", onPress: () => { refresh(); rerender(); } }),
                ),
                cards.length === 0
                    ? React.createElement(
                        Text,
                        { style: styles.sub },
                        "No hay misiones activas sin completar.\nAceptá una misión en la pestaña Misiones y volvé acá.",
                    )
                    : null,
                ...cards,
                state.log
                    ? React.createElement(Text, { style: styles.mono }, String(state.log))
                    : null,
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
        toast(`Quest Farmer ${VERSION}: ${state.quests.length} misión(es) activa(s)`);
    } catch (e) {
        reportError("onLoad", e);
    }
}

export function onUnload(): void {}

export function getSettings(): any {
    return getSettingsPanel();
}
