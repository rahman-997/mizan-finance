/** Normalize six-digit OTP inputs typed or pasted in Arabic, Persian, or ASCII. */
export function normalizeOtp(value) {
  return String(value)
    .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[^0-9]/g, "")
    .slice(0, 6);
}
export function isCompleteOtp(value) { return /^[0-9]{6}$/.test(value); }
/** PREVIEW ONLY. Never use a hardcoded OTP to authorize access or payments. */
export function verifyPreviewOtp(value) { return value === "246810"; }
