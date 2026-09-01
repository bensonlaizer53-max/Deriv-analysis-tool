// lib/authStore.ts

export interface AppUser {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
    status: "PENDING" | "APPROVED" | "REJECTED";
    isSubscribed: boolean;
    subscriptionPlan?: string;
    subscriptionFee?: string;
    paymentMethod?: string;
    transactionRef?: string;
    paymentScreenshot?: string;
    derivAppId?: string;
    authorizedDomain?: string;
    createdAt: string;
}

const STORAGE_KEY = "deriv_pro_users";
const SESSION_KEY = "deriv_pro_current_user";

const DEFAULT_ADMIN: AppUser = {
    id: "admin-1",
    name: "Super Admin",
    email: "admin@derivpro.com",
    role: "ADMIN",
    status: "APPROVED",
    isSubscribed: true,
    derivAppId: "1089",
    authorizedDomain: "lizytrade.site",
    createdAt: new Date().toISOString(),
};

export const getStoredUsers = (): AppUser[] => {
    if (typeof window === "undefined") return [DEFAULT_ADMIN];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN]));
        return [DEFAULT_ADMIN];
    }
    try {
        return JSON.parse(data);
    } catch {
        return [DEFAULT_ADMIN];
    }
};

export const saveUsers = (users: AppUser[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const getCurrentUser = (): AppUser | null => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};

export const setCurrentUserSession = (user: AppUser | null) => {
    if (typeof window === "undefined") return;
    if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(SESSION_KEY);
    }
};