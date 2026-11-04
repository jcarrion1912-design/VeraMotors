import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/Header";
import "./MainLayout.css";

const CLAVE_COLAPSO = "veramotors_sidebar_colapsado";

const leerColapso = () => {
    try {
        return localStorage.getItem(CLAVE_COLAPSO) === "1";
    } catch {
        return false;
    }
};

function MainLayout() {
    const [colapsado, setColapsado] = useState(leerColapso);
    const [abiertoMovil, setAbiertoMovil] = useState(false);

    const alternarColapso = () => {
        setColapsado((actual) => {
            try {
                localStorage.setItem(CLAVE_COLAPSO, actual ? "0" : "1");
            } catch {
                // Sin almacenamiento el menú igual funciona; solo no recuerda el estado.
            }
            return !actual;
        });
    };

    useEffect(() => {
        if (!abiertoMovil) return undefined;
        const alTeclear = (e) => {
            if (e.key === "Escape") setAbiertoMovil(false);
        };
        document.addEventListener("keydown", alTeclear);
        return () => document.removeEventListener("keydown", alTeclear);
    }, [abiertoMovil]);

    return (
        <div className={`main-layout ${colapsado ? "is-collapsed" : ""}`}>

            <Sidebar
                colapsado={colapsado}
                abiertoMovil={abiertoMovil}
                alternarColapso={alternarColapso}
                cerrarMovil={() => setAbiertoMovil(false)}
            />

            {abiertoMovil && (
                <div className="sidebar-backdrop" onClick={() => setAbiertoMovil(false)} />
            )}

            <div className="main-content">

                <Header abrirMenuMovil={() => setAbiertoMovil(true)} />

                <main className="page-content">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}

export default MainLayout;
