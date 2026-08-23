import { getRN, getReact } from "./env";
import { uriToEmoji } from "./emoji";

export function installImagePatch(
    onHit?: () => void,
): { unwind: () => void; ok: boolean; msg?: string } {
    const RN: any = getRN();
    const React: any = getReact();
    const OrigImage: any = RN?.Image;
    const OrigText: any = RN?.Text;

    if (!RN || !React || !OrigImage) {
        return {
            unwind: () => {},
            ok: false,
            msg: "faltan: "
                + [RN ? "" : "RN", OrigImage ? "" : "Image", React ? "" : "React"]
                    .filter(Boolean).join(", "),
        };
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

    // 1° intento: asignación directa (puede fallar si ReactNative es un Proxy sellado)
    let installed = false;
    try {
        RN.Image = wrapper;
        installed = RN.Image === wrapper;
    } catch {}

    // 2° intento: defineProperty (a veces sortea el trap set del Proxy)
    if (!installed) {
        try {
            Object.defineProperty(RN, "Image", {
                value: wrapper,
                writable: true,
                configurable: true,
            });
            installed = RN.Image === wrapper;
        } catch {}
    }

    if (!installed) {
        return {
            unwind: () => {},
            ok: false,
            msg: "RN.Image es de solo lectura en tu build",
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
                        configurable: true,
                    });
                } catch {}
            }
        },
        ok: true,
    };
}
