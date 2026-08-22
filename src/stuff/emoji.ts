import emojiRegexFactory from "emoji-regex";

let cached: RegExp | null = null;
let fallbackMode = false;

function buildRegex(): RegExp {
    try {
        const r = emojiRegexFactory();
        if (r) {
            r.exec("😀");
            return r;
        }
    } catch {}
    fallbackMode = true;
    return new RegExp(
        "(?:"
        + "[\\uD83C\\uDDE6-\\uD83C\\uDDFF]{2}"
        + "|[\\uD83C-\\uD83E][\\uDC00-\\uDFFF](?:[\\uFE0F]|\\uD83C[\\uDFFB-\\uDFFF]|\\u200D[\\uD83C-\\uD83E][\\uDC00-\\uDFFF])*"
        + "|[#*0-9]\\u20E3"
        + "|[\\u00A9\\u00AE\\u203C\\u2049\\u2122\\u2139\\u2194-\\u21AA\\u231A-\\u231B\\u2328\\u23CF\\u23E9-\\u23FA\\u24C2\\u25AA\\u25AB\\u25B6\\u25C0\\u25FB-\\u25FE\\u2600-\\u27BF\\u2934\\u2935\\u2B00-\\u2B55\\u3030\\u303D\\u3297\\u3299]\\uFE0F?"
        + ")",
        "g",
    );
}

export function getEmojiRe(): RegExp {
    if (!cached) cached = buildRegex();
    cached.lastIndex = 0;
    return cached;
}

export function isFallback(): boolean {
    return fallbackMode;
}

export function isEmojiChar(text: string): boolean {
    if (!text) return false;
    const re = getEmojiRe();
    const m = re.exec(text);
    return !!m && m[0] === text && m.index === 0;
}

export function fromCodePoints(cps: string[]): string {
    try {
        return String.fromCodePoint(...cps.map(c => Number.parseInt(c, 16)));
    } catch {
        return "";
    }
}

const HEX_TOKEN = /^[0-9a-f]{1,7}$/i;

const EMOJI_URI_HOSTS = new RegExp(
    "(?:^|//)(?:"
    + "cdn\\.discordapp\\.com/emojis/"
    + "|twemoji\\.maxcdn\\.com/"
    + "|cdn\\.jsdelivr\\.net/(?:gh/jdecked/twemoji@[^/]+/assets/|gh/twitter/twemoji@[^/]+/assets/)"
    + "|cdnjs\\.cloudflare\\.com/ajax/libs/twemoji/"
    + "|abs\\.twimg\\.com/emoji/v2/"
    + ")",
);

export function uriToEmoji(uri: unknown): string | null {
    if (typeof uri !== "string") return null;

    try {
        if (uri.startsWith("asset:/emoji-")) {
            const name = uri.slice("asset:/emoji-".length).replace(/\.(png|webp).*$/i, "");
            const emoji = fromCodePoints(name.split("-"));
            return isEmojiChar(emoji) ? emoji : null;
        }

        const path = uri.split("?")[0];
        if (!EMOJI_URI_HOSTS.test(path)) return null;

        const m = path.match(/([0-9a-f]+(?:-[0-9a-f]+)*)\.(?:png|svg)$/i);
        if (!m) return null;

        const cps = m[1].toLowerCase().split("-");
        if (!cps.every(t => HEX_TOKEN.test(t))) return null;

        const emoji = fromCodePoints(cps);
        return isEmojiChar(emoji) ? emoji : null;
    } catch {
        return null;
    }
}
