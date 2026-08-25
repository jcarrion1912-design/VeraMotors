import { useMemo, useState } from "react";
import "./Asistencia.css";

// Personal del taller (mismo mock usado en la vista de referencia)
const PERSONAL = [
    { id: 1, nombre: "Luis García", cargo: "Técnico Automotriz" },
    { id: 2, nombre: "Pedro Ramírez", cargo: "Técnico Automotriz" },
    { id: 3, nombre: "Jorge Salazar", cargo: "Técnico Automotriz" },
    { id: 4, nombre: "Ana Martínez", cargo: "Asesora de Servicio" },
    { id: 5, nombre: "Carlos Vega", cargo: "Asesor de Repuestos" },
    { id: 6, nombre: "María López", cargo: "Administración" },
];

const ESTADOS = ["Sin Registrar", "Presente", "Tardanza", "Ausente", "Permiso"];

function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}

function sumarDias(fechaISO, dias) {
    const d = new Date(fechaISO + "T00:00:00");
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
}

function horaActual() {
    const d = new Date();
    return d.toTimeString().slice(0, 5);
}

// Clasifica Presente/Tardanza según hora de ingreso vs. la regla configurada
function clasificarPorHora(horaEntrada, horaLimite, toleranciaMin) {
    if (!horaEntrada) return "Sin Registrar";
    const [hE, mE] = horaEntrada.split(":").map(Number);
    const [hL, mL] = horaLimite.split(":").map(Number);
    const minutosEntrada = hE * 60 + mE;
    const minutosLimite = hL * 60 + mL + Number(toleranciaMin);
    return minutosEntrada > minutosLimite ? "Tardanza" : "Presente";
}

function Asistencia() {
    const [fecha, setFecha] = useState(hoyISO());
    const [busqueda, setBusqueda] = useState("");
    const [cargoFiltro, setCargoFiltro] = useState("Todos");

    // Regla de tardanza, editable (responde a la pregunta abierta del anexo)
    const [horaLimite, setHoraLimite] = useState("08:00");
    const [tolerancia, setTolerancia] = useState(15);
    const [editandoRegla, setEditandoRegla] = useState(false);

    // registros[fecha][personalId] = { estado, horaEntrada, horaSalida, observaciones, registradoA }
    const [registros, setRegistros] = useState({});
    const [ultimoSnapshot, setUltimoSnapshot] = useState(null);
    const [detalle, setDetalle] = useState(null);

    const registrosDelDia = registros[fecha] || {};

    const getRegistro = (id) =>
        registrosDelDia[id] || { estado: "Sin Registrar", horaEntrada: "", horaSalida: "", observaciones: "", registradoA: null };

    const actualizarRegistro = (id, cambios) => {
        setRegistros((prev) => {
            const delDia = prev[fecha] || {};
            const actual = delDia[id] || { estado: "Sin Registrar", horaEntrada: "", horaSalida: "", observaciones: "", registradoA: null };
            const nuevo = { ...actual, ...cambios, registradoA: horaActual() };
            return { ...prev, [fecha]: { ...delDia, [id]: nuevo } };
        });
    };

    const cambiarHoraEntrada = (id, horaEntrada) => {
        const registro = getRegistro(id);
        // Auto-clasifica solo si el estado no fue forzado manualmente a Ausente/Permiso
        const estadoSugerido =
            registro.estado === "Ausente" || registro.estado === "Permiso"
                ? registro.estado
                : clasificarPorHora(horaEntrada, horaLimite, tolerancia);
        actualizarRegistro(id, { horaEntrada, estado: estadoSugerido });
    };

    const marcarVisiblesPresente = () => {
        setUltimoSnapshot(registros);
        setRegistros((prev) => {
            const delDia = { ...(prev[fecha] || {}) };
            personalFiltrado.forEach((p) => {
                const actual = delDia[p.id];
                if (!actual || actual.estado === "Sin Registrar") {
                    delDia[p.id] = {
                        estado: "Presente",
                        horaEntrada: horaLimite,
                        horaSalida: "17:00",
                        observaciones: "",
                        registradoA: horaActual(),
                    };
                }
            });
            return { ...prev, [fecha]: delDia };
        });
    };

    const deshacer = () => {
        if (ultimoSnapshot) {
            setRegistros(ultimoSnapshot);
            setUltimoSnapshot(null);
        }
    };

    const personalFiltrado = useMemo(() => {
        return PERSONAL.filter((p) => {
            const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const coincideCargo = cargoFiltro === "Todos" || p.cargo === cargoFiltro;
            return coincideBusqueda && coincideCargo;
        });
    }, [busqueda, cargoFiltro]);

    const kpis = useMemo(() => {
        const base = { total: PERSONAL.length, presentes: 0, tardanzas: 0, ausentes: 0, permisos: 0, sinRegistrar: 0 };
        PERSONAL.forEach((p) => {
            const r = getRegistro(p.id);
            if (r.estado === "Presente") base.presentes++;
            else if (r.estado === "Tardanza") base.tardanzas++;
            else if (r.estado === "Ausente") base.ausentes++;
            else if (r.estado === "Permiso") base.permisos++;
            else base.sinRegistrar++;
        });
        return base;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registrosDelDia]);

    const cargos = ["Todos", ...new Set(PERSONAL.map((p) => p.cargo))];

    return (
        <div className="asistencia-page">

            {/* CABECERA */}
            <div className="asistencia-header">
                <div>
                    <h2>Control de Asistencia</h2>
                    <p>Registro de entrada, salida y tardanzas del personal de VeraMotors SAC (RRHH).</p>
                </div>
            </div>

            {/* NAVEGADOR DE FECHA */}
            <div className="asistencia-toolbar">
                <div className="fecha-nav">
                    <button className="btn-nav" onClick={() => setFecha(sumarDias(fecha, -1))}>‹</button>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                    <button className="btn-nav" onClick={() => setFecha(sumarDias(fecha, 1))}>›</button>
                    <button className="btn-hoy" onClick={() => setFecha(hoyISO())}>Hoy</button>
                </div>

                <div className="regla-tardanza">
                    <span className="material-symbols-outlined">schedule</span>
                    {editandoRegla ? (
                        <>
                            <span>Hora límite:</span>
                            <input type="time" value={horaLimite} onChange={(e) => setHoraLimite(e.target.value)} />
                            <span>Tolerancia:</span>
                            <input
                                type="number"
                                min="0"
                                style={{ width: "56px" }}
                                value={tolerancia}
                                onChange={(e) => setTolerancia(e.target.value)}
                            />
                            <span>min</span>
                            <button className="btn-act-table link" onClick={() => setEditandoRegla(false)}>Listo</button>
                        </>
                    ) : (
                        <>
                            <span>
                                Regla de tardanza: ingreso después de <strong>{horaLimite}</strong> + <strong>{tolerancia} min</strong> de tolerancia
                            </span>
                            <button className="btn-act-table link" onClick={() => setEditandoRegla(true)}>✏️ Editar</button>
                        </>
                    )}
                </div>

                <div className="acciones-masivas">
                    <button className="btn-act-table diag" onClick={marcarVisiblesPresente}>
                        ✓ Marcar visibles como Presente
                    </button>
                    <button className="btn-act-table" onClick={deshacer} disabled={!ultimoSnapshot}>
                        ↩ Deshacer
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="stats-grid asistencia-kpis">
                <div className="stat-card">
                    <div className="stat-card-top"><span>Total Personal</span></div>
                    <div className="stat-value">{kpis.total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top"><span>Presentes</span></div>
                    <div className="stat-value" style={{ color: "#16a34a" }}>{kpis.presentes}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top"><span>Tardanzas</span></div>
                    <div className="stat-value" style={{ color: "#d97706" }}>{kpis.tardanzas}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top"><span>Ausentes</span></div>
                    <div className="stat-value" style={{ color: "#dc2626" }}>{kpis.ausentes}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top"><span>Permisos</span></div>
                    <div className="stat-value" style={{ color: "#2563eb" }}>{kpis.permisos}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top"><span>Sin Registrar</span></div>
                    <div className="stat-value" style={{ color: "#64748b" }}>{kpis.sinRegistrar}</div>
                </div>
            </div>

            {/* FILTROS */}
            <div className="os-filter-bar" style={{ marginBottom: "16px" }}>
                <div className="filter-search">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        type="text"
                        placeholder="Buscar trabajador..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                <select value={cargoFiltro} onChange={(e) => setCargoFiltro(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    {cargos.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* TABLA */}
            <div className="os-table-wrapper">
                <table className="os-table">
                    <thead>
                        <tr>
                            <th>Trabajador</th>
                            <th>Cargo</th>
                            <th>Hora Entrada</th>
                            <th>Hora Salida</th>
                            <th>Estado</th>
                            <th>Observaciones</th>
                            <th>Trazabilidad</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {personalFiltrado.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
                                    No se encontraron trabajadores.
                                </td>
                            </tr>
                        ) : (
                            personalFiltrado.map((p) => {
                                const r = getRegistro(p.id);
                                return (
                                    <tr key={p.id}>
                                        <td><strong>{p.nombre}</strong></td>
                                        <td>{p.cargo}</td>
                                        <td>
                                            <input
                                                type="time"
                                                value={r.horaEntrada}
                                                onChange={(e) => cambiarHoraEntrada(p.id, e.target.value)}
                                                className="input-hora"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="time"
                                                value={r.horaSalida}
                                                onChange={(e) => actualizarRegistro(p.id, { horaSalida: e.target.value })}
                                                className="input-hora"
                                            />
                                        </td>
                                        <td>
                                            <select
                                                value={r.estado}
                                                onChange={(e) => actualizarRegistro(p.id, { estado: e.target.value })}
                                                className={`select-estado estado${r.estado.replace(" ", "")}`}
                                            >
                                                {ESTADOS.map((estado) => (
                                                    <option key={estado} value={estado}>{estado}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                placeholder={r.estado === "Ausente" || r.estado === "Permiso" ? "Motivo (obligatorio)..." : "Opcional..."}
                                                value={r.observaciones}
                                                onChange={(e) => actualizarRegistro(p.id, { observaciones: e.target.value })}
                                                className="input-observaciones"
                                            />
                                        </td>
                                        <td className="trazabilidad">
                                            {r.registradoA ? `Registrado a las ${r.registradoA}` : "Por registrar"}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn-act-table link" onClick={() => setDetalle({ p, r })}>🔍 Ver Detalle</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DETALLE */}
            {detalle && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "480px" }}>
                        <div className="modal-header">
                            <div>
                                <h2>{detalle.p.nombre}</h2>
                                <p>{detalle.p.cargo} — {fecha}</p>
                            </div>
                            <button className="btn-close" onClick={() => setDetalle(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Estado:</strong> {detalle.r.estado}</p>
                            <p><strong>Hora de entrada:</strong> {detalle.r.horaEntrada || "—"}</p>
                            <p><strong>Hora de salida:</strong> {detalle.r.horaSalida || "—"}</p>
                            <p><strong>Observaciones:</strong> {detalle.r.observaciones || "—"}</p>
                            <p><strong>Último registro:</strong> {detalle.r.registradoA ? `hoy a las ${detalle.r.registradoA}` : "Sin registrar aún"}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancelar" onClick={() => setDetalle(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Asistencia;
