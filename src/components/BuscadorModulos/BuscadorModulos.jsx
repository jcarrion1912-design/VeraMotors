import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../context/authContext";
import { obtenerSeccionesDeRol } from "../../config/navegacion";
import "./BuscadorModulos.css";

const normalizar = (texto) =>
    texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Salto rápido a cualquier módulo visible para el rol (Ctrl+K).
function BuscadorModulos({ onCerrar }) {
    const navigate = useNavigate();
    const { usuarioActual } = useRole();

    const [texto, setTexto] = useState("");
    const [indice, setIndice] = useState(0);
    const inputRef = useRef(null);

    const modulos = useMemo(
        () => obtenerSeccionesDeRol(usuarioActual?.rol || "").flatMap((seccion) =>
            seccion.items.map((item) => ({ ...item, seccion: seccion.titulo }))
        ),
        [usuarioActual?.rol]
    );

    const resultados = useMemo(() => {
        const consulta = normalizar(texto.trim());
        if (!consulta) return modulos;
        return modulos.filter((m) => normalizar(`${m.label} ${m.seccion}`).includes(consulta));
    }, [modulos, texto]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const abrir = (modulo) => {
        onCerrar();
        navigate(modulo.to);
    };

    const alTeclear = (e) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            onCerrar();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndice((i) => Math.min(i + 1, resultados.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndice((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && resultados[indice]) {
            e.preventDefault();
            abrir(resultados[indice]);
        }
    };

    return (
        <div className="buscador-overlay" onMouseDown={onCerrar}>
            <div
                className="buscador"
                role="dialog"
                aria-modal="true"
                aria-label="Buscar módulo"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="buscador-input">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Escribe el nombre de un módulo…"
                        value={texto}
                        onChange={(e) => {
                            setTexto(e.target.value);
                            setIndice(0);
                        }}
                        onKeyDown={alTeclear}
                    />
                    <kbd>Esc</kbd>
                </div>

                {resultados.length > 0 ? (
                    <ul className="buscador-lista" role="listbox" aria-label="Módulos">
                        {resultados.map((modulo, i) => (
                            <li key={modulo.to} role="option" aria-selected={i === indice}>
                                <button
                                    type="button"
                                    className={`buscador-item ${i === indice ? "is-active" : ""}`}
                                    onMouseEnter={() => setIndice(i)}
                                    onClick={() => abrir(modulo)}
                                >
                                    <span className="material-symbols-outlined">{modulo.icon}</span>
                                    <span className="buscador-item-label">{modulo.label}</span>
                                    <span className="buscador-item-seccion">{modulo.seccion}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="vm-empty">
                        <span className="material-symbols-outlined">search_off</span>
                        <span>Ningún módulo coincide con «{texto}».</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BuscadorModulos;
