import { getReact, reportError } from "./env";
import { iosizeString } from "./emoji";

// Hook de bajo nivel: envuelve React.createElement para reescribir
// cualquier props.source.uri de Twemoji a Apple en el momento de creación.
// No depende del registro de módulos ni de referencias capturadas antes.

export function installCreateElementHook(onHit?: () => void): (() => void) | null {
    const React: any = getReact();
    const Orig: any = React?.createElement;
    if (!React || typeof Orig !== "function") {
        reportError("createElement", "React o createElement no disponibles");
        return null;
    }

    // Evitar doble instalación
    if ((Orig as any).__seeWrapped) return null;

    const fastRewrite = (props: any): void => {
        try {
            if (!props || typeof props !== "object") return;
            const s = props.source;
            if (s && typeof s === "object" && typeof s.uri === "string") {
                const nu = iosizeString(s.uri);
                if (nu !== s.uri) {
                    props.source = { ...s, uri: nu };
                    try {
                        onHit?.();
                    } catch {}
                }
                return;
            }
            if (typeof props.uri === "string") {
                const nu = iosizeString(props.uri);
                if (nu !== props.uri) {
                    props.uri = nu;
                    try {
                        onHit?.();
                    } catch {}
                }
            }
        } catch {}
    };

    const wrapped = function (this: any, type: any, config: any, ...children: any[]) {
        if (config && typeof config === "object") fastRewrite(config);
        return Orig.call(this, type, config, ...children);
    };
    try {
        Object.defineProperty(wrapped, "__seeWrapped", { value: true });
    } catch {}

    let installed = false;
    try {
        React.createElement = wrapped;
        installed = React.createElement === wrapped;
    } catch {}
    if (!installed) {
        try {
            Object.defineProperty(React, "createElement", {
                value: wrapped,
                writable: true,
                configurable: true,
            });
            installed = React.createElement === wrapped;
        } catch {}
    }

    if (!installed) {
        reportError("createElement", "no se pudo instalar (objeto sellado)");
        return null;
    }

    return () => {
        try {
            React.createElement = Orig;
        } catch {}
    };
}
