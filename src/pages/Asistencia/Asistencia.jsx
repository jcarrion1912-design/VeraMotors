import { useEffect, useMemo, useState } from "react";
import "./Asistencia.css";

import {
    obtenerAsistencias,
    marcarEntrada,
    marcarSalida,
    actualizarAsistencia
} from "../../services/asistenciaService";


// ======================================================
// ESTADOS VISUALES
// ======================================================

const ESTADOS = [
    "Sin Registrar",
    "Presente",
    "Tardanza",
    "Ausente",
    "Permiso"
];


// ======================================================
// FECHA ACTUAL
// ======================================================

function hoyISO() {
    const ahora = new Date();

    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, "0");
    const day = String(ahora.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ======================================================
// SUMAR / RESTAR DÍAS
// ======================================================

function sumarDias(fechaISO, dias) {

    const [year, month, day] = fechaISO
        .split("-")
        .map(Number);

    const d = new Date(
        year,
        month - 1,
        day
    );

    d.setDate(d.getDate() + dias);

    const nuevoYear = d.getFullYear();
    const nuevoMonth = String(
        d.getMonth() + 1
    ).padStart(2, "0");
    const nuevoDay = String(
        d.getDate()
    ).padStart(2, "0");

    return `${nuevoYear}-${nuevoMonth}-${nuevoDay}`;
}


// ======================================================
// HORA ACTUAL
// ======================================================

function horaActual() {

    const d = new Date();

    return d
        .toTimeString()
        .slice(0, 5);
}


// ======================================================
// CLASIFICAR TARDANZA
// ======================================================

function clasificarPorHora(
    horaEntrada,
    horaLimite,
    toleranciaMin
) {

    if (!horaEntrada) {
        return "Presente";
    }

    const [hE, mE] = horaEntrada
        .split(":")
        .map(Number);

    const [hL, mL] = horaLimite
        .split(":")
        .map(Number);

    const minutosEntrada =
        hE * 60 + mE;

    const minutosLimite =
        hL * 60 +
        mL +
        Number(toleranciaMin);

    return minutosEntrada > minutosLimite
        ? "Tardanza"
        : "Presente";
}


// ======================================================
// COMPONENTE
// ======================================================

function Asistencia() {

    const [fecha, setFecha] =
        useState(hoyISO());

    const [busqueda, setBusqueda] =
        useState("");

    const [cargoFiltro, setCargoFiltro] =
        useState("Todos");


    // ==================================================
    // REGLA DE TARDANZA
    // ==================================================

    const [horaLimite, setHoraLimite] =
        useState("08:00");

    const [tolerancia, setTolerancia] =
        useState(15);

    const [editandoRegla, setEditandoRegla] =
        useState(false);


    // ==================================================
    // DATOS DE API
    // ==================================================

    const [asistenciasAPI, setAsistenciasAPI] =
        useState([]);

    const [cargando, setCargando] =
        useState(true);

    const [errorAPI, setErrorAPI] =
        useState("");


    // ==================================================
    // OTROS ESTADOS
    // ==================================================

    const [detalle, setDetalle] =
        useState(null);

    const [ultimoSnapshot, setUltimoSnapshot] =
        useState(null);

    const [procesando, setProcesando] =
        useState({});


    // ==================================================
    // CARGAR ASISTENCIAS
    // ==================================================

    const cargarAsistencias = async () => {

        try {

            setCargando(true);
            setErrorAPI("");

            const datos =
                await obtenerAsistencias();

            console.log(
                "Asistencias recibidas:",
                datos
            );

            setAsistenciasAPI(
                Array.isArray(datos)
                    ? datos
                    : []
            );

        } catch (error) {

            console.error(
                "Error al cargar asistencias:",
                error
            );

            setErrorAPI(
                error.message ||
                "Error al cargar las asistencias."
            );

        } finally {

            setCargando(false);

        }
    };


    // ==================================================
    // CARGAR AL INICIAR
    // ==================================================

    useEffect(() => {

        cargarAsistencias();

    }, []);


    // ==================================================
    // OBTENER PERSONAL
    // ==================================================

    const PERSONAL = useMemo(() => {

        const usuarios = new Map();

        asistenciasAPI.forEach((a) => {

            if (!usuarios.has(a.user_id)) {

                usuarios.set(
                    a.user_id,
                    {
                        id: a.user_id,

                        nombre:
                            a.nombre_usuario ||
                            `Usuario ${a.user_id}`,

                        cargo:
                            a.rol_usuario ||
                            "Sin cargo"
                    }
                );

            }

        });

        return Array.from(
            usuarios.values()
        );

    }, [asistenciasAPI]);


    // ==================================================
    // OBTENER REGISTRO SEGÚN FECHA
    // ==================================================

    const getRegistroAPI = (userId) => {

        const asistencia =
            asistenciasAPI.find(
                (a) =>
                    Number(a.user_id) ===
                    Number(userId) &&
                    String(a.fecha).slice(0, 10) ===
                    fecha
            );


        // ----------------------------------------------
        // SIN REGISTRO
        // ----------------------------------------------

        if (!asistencia) {

            return {

                asistencia_id: null,

                estado:
                    "Sin Registrar",

                horaEntrada: "",

                horaSalida: "",

                observaciones: "",

                registradoA: null
            };
        }


        // ----------------------------------------------
        // CONVERTIR HORA
        // ----------------------------------------------

        const convertirHora = (valor) => {

            if (!valor) {
                return "";
            }

            try {

                const fechaHora =
                    new Date(valor);

                if (
                    Number.isNaN(
                        fechaHora.getTime()
                    )
                ) {
                    return "";
                }

                return fechaHora
                    .toTimeString()
                    .slice(0, 5);

            } catch {

                return "";
            }
        };


        // ----------------------------------------------
        // ESTADO
        // ----------------------------------------------

        let estadoVisual =
            asistencia.estado;

        if (
            asistencia.estado ===
            "Puntual"
        ) {

            estadoVisual =
                "Presente";

        } else if (
            asistencia.estado ===
            "Falta Justificada"
        ) {

            estadoVisual =
                "Permiso";

        } else if (
            asistencia.estado ===
            "Inasistencia"
        ) {

            estadoVisual =
                "Ausente";
        }


        // ----------------------------------------------
        // RETORNAR
        // ----------------------------------------------

        return {

            asistencia_id:
                asistencia.asistencia_id,

            estado:
                estadoVisual,

            horaEntrada:
                convertirHora(
                    asistencia.hora_entrada
                ),

            horaSalida:
                convertirHora(
                    asistencia.hora_salida
                ),

            observaciones:
                asistencia.observaciones ||
                "",

            registradoA:
                convertirHora(
                    asistencia.hora_entrada
                )
        };
    };


    // ==================================================
    // PERSONAL FILTRADO
    // ==================================================

    const personalFiltrado = useMemo(() => {

        return PERSONAL.filter((p) => {

            const coincideBusqueda =
                p.nombre
                    .toLowerCase()
                    .includes(
                        busqueda.toLowerCase()
                    );

            const coincideCargo =
                cargoFiltro === "Todos" ||
                p.cargo === cargoFiltro;

            return (
                coincideBusqueda &&
                coincideCargo
            );
        });

    }, [
        PERSONAL,
        busqueda,
        cargoFiltro
    ]);


    // ==================================================
    // KPIs
    // ==================================================

    const kpis = useMemo(() => {

        const base = {

            total:
                PERSONAL.length,

            presentes: 0,

            tardanzas: 0,

            ausentes: 0,

            permisos: 0,

            sinRegistrar: 0
        };


        PERSONAL.forEach((p) => {

            const r =
                getRegistroAPI(p.id);


            if (
                r.estado ===
                "Presente"
            ) {

                base.presentes++;

            } else if (
                r.estado ===
                "Tardanza"
            ) {

                base.tardanzas++;

            } else if (
                r.estado ===
                "Ausente"
            ) {

                base.ausentes++;

            } else if (
                r.estado ===
                "Permiso"
            ) {

                base.permisos++;

            } else {

                base.sinRegistrar++;
            }

        });

        return base;

    }, [
        PERSONAL,
        asistenciasAPI,
        fecha
    ]);


    // ==================================================
    // CARGOS
    // ==================================================

    const cargos = [
        "Todos",
        ...new Set(
            PERSONAL.map(
                (p) => p.cargo
            )
        )
    ];


    // ==================================================
    // REGISTRAR ENTRADA
    // ==================================================

    const registrarEntrada = async (p) => {

        const registro =
            getRegistroAPI(p.id);


        if (registro.asistencia_id) {

            alert(
                "El usuario ya registró su entrada para esta fecha."
            );

            return;
        }


        try {

            setProcesando((prev) => ({
                ...prev,
                [p.id]: true
            }));

            setErrorAPI("");


            const hora =
                horaActual();


            const respuesta =
                await marcarEntrada(
                    p.id,
                    fecha,
                    registro.observaciones
                );


            console.log(
                "Entrada registrada:",
                respuesta
            );


            setAsistenciasAPI((prev) => {

                const nuevaAsistencia = {

                    ...respuesta,

                    nombre_usuario:
                        p.nombre,

                    rol_usuario:
                        p.cargo
                };


                return [
                    ...prev,
                    nuevaAsistencia
                ];
            });


        } catch (error) {

            console.error(
                "Error al registrar entrada:",
                error
            );

            alert(
                error.message ||
                "No se pudo registrar la entrada."
            );

        } finally {

            setProcesando((prev) => ({
                ...prev,
                [p.id]: false
            }));
        }
    };


    // ==================================================
    // REGISTRAR SALIDA
    // ==================================================

    const registrarSalida = async (p) => {

        const registro =
            getRegistroAPI(p.id);


        if (!registro.asistencia_id) {

            alert(
                "Primero debes registrar la entrada."
            );

            return;
        }


        if (registro.horaSalida) {

            alert(
                "La salida ya fue registrada."
            );

            return;
        }


        try {

            setProcesando((prev) => ({
                ...prev,
                [p.id]: true
            }));

            setErrorAPI("");


            const respuesta =
                await marcarSalida(
                    registro.asistencia_id,
                    registro.observaciones
                );


            console.log(
                "Salida registrada:",
                respuesta
            );


            setAsistenciasAPI((prev) =>
                prev.map((a) => {

                    if (
                        Number(
                            a.asistencia_id
                        ) ===
                        Number(
                            registro.asistencia_id
                        )
                    ) {

                        return {

                            ...a,

                            ...respuesta,

                            nombre_usuario:
                                a.nombre_usuario ||
                                p.nombre,

                            rol_usuario:
                                a.rol_usuario ||
                                p.cargo
                        };
                    }

                    return a;
                })
            );


        } catch (error) {

            console.error(
                "Error al registrar salida:",
                error
            );

            alert(
                error.message ||
                "No se pudo registrar la salida."
            );

        } finally {

            setProcesando((prev) => ({
                ...prev,
                [p.id]: false
            }));
        }
    };


    // ==================================================
    // ACTUALIZAR ASISTENCIA
    // ==================================================

    const actualizarRegistro = async (
        p,
        cambios
    ) => {

        const registro =
            getRegistroAPI(p.id);


        if (!registro.asistencia_id) {

            alert(
                "Primero debes registrar la entrada."
            );

            return;
        }


        try {

            setProcesando((prev) => ({
                ...prev,
                [p.id]: true
            }));

            setErrorAPI("");


            const datosActualizacion = {

                hora_entrada:
                    cambios.hora_entrada !== undefined
                        ? cambios.hora_entrada
                        : registro.horaEntrada || null,

                hora_salida:
                    cambios.hora_salida !== undefined
                        ? cambios.hora_salida
                        : registro.horaSalida || null,

                estado:
                    cambios.estado !== undefined
                        ? cambios.estado
                        : convertirEstadoBackend(
                            registro.estado
                        ),

                observaciones:
                    cambios.observaciones !== undefined
                        ? cambios.observaciones
                        : registro.observaciones || ""
            };


            console.log(
                "Actualizando asistencia:",
                registro.asistencia_id,
                datosActualizacion
            );


            const respuesta =
                await actualizarAsistencia(
                    registro.asistencia_id,
                    datosActualizacion
                );


            console.log(
                "Asistencia actualizada:",
                respuesta
            );


            setAsistenciasAPI((prev) =>
                prev.map((a) => {

                    if (
                        Number(
                            a.asistencia_id
                        ) ===
                        Number(
                            registro.asistencia_id
                        )
                    ) {

                        return {

                            ...a,

                            ...respuesta,

                            nombre_usuario:
                                a.nombre_usuario ||
                                p.nombre,

                            rol_usuario:
                                a.rol_usuario ||
                                p.cargo
                        };
                    }

                    return a;
                })
            );


        } catch (error) {

            console.error(
                "Error actualizando asistencia:",
                error
            );

            alert(
                error.message ||
                "No se pudo actualizar la asistencia."
            );

        } finally {

            setProcesando((prev) => ({
                ...prev,
                [p.id]: false
            }));
        }
    };


    // ==================================================
    // CONVERTIR ESTADO VISUAL → BACKEND
    // ==================================================

    function convertirEstadoBackend(
        estado
    ) {

        switch (estado) {

            case "Presente":
                return "Puntual";

            case "Tardanza":
                return "Tardanza";

            case "Ausente":
                return "Inasistencia";

            case "Permiso":
                return "Falta Justificada";

            case "Puntual":
                return "Puntual";

            case "Inasistencia":
                return "Inasistencia";

            case "Falta Justificada":
                return "Falta Justificada";

            default:
                return "Puntual";
        }
    }


    // ==================================================
    // CAMBIAR HORA ENTRADA
    // ==================================================

    const cambiarHoraEntrada = async (
        p,
        horaEntrada
    ) => {

        if (!horaEntrada) {
            return;
        }


        const registro =
            getRegistroAPI(p.id);


        // Si no existe registro,
        // creamos uno.
        if (!registro.asistencia_id) {

            await registrarEntrada(p);

            return;
        }


        await actualizarRegistro(
            p,
            {
                hora_entrada:
                    horaEntrada
            }
        );
    };


    // ==================================================
    // CAMBIAR HORA SALIDA
    // ==================================================

    const cambiarHoraSalida = async (
        p,
        horaSalida
    ) => {

        if (!horaSalida) {
            return;
        }


        const registro =
            getRegistroAPI(p.id);


        if (!registro.asistencia_id) {

            alert(
                "Primero debes registrar la entrada."
            );

            return;
        }


        await actualizarRegistro(
            p,
            {
                hora_salida:
                    horaSalida
            }
        );
    };


    // ==================================================
    // CAMBIAR ESTADO
    // ==================================================

    const cambiarEstado = async (
        p,
        nuevoEstado
    ) => {

        const registro =
            getRegistroAPI(p.id);


        if (!registro.asistencia_id) {

            alert(
                "Primero debes registrar la entrada."
            );

            return;
        }


        const estadoBackend =
            convertirEstadoBackend(
                nuevoEstado
            );


        await actualizarRegistro(
            p,
            {
                estado:
                    estadoBackend
            }
        );
    };


    // ==================================================
    // CAMBIAR OBSERVACIONES
    // ==================================================

    const cambiarObservaciones = async (
        p,
        observaciones
    ) => {

        const registro =
            getRegistroAPI(p.id);


        if (!registro.asistencia_id) {

            return;
        }


        await actualizarRegistro(
            p,
            {
                observaciones:
                    observaciones
            }
        );
    };


    // ==================================================
    // MARCAR VISIBLES COMO PRESENTE
    // ==================================================

    const marcarVisiblesPresente =
        async () => {

            const snapshot =
                [...asistenciasAPI];

            setUltimoSnapshot(
                snapshot
            );


            for (
                const p of personalFiltrado
            ) {

                const registro =
                    getRegistroAPI(p.id);


                if (
                    !registro.asistencia_id
                ) {

                    try {

                        setProcesando(
                            (prev) => ({
                                ...prev,
                                [p.id]: true
                            })
                        );


                        const respuesta =
                            await marcarEntrada(
                                p.id,
                                fecha,
                                ""
                            );


                        setAsistenciasAPI(
                            (prev) => [
                                ...prev,

                                {
                                    ...respuesta,

                                    nombre_usuario:
                                        p.nombre,

                                    rol_usuario:
                                        p.cargo
                                }
                            ]
                        );


                    } catch (error) {

                        console.error(
                            `Error registrando a ${p.nombre}:`,
                            error
                        );

                    } finally {

                        setProcesando(
                            (prev) => ({
                                ...prev,
                                [p.id]: false
                            })
                        );
                    }
                }
            }
        };


    // ==================================================
    // DESHACER
    // ==================================================

    const deshacer = () => {

        if (ultimoSnapshot) {

            setAsistenciasAPI(
                ultimoSnapshot
            );

            setUltimoSnapshot(
                null
            );
        }
    };


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div className="asistencia-page">


            {/* ==================================================
                CABECERA
            ================================================== */}

            <div className="asistencia-header">

                <div>

                    <h2>
                        Control de Asistencia
                    </h2>

                    <p>
                        Registro de entrada, salida y tardanzas del personal de VeraMotors SAC (RRHH).
                    </p>

                </div>

            </div>


            {/* ==================================================
                NAVEGADOR DE FECHA
            ================================================== */}

            <div className="asistencia-toolbar">

                <div className="fecha-nav">

                    <button
                        className="btn-nav"
                        onClick={() =>
                            setFecha(
                                sumarDias(
                                    fecha,
                                    -1
                                )
                            )
                        }
                    >
                        ‹
                    </button>


                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) =>
                            setFecha(
                                e.target.value
                            )
                        }
                    />


                    <button
                        className="btn-nav"
                        onClick={() =>
                            setFecha(
                                sumarDias(
                                    fecha,
                                    1
                                )
                            )
                        }
                    >
                        ›
                    </button>


                    <button
                        className="btn-hoy"
                        onClick={() =>
                            setFecha(
                                hoyISO()
                            )
                        }
                    >
                        Hoy
                    </button>

                </div>


                {/* REGLA DE TARDANZA */}

                <div className="regla-tardanza">

                    <span className="material-symbols-outlined">
                        schedule
                    </span>


                    {editandoRegla ? (

                        <>

                            <span>
                                Hora límite:
                            </span>


                            <input
                                type="time"
                                value={
                                    horaLimite
                                }
                                onChange={(e) =>
                                    setHoraLimite(
                                        e.target.value
                                    )
                                }
                            />


                            <span>
                                Tolerancia:
                            </span>


                            <input
                                type="number"
                                min="0"
                                style={{
                                    width: "56px"
                                }}
                                value={
                                    tolerancia
                                }
                                onChange={(e) =>
                                    setTolerancia(
                                        e.target.value
                                    )
                                }
                            />


                            <span>
                                min
                            </span>


                            <button
                                className="btn-act-table link"
                                onClick={() =>
                                    setEditandoRegla(
                                        false
                                    )
                                }
                            >
                                Listo
                            </button>

                        </>

                    ) : (

                        <>

                            <span>

                                Regla de tardanza:
                                ingreso después de{" "}

                                <strong>
                                    {horaLimite}
                                </strong>{" "}

                                +{" "}

                                <strong>
                                    {tolerancia}
                                </strong>{" "}

                                min de tolerancia

                            </span>


                            <button
                                className="btn-act-table link"
                                onClick={() =>
                                    setEditandoRegla(
                                        true
                                    )
                                }
                            >
                                ✏️ Editar
                            </button>

                        </>

                    )}

                </div>


                {/* ACCIONES MASIVAS */}

                <div className="acciones-masivas">

                    <button
                        className="btn-act-table diag"
                        onClick={
                            marcarVisiblesPresente
                        }
                    >
                        ✓ Marcar visibles como Presente
                    </button>


                    <button
                        className="btn-act-table"
                        onClick={deshacer}
                        disabled={
                            !ultimoSnapshot
                        }
                    >
                        ↩ Deshacer
                    </button>

                </div>

            </div>


            {/* ==================================================
                KPIs
            ================================================== */}

            <div className="stats-grid asistencia-kpis">


                <div className="stat-card">

                    <div className="stat-card-top">
                        <span>
                            Total Personal
                        </span>
                    </div>

                    <div className="stat-value">
                        {kpis.total}
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-card-top">
                        <span>
                            Presentes
                        </span>
                    </div>

                    <div
                        className="stat-value"
                        style={{
                            color: "#16a34a"
                        }}
                    >
                        {kpis.presentes}
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-card-top">
                        <span>
                            Tardanzas
                        </span>
                    </div>

                    <div
                        className="stat-value"
                        style={{
                            color: "#d97706"
                        }}
                    >
                        {kpis.tardanzas}
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-card-top">
                        <span>
                            Ausentes
                        </span>
                    </div>

                    <div
                        className="stat-value"
                        style={{
                            color: "#dc2626"
                        }}
                    >
                        {kpis.ausentes}
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-card-top">
                        <span>
                            Permisos
                        </span>
                    </div>

                    <div
                        className="stat-value"
                        style={{
                            color: "#2563eb"
                        }}
                    >
                        {kpis.permisos}
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-card-top">
                        <span>
                            Sin Registrar
                        </span>
                    </div>

                    <div
                        className="stat-value"
                        style={{
                            color: "#64748b"
                        }}
                    >
                        {kpis.sinRegistrar}
                    </div>

                </div>

            </div>


            {/* ==================================================
                FILTROS
            ================================================== */}

            <div
                className="os-filter-bar"
                style={{
                    marginBottom: "16px"
                }}
            >

                <div className="filter-search">

                    <span className="material-symbols-outlined">
                        search
                    </span>


                    <input
                        type="text"
                        placeholder="Buscar trabajador..."
                        value={
                            busqueda
                        }
                        onChange={(e) =>
                            setBusqueda(
                                e.target.value
                            )
                        }
                    />

                </div>


                <select
                    value={
                        cargoFiltro
                    }
                    onChange={(e) =>
                        setCargoFiltro(
                            e.target.value
                        )
                    }
                    style={{
                        padding:
                            "8px 12px",

                        borderRadius:
                            "6px",

                        border:
                            "1px solid #cbd5e1"
                    }}
                >

                    {cargos.map((c) => (

                        <option
                            key={c}
                            value={c}
                        >
                            {c}
                        </option>

                    ))}

                </select>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {errorAPI && (

                <div
                    style={{
                        padding: "12px",
                        marginBottom: "16px",
                        color: "#dc2626",
                        background: "#fee2e2",
                        borderRadius: "6px"
                    }}
                >
                    {errorAPI}
                </div>

            )}


            {/* ==================================================
                TABLA
            ================================================== */}

            <div className="os-table-wrapper">

                <table className="os-table">

                    <thead>

                        <tr>

                            <th>
                                Trabajador
                            </th>

                            <th>
                                Cargo
                            </th>

                            <th>
                                Hora Entrada
                            </th>

                            <th>
                                Hora Salida
                            </th>

                            <th>
                                Estado
                            </th>

                            <th>
                                Observaciones
                            </th>

                            <th>
                                Trazabilidad
                            </th>

                            <th>
                                Acciones
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {cargando ? (

                            <tr>

                                <td
                                    colSpan="8"
                                    style={{
                                        textAlign:
                                            "center",

                                        padding:
                                            "30px 0",

                                        color:
                                            "#64748b"
                                    }}
                                >
                                    Cargando asistencias...
                                </td>

                            </tr>

                        ) : personalFiltrado.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="8"
                                    style={{
                                        textAlign:
                                            "center",

                                        padding:
                                            "30px 0",

                                        color:
                                            "#64748b"
                                    }}
                                >
                                    No se encontraron trabajadores.
                                </td>

                            </tr>

                        ) : (

                            personalFiltrado.map(
                                (p) => {

                                    const r =
                                        getRegistroAPI(
                                            p.id
                                        );


                                    const estaProcesando =
                                        procesando[
                                        p.id
                                        ];


                                    return (

                                        <tr
                                            key={
                                                p.id
                                            }
                                        >


                                            {/* TRABAJADOR */}

                                            <td>

                                                <strong>
                                                    {p.nombre}
                                                </strong>

                                            </td>


                                            {/* CARGO */}

                                            <td>
                                                {p.cargo}
                                            </td>


                                            {/* HORA ENTRADA */}

                                            <td>

                                                <input
                                                    type="time"

                                                    value={
                                                        r.horaEntrada
                                                    }

                                                    onChange={(e) =>
                                                        cambiarHoraEntrada(
                                                            p,
                                                            e.target.value
                                                        )
                                                    }

                                                    className="input-hora"

                                                    disabled={
                                                        estaProcesando
                                                    }
                                                />

                                            </td>


                                            {/* HORA SALIDA */}

                                            <td>

                                                <input
                                                    type="time"

                                                    value={
                                                        r.horaSalida
                                                    }

                                                    onChange={(e) =>
                                                        cambiarHoraSalida(
                                                            p,
                                                            e.target.value
                                                        )
                                                    }

                                                    className="input-hora"

                                                    disabled={
                                                        estaProcesando ||
                                                        !r.asistencia_id
                                                    }
                                                />

                                            </td>


                                            {/* ESTADO */}

                                            <td>

                                                <select
                                                    value={
                                                        r.estado
                                                    }

                                                    onChange={(e) =>
                                                        cambiarEstado(
                                                            p,
                                                            e.target.value
                                                        )
                                                    }

                                                    className={`select-estado estado${r.estado.replace(
                                                        " ",
                                                        ""
                                                    )}`}

                                                    disabled={
                                                        estaProcesando
                                                    }
                                                >

                                                    {ESTADOS.map(
                                                        (
                                                            estado
                                                        ) => (

                                                            <option
                                                                key={
                                                                    estado
                                                                }
                                                                value={
                                                                    estado
                                                                }
                                                            >
                                                                {
                                                                    estado
                                                                }
                                                            </option>

                                                        )
                                                    )}

                                                </select>

                                            </td>


                                            {/* OBSERVACIONES */}

                                            <td>

                                                <input
                                                    type="text"

                                                    placeholder={
                                                        r.estado ===
                                                            "Ausente" ||
                                                            r.estado ===
                                                            "Permiso"
                                                            ? "Motivo..."
                                                            : "Opcional..."
                                                    }

                                                    defaultValue={
                                                        r.observaciones
                                                    }

                                                    onBlur={(e) =>
                                                        cambiarObservaciones(
                                                            p,
                                                            e.target.value
                                                        )
                                                    }

                                                    className="input-observaciones"

                                                    disabled={
                                                        estaProcesando
                                                    }
                                                />

                                            </td>


                                            {/* TRAZABILIDAD */}

                                            <td className="trazabilidad">

                                                {r.registradoA
                                                    ? `Registrado a las ${r.registradoA}`
                                                    : "Por registrar"}

                                            </td>


                                            {/* ACCIONES */}

                                            <td>

                                                <div className="table-actions">

                                                    <button
                                                        className="btn-act-table link"

                                                        onClick={() =>
                                                            setDetalle(
                                                                {
                                                                    p,
                                                                    r
                                                                }
                                                            )
                                                        }
                                                    >
                                                        🔍 Ver Detalle
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    );
                                }
                            )

                        )}

                    </tbody>

                </table>

            </div>


            {/* ==================================================
                MODAL DETALLE
            ================================================== */}

            {detalle && (

                <div className="modal-overlay">

                    <div
                        className="modal-content"
                        style={{
                            maxWidth:
                                "480px"
                        }}
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    {
                                        detalle.p.nombre
                                    }
                                </h2>

                                <p>
                                    {
                                        detalle.p.cargo
                                    }
                                    {" — "}
                                    {fecha}
                                </p>

                            </div>


                            <button
                                className="btn-close"
                                onClick={() =>
                                    setDetalle(
                                        null
                                    )
                                }
                            >
                                ✕
                            </button>

                        </div>


                        <div className="modal-body">

                            <p>

                                <strong>
                                    Estado:
                                </strong>{" "}

                                {
                                    detalle.r.estado
                                }

                            </p>


                            <p>

                                <strong>
                                    Hora de entrada:
                                </strong>{" "}

                                {
                                    detalle.r.horaEntrada ||
                                    "—"
                                }

                            </p>


                            <p>

                                <strong>
                                    Hora de salida:
                                </strong>{" "}

                                {
                                    detalle.r.horaSalida ||
                                    "—"
                                }

                            </p>


                            <p>

                                <strong>
                                    Observaciones:
                                </strong>{" "}

                                {
                                    detalle.r.observaciones ||
                                    "—"
                                }

                            </p>


                            <p>

                                <strong>
                                    Último registro:
                                </strong>{" "}

                                {
                                    detalle.r.registradoA
                                        ? `a las ${detalle.r.registradoA}`
                                        : "Sin registrar aún"
                                }

                            </p>

                        </div>


                        <div className="modal-footer">

                            <button
                                className="btn-cancelar"
                                onClick={() =>
                                    setDetalle(
                                        null
                                    )
                                }
                            >
                                Cerrar
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default Asistencia;