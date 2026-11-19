export type ExportCell = string | number | null;

export function makeAdminCsv(rows: ExportCell[][]): string {
    const escape = (value: ExportCell) => {
        if (value === null) return "";
        let text = String(value);
        if (typeof value === "string" && /^[\s\uFEFF]*[=+\-@]/.test(text)) text = `'${text}`;
        return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return "\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n");
}
