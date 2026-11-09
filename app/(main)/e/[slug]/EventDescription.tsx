import "server-only";
import sanitizeHtml from "sanitize-html";

const richTextStyles = [
    "min-w-0 text-base leading-[1.95] text-foreground wrap-anywhere [&>:first-child]:mt-0 [&>:last-child]:mb-0",
    "[&_p]:mb-5 [&_p]:whitespace-pre-wrap [&_div]:mb-5",
    "[&_:is(h2,h3,h4,h5,h6)]:mt-8 [&_:is(h2,h3,h4,h5,h6)]:mb-3 [&_:is(h2,h3,h4,h5,h6)]:font-semibold [&_:is(h2,h3,h4,h5,h6)]:leading-normal",
    "[&_h2]:text-2xl [&_h3]:text-xl [&_strong]:font-semibold [&_b]:font-semibold",
    "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5 [&_li]:pl-1",
    "[&_blockquote]:my-7 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:py-2 [&_blockquote]:pl-5 [&_blockquote]:text-muted-foreground",
    "[&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-brand",
    "[&_img]:my-6 [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_figure]:my-7 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground",
    "[&_hr]:my-8 [&_hr]:border-border [&_table]:my-6 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm",
    "[&_th]:min-w-28 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold",
    "[&_td]:min-w-28 [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:text-left",
    "[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm [&_code]:rounded [&_code]:bg-muted [&_code]:px-1",
].join(" ");

export default function EventDescription({ html }: { html: string }) {
    if (!html.trim()) return <p className="text-sm text-muted-foreground">ไม่มีรายละเอียด</p>;
    const cleanHtml = sanitizeHtml(html, {
        allowedTags: ["p", "br", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "del", "blockquote", "ul", "ol", "li", "a", "img", "figure", "figcaption", "hr", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "pre", "code", "span", "div", "sub", "sup"],
        allowedAttributes: { "*": ["style"], a: ["href", "title", "rel"], img: ["src", "alt", "title", "loading"], th: ["colspan", "rowspan", "scope"], td: ["colspan", "rowspan"], ol: ["start"] },
        allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
        allowedSchemes: ["https", "http", "mailto", "tel"],
        allowedSchemesByTag: { img: ["https", "http"] },
        allowProtocolRelative: false,
        transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }), img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }) },
    });
    return <div className={richTextStyles} dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
