import "server-only";

function getPromptPayPhone() {
    const phone = process.env.PROMPTPAY_PHONE?.replace(/[\s-]/g, "");
    return phone && /^0\d{9}$/.test(phone) ? phone : null;
}

export function hasCheckoutPromptPay() {
    return getPromptPayPhone() !== null;
}

export function checkoutPaymentQr(total: string) {
    const phone = getPromptPayPhone();
    if (!phone || !/^\d{1,8}(\.\d{1,2})?$/.test(total) || Number(total) <= 0) return null;

    return `https://promptpay.io/${phone}/${Number(total).toFixed(2)}.png`;
}
