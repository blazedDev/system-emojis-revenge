import { getStorage, getRN, getVd, toast, reportError } from "./stuff/env";
import { applyAll, unwindAll, resetDebug, vstorage } from "./stuff/controller";

export const VERSION = "v9";

const defaults: Record<string, any> = {
    patchMessages: true,
    patchImages: false,
    statusChat: false,
    statusImages: false,
    dbgRows: 0,
    dbgEmojiRows: 0,
    dbgImages: 0,
    errMsg: "",
};
for (const k of Object.keys(defaults)) {
    if (vstorage[k] === undefined) vstorage[k] = defaults[k];
}

let SettingsPanel: any = () => null;

function buildSettings(): any {
    try {
        const RN: any = getRN();
        const React: any = getVd()?.["metro.common"]?.React;
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
                    "Reemplaza Twemoji por los emojis de tu sistema.",
                ),
                React.createElement(Toggle, {
                    label: "Mensajes (filas del chat)",
                    value: vstorage.patchMessages !== false,
                    onChange: (v: boolean) => {
                        vstorage.patchMessages = v;
                        applyAll();
                        rerender();
                    },
                }),
                React.createElement(Toggle, {
                    label: "Imágenes (avatares/reacciones)",
                    value: vstorage.patchImages === true,
                    onChange: (v: boolean) => {
                        vstorage.patchImages = v;
                        applyAll();
                        rerender();
                    },
                }),
                React.createElement(
                    Text,
                    { style: styles.mono },
                    `chat conectado: ${vstorage.statusChat ? "sí" : "no"}`
                    + `\nimágenes parcheadas: ${vstorage.statusImages ? "sí" : "no"}`
                    + `\nupdateRows llamado: ${vstorage.dbgRows ?? 0}`
                    + `\nemojis convertidos: ${vstorage.dbgEmojiRows ?? 0}`
                    + `\nimágenes reemplazadas: ${vstorage.dbgImages ?? 0}`,
                ),
                vstorage.errMsg
                    ? React.createElement(Text, { style: styles.err }, String(vstorage.errMsg))
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
        SettingsPanel = buildSettings();
        applyAll();
        vstorage.errMsg = "";
        toast(`System Emojis ${VERSION}: activo ✅`);
    } catch (e) {
        try {
            vstorage.errMsg = String((e as any)?.stack || e).slice(0, 300);
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
