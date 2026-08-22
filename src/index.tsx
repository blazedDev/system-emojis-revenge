import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";

import { applyAll, unwindAll, vstorage } from "./stuff/controller";

const { View, Text, Switch, StyleSheet, ScrollView } = RN as any;

export function onLoad() {
    if (typeof vstorage.patchMessages !== "boolean") vstorage.patchMessages = true;
    if (typeof vstorage.patchImages !== "boolean") vstorage.patchImages = true;
    applyAll();
}

export const onUnload = () => unwindAll();

const styles = StyleSheet.create({
    wrap: { flex: 1, paddingVertical: 24 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    title: { fontSize: 16, color: "#fff", flexShrink: 1, marginRight: 12 },
    sub: { fontSize: 13, color: "#b5bac1", marginTop: 2, flexShrink: 1 },
    divider: { height: 1, backgroundColor: "#26272b", marginHorizontal: 16 },
    section: {
        fontSize: 12,
        fontWeight: "700",
        color: "#94949c",
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 6,
        textTransform: "uppercase",
    },
    note: { fontSize: 13, color: "#b5bac1", paddingHorizontal: 16, lineHeight: 19 },
});

function Row(props: { title: string; sub?: string; value: boolean; onChange: () => void }) {
    return (
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{props.title}</Text>
                {props.sub ? <Text style={styles.sub}>{props.sub}</Text> : null}
            </View>
            <Switch value={props.value} onValueChange={props.onChange} />
        </View>
    );
}

function SettingsPanel() {
    const [, force] = React.useState(0);
    const rerender = () => force((x: number) => x + 1);

    function toggle(key: "patchMessages" | "patchImages") {
        vstorage[key] = !vstorage[key];
        applyAll();
        rerender();
    }

    return (
        <ScrollView style={styles.wrap}>
            <Text style={styles.section}>Reemplazo</Text>
            <Row
                title="Mensajes y respuestas"
                sub="Convierte los Twemoji del chat a emojis del sistema"
                value={vstorage.patchMessages}
                onChange={() => toggle("patchMessages")}
            />
            <View style={styles.divider} />
            <Row
                title="Imágenes de emoji"
                sub="Reemplaza imágenes twemoji/asset por texto (experimental)"
                value={vstorage.patchImages}
                onChange={() => toggle("patchImages")}
            />
            <Text style={styles.section}>Diagnóstico</Text>
            <Text style={styles.note}>
                chat conectado: {vstorage.statusChat ? "sí" : "no"}
                {"\n"}
                parche de imágenes activo: {vstorage.statusImages ? "sí" : "no"}
                {"\n"}
                updateRows llamado: {vstorage.dbgRows ?? 0}
                {"\n"}
                emojis convertidos en mensajes: {vstorage.dbgEmojiRows ?? 0}
                {"\n"}
                imágenes de emoji reemplazadas: {vstorage.dbgImages ?? 0}
            </Text>
            <Text style={[styles.note, { marginTop: 16 }]}>
                Los emojis personalizados de servidores no se modifican. Abrí un chat con emojis y
                volvé acá para ver los contadores moverse.
            </Text>
        </ScrollView>
    );
}

export const Settings = SettingsPanel;
