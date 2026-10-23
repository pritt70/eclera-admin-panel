// Common helper functions: api, cookies, string utilities

export const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/admin";

export async function api(
    endpoint: string,
    data?: any,
    options: { method?: string; headers?: Record<string, string> } = {}
) {
    try {
        let url = endpoint;
        if (!endpoint.startsWith("http")) {
            if (endpoint.startsWith("/api/admin")) {
                url = `http://localhost:5000${endpoint}`;
            } else if (endpoint.startsWith("api/admin")) {
                url = `http://localhost:5000/${endpoint}`;
            } else if (endpoint.startsWith("/")) {
                url = `${BASE_API_URL}${endpoint}`;
            } else {
                url = `${BASE_API_URL}/${endpoint}`;
            }
        }

        const method = options.method || (data !== undefined ? "POST" : "GET");
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        };

        // Automatically attach admin token from cookie or localStorage
        const token =
            getCookie("admin_token") ||
            (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null);
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
            headers["x-admin-token"] = token;
        }

        const fetchOptions: RequestInit = {
            method,
            headers,
            cache: "no-store",
        };

        if (data !== undefined && method !== "GET" && method !== "HEAD") {
            fetchOptions.body = JSON.stringify(data);
        }

        const response = await fetch(url, fetchOptions);

        const json = await response.json();
        return json;
    } catch (err: any) {
        console.error("API request failed:", err);
        return {
            status: false,
            message: err?.message || "Failed to connect to backend server. Make sure API is running on port 5000.",
        };
    }
}

// Set cookie
export function setCookie(name: string, value: string, days: number = 7) {
    if (typeof document === "undefined") return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Lax";
}

// Get cookie
export function getCookie(name: string) {
    if (typeof document === "undefined") return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

// Delete cookie
export function deleteCookie(name: string) {
    if (typeof document === "undefined") return;
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
}

// Truncate string
export function truncate(str: string, n: number) {
    return str.length > n ? str.slice(0, n) + "..." : str;
}
