const API_URL = "http://127.0.0.1:8000/api";

export const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: "POST" });
};

// Solo responde si el backend tiene PERMITIR_LOGIN_DEMO=true.
export const loginDemo = async () => {
    const response = await fetch(`${API_URL}/auth/demo`, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            response.status === 404
                ? "El modo demo no está habilitado en el backend (PERMITIR_LOGIN_DEMO)."
                : data.detail || "No se pudo entrar en modo demo."
        );
    }

    return data;
};

export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Error al iniciar sesión");
    }

    return data;
};