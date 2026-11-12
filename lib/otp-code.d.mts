export function normalizeOtp(value: string): string;
export function isCompleteOtp(value: string): boolean;
/** UI preview only; not an authentication mechanism. */
export function verifyPreviewOtp(value: string): boolean;
