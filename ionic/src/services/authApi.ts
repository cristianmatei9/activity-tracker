
const API_URL = 'http://localhost:3000';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

export interface User {
    id: number;
    username: string;
}

interface LoginResponse {
    token: string;
    user: User;
}

export async function login(
    username: string,
    password: string
): Promise<User> {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
        throw new Error('Invalid username or password');
    }

    const data: LoginResponse = await response.json();

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return data.user;
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): User | null {
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser) as User;
    } catch {
        return null;
    }
}

export function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
    const token = getToken();

    if (!token) return false;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        return typeof payload.exp === 'number' &&
            payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}
