export const BASE_URL = 'http://127.0.0.1:8000/api';

interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...init } = options;

    let url = `${BASE_URL}${endpoint}`;
    if (params) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
    }

    const token = localStorage.getItem('auth_token');
    const headers = new Headers(init.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
        ...init,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || 'An error occurred');
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json();
}

export const apiClient = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

    put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

    delete: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'DELETE' }),
};
