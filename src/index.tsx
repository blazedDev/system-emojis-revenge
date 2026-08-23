import { getStorage, getReact, getRN, toast, reportError } from "./stuff/env";
import { applyAll, unwindAll, resetDebug, getPatchMessages, getPatchImages, setFlag, getMode, setMode, state, counters } from "./stuff/controller";

export const VERSION = "v13";

let SettingsPanel: any = () => null;
function getSettingsPanel(): any {
    if (!settingsCache) settingsCache = buildSettings();
    return settingsCache;
}
let settingsCache: any = null;

function buildSettings(): any {
    try {
        const RN: any = getRN();
        const React: any = getReact();
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
            pill: {
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#5865f2",
                marginHorizontal: 3,
            },
            pillOn: { backgroundColor: "#5865f2" },
            pillTxt: { color: "#fff", fontSize: 13 },
            err: { color: "#ff5252", fontSize: 12 },
        });

        const Toggle = (props: { label: string; value: boolean; onChange: (v: boolean) => void }) =>
            React.createElement(
                View,
                { style: styles.row },
                React.createElement(Text, { style: { flex: 1 } }, props.label),
                React.createElement(Switch, {
                    value: !!props.value,
                    onValueChange: props.onChange,
                }),
            );

        return function Settings() {
            const [, force] = React.useState(0);
            const rerender = () => force((n: number) => n + 1);
            return React.createElement(
                ScrollView,
                { style: styles.page, contentContainerStyle: styles.body },
                React.createElement(
                    Text,
                    { style: styles.title },
                    "System Emojis Everywhere ",
                    VERSION,
                ),
                React.createElement(
                    Text,
                    { style: styles.sub },
                    "Reemplaza los Twemoji de Discord por emojis de iOS (o del sistema).",
                ),
                React.createElement(Toggle, {
                    label: "Mensajes (filas del chat)",
                    value: getPatchMessages(),
                    onChange: (v: boolean) => {
                        setFlag("patchMessages", v);
                        try { applyAll(); } catch {}
                        rerender();
                    },
                }),
                React.createElement(
                    View,
                    { style: styles.row },
                    React.createElement(
                        Text,
                        { style: { flex: 1 } },
                        "Estilo:",
                    ),
                    React.createElement(
                        Text,
                        {
                            style: [styles.pill, styles.pillTxt, getMode() === "ios" ? styles.pillOn : null],
                            onPress: () => { setMode("ios"); try { applyAll(); } catch {} rerender(); },
                        },
                        " iOS ",
                    ),
                    React.createElement(
                        Text,
                        {
                            style: [styles.pill, styles.pillTxt, getMode() === "system" ? styles.pillOn : null],
                            onPress: () => { setMode("system"); try { applyAll(); } catch {} rerender(); },
                        },
                        " Sistema ",
                    ),
                ),
                React.createElement(Toggle, {
                    label: "Imágenes (reacciones/embeds → Apple) [recomendado]",
                    value: getPatchImages(),
                    onChange: (v: boolean) => {
                        setFlag("patchImages", v);
                        try { applyAll(); } catch {}
                        rerender();
                    },
                }),
                React.createElement(
                    Text,
                    { style: styles.mono },
                    `chat conectado: ${state.chat ? "sí" : "no"}`
                    + `\nimágenes parcheadas: ${state.images ? "sí" : "no"}`
                    + `\nupdateRows llamado: ${counters.rows}`
                    + `\nemojis convertidos: ${counters.emoji}`
                    + `\nimágenes reemplazadas: ${counters.imgs}`
                ),
                state.err
                    ? React.createElement(Text, { style: styles.err }, String(state.err))
                    : null,
                React.createElement(
                    Text,
                    { style: styles.sub, onPress: () => { resetDebug(); rerender(); } },
                    "Tocá aquí para reiniciar el diagnóstico.",
                ),
            );
        };
    } catch (e) {
        reportError("construir ajustes", e);
        return () => null;
    }
}

export function onLoad(): void {
    try {
        applyAll();
        state.err = "";
        toast(`System Emojis ${VERSION}: activo ✅`);
    } catch (e) {
        try {
            state.err = String((e as any)?.stack || e).slice(0, 300);
        } catch {}
        reportError("onLoad", e);
    }
}

export function onUnload(): void {
    try {
        unwindAll();
    } catch (e) {
        reportError("onUnload", e);
    }
}

export function getSettings(): any {
    if (!SettingsPanel) SettingsPanel = buildSettings();
    return SettingsPanel;
}

// Export `settings` = componente (contrato vendetta: pluginInstance[id]?.settings)
export function settings(props?: any): any {
    const React: any = getReact();
    const C: any = getSettingsPanel();
    return React?.createElement ? React.createElement(C, props) : C(props);
}

// Puente para el sistema bunny: (bunny,definePlugin)=>{...;return plugin?.default ?? plugin}
try {
    const instance: any = {
        start: onLoad,
        stop: onUnload,
        manifest: { name: "System Emojis Everywhere", version: VERSION },
    };
    Object.defineProperty(instance, "SettingsComponent", {
        configurable: true,
        get: () => getSettingsPanel(),
    });
    (globalThis as any).plugin = instance;
} catch {}
