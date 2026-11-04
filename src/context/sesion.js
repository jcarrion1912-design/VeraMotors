// Datos visibles del usuario para pintar la interfaz. No contienen credenciales:
// el token vive en una cookie httpOnly que JavaScript no puede leer, y el servidor
// valida permisos en cada petición aunque alguien altere estos datos.
const STORAGE_KEY = "veramotors_usuario";

export const leerSesion = () => {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        const usuario = guardado ? JSON.parse(guardado) : null;

        // Sesiones de la versión anterior: traen el token aquí y hay que descartarlas.
        if (usuario?.access_token) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return usuario;
    } catch {
        return null;
    }
};

export const guardarSesion = (usuario) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    } catch (e) {
        console.error("Error guardando sesión:", e);
    }
};

export const borrarSesion = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Error al cerrar sesión:", e);
    }
};
