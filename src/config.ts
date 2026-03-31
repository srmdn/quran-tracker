export const APP_NAME = process.env.APP_NAME || "Qur'an Tracker";
export const ORG_NAME = process.env.ORG_NAME || "Your Organization";
export const PRODUCT_NAME = process.env.PRODUCT_NAME || "Qur'an Tracker";
export const PUBLIC_BASE_URL = process.env.APP_URL || "http://localhost:3000";

export const GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ||
    `${PUBLIC_BASE_URL}/auth/google/callback`;
