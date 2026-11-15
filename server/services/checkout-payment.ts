import "server-only";

export function checkoutPaymentQr() {
    const value = process.env.CHECKOUT_PAYMENT_QR_URL?.trim();
    if (!value) return null;
    try {
        const base = "https://checkout.invalid";
        const url = new URL(value, base);
        if (value.startsWith("/") && url.origin === base && !url.pathname.startsWith("//")) return url.pathname + url.search;
        return /^https:\/\//i.test(value) && !url.username && !url.password ? url.href : null;
    } catch {
        return null;
    }
}
