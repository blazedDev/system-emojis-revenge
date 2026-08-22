import { getRN, getVd, reportError } from "./env";
import { uriToEmoji } from "./emoji";

export function installImagePatch(
    onHit?: () => void,
): { unwind: () => void; ok: boolean } {
    const RN: any = getRN();
    const React = getVd()?.["metro.common"]?.React;
    const OrigImage: any = RN?.Image;
    const OrigText: any = RN?.Text;

    if (!OrigImage || !React) {
        reportError("imágenes", "RN.Image o React no disponibles");
        return { unwind: () => {}, ok: false };
    }

    const wrapper = function EmojiAwareImage(props: any) {
        const emoji = uriToEmoji(props?.source?.uri);
        if (emoji) {
            try {
                onHit?.();
            } catch {}
            return React.createElement(
                OrigText ?? "View",
                props?.style ? { style: props.style, children: emoji } : { children: emoji },
            );
        }
        return React.createElement(OrigImage, props);
    };

    try {
        for (const key of Object.keys(OrigImage ?? {})) {
            try {
                Object.defineProperty(wrapper, key, Object.getOwnPropertyDescriptor(OrigImage, key)!);
            } catch {}
        }
        (RN as any).Image = wrapper;
    } catch (e: any) {
        reportError("imágenes", e);
        return { unwind: () => {}, ok: false };
    }

    return {
        unwind: () => {
            try {
                (RN as any).Image = OrigImage;
            } catch {}
        },
        ok: true,
    };
}
