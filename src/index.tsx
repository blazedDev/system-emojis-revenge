import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";

import { applyAll, unwindAll, vstorage } from "./stuff/controller";

const { FormSection, FormSwitchRow, FormDivider, FormText } = Forms;

export function onLoad() {
    if (typeof vstorage.patchMessages !== "boolean") vstorage.patchMessages = true;
    if (typeof vstorage.patchImages !== "boolean") vstorage.patchImages = true;
    applyAll();
}

export const onUnload = () => unwindAll();

function toggle(key: "patchMessages" | "patchImages") {
    vstorage[key] = !vstorage[key];
    applyAll();
}

function SettingsPanel() {
    useProxy(storage);

    return (
        <>
            <FormSection title="Reemplazo">
                <FormSwitchRow
                    title="Mensajes y respuestas"
                    subTitle="Método estable: convierte los Twemoji a emojis del sistema en el chat"
                    value={vstorage.patchMessages}
                    onPress={() => toggle("patchMessages")}
                />
                <FormDivider />
                <FormSwitchRow
                    title="Embeds, reacciones y más (experimental)"
                    subTitle="Intercepta todas las imágenes de emoji. Puede fallar según la versión de Discord"
                    value={vstorage.patchImages}
                    onPress={() => toggle("patchImages")}
                />
                <FormDivider />
                <FormText>
                    Los emojis personalizados de servidores no se modifican. Si algo queda raro,
                    desactivá y activá el plugin o reiniciá la app.
                </FormText>
            </FormSection>
        </>
    );
}

export const Settings = SettingsPanel;
