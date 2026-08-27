
import { useEffect, useState } from "react";
import "./Configuracion.css";

const SUBMENUS_CONFIG = [
    "Parámetros del Taller",
    "Usuarios y Perfiles",
    "Integraciones & Notificaciones",
    "Series y Comprobantes"
];

const API_URL = "http://127.0.0.1:8000/api";


// ============================================================
// ROLES
// ============================================================
// Estos IDs corresponden a los registros iniciales de tu tabla
// roles:
//
// 1 Administrador
// 2 Asesor de Servicio
// 3 Asesor de Repuestos
// 4 Técnico Automotriz
//
// El backend ahora trabaja con rol_id.
// ============================================================

const ROLES = [
    {
        rol_id: 1,
        nombre: "Administrador"
    },
    {
        rol_id: 2,
        nombre: "Asesor de Servicio"
    },
    {
        rol_id: 3,
        nombre: "Asesor de Repuestos"
    },
    {
        rol_id: 4,
        nombre: "Técnico Automotriz"
    }
];


function Configuracion() {

    const [subtab, setSubtab] = useState(
        "Parámetros del Taller"
    );


    // ============================================================
    // PARÁMETROS DEL TALLER
    // ============================================================

    const [empresaData, setEmpresaData] = useState({
        nombre: "VERAMOTORS S.A.C.",
        desarrollador: "RAZOR S.A.C.",
        ruc: "20601234567",
        direccion: "Av. La Marina 2840, San Miguel, Lima",
        telefono: "+51 1 458-9200",
        email: "contacto@veramotors.pe",
        igv: "18",
        moneda: "PEN - Soles (S/)"
    });


    const guardarEmpresa = (e) => {

        e.preventDefault();

        alert(
            "¡Parámetros del taller actualizados correctamente!"
        );
    };


    // ============================================================
    // USUARIOS
    // ============================================================

    const [usuarios, setUsuarios] = useState([]);

    const [cargandoUsuarios, setCargandoUsuarios] =
        useState(false);

    const [errorUsuarios, setErrorUsuarios] =
        useState("");


    // ============================================================
    // MODAL NUEVO USUARIO
    // ============================================================

    const [mostrarModalUsuario, setMostrarModalUsuario] =
        useState(false);

    const [creandoUsuario, setCreandoUsuario] =
        useState(false);


    const [nuevoUsuario, setNuevoUsuario] = useState({

        nombre: "",

        email: "",

        rol_id: 2,

        password: "",

        confirmar_password: "",

        activo: true

    });


    // ============================================================
    // SERIES Y CORRELATIVOS
    // ============================================================

    const [series, setSeries] = useState([]);


    const [cargandoSeries, setCargandoSeries] =
        useState(false);


    const [guardandoSerie, setGuardandoSerie] =
        useState(false);


    const [errorSeries, setErrorSeries] =
        useState("");


    // ============================================================
    // OBTENER USUARIOS
    // GET /api/usuarios
    // ============================================================

    const cargarUsuarios = async () => {

        setCargandoUsuarios(true);

        setErrorUsuarios("");


        try {

            const response = await fetch(
                `${API_URL}/usuarios`
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "No se pudieron obtener los usuarios."
                );

            }


            setUsuarios(data);


        } catch (error) {

            console.error(
                "Error al cargar usuarios:",
                error
            );


            setErrorUsuarios(
                "No se pudo conectar con el servidor. Verifica que FastAPI esté ejecutándose."
            );


        } finally {

            setCargandoUsuarios(false);

        }
    };


    // ============================================================
    // OBTENER CORRELATIVOS
    // GET /api/configuracion/correlativos
    // ============================================================

    const cargarSeries = async () => {

        setCargandoSeries(true);

        setErrorSeries("");


        try {

            const response = await fetch(
                `${API_URL}/configuracion/correlativos`
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "No se pudieron obtener los correlativos."
                );

            }


            setSeries(data);


        } catch (error) {

            console.error(
                "Error al cargar correlativos:",
                error
            );


            setErrorSeries(
                "No se pudo conectar con el servidor para obtener los correlativos."
            );


        } finally {

            setCargandoSeries(false);

        }
    };


    // ============================================================
    // CARGAR INFORMACIÓN SEGÚN PESTAÑA
    // ============================================================

    useEffect(() => {

        if (
            subtab === "Usuarios y Perfiles"
        ) {

            cargarUsuarios();

        }


        if (
            subtab === "Series y Comprobantes"
        ) {

            cargarSeries();

        }

    }, [subtab]);


    // ============================================================
    // OBTENER NOMBRE DEL ROL
    // ============================================================

    const obtenerNombreRol = (rol_id) => {

        const rol = ROLES.find(
            (item) =>
                Number(item.rol_id) === Number(rol_id)
        );


        return rol
            ? rol.nombre
            : "Rol desconocido";
    };


    // ============================================================
    // CAMBIAR ESTADO DEL USUARIO
    // PATCH /api/usuarios/{id}/estado
    // ============================================================

    const toggleEstadoUsuario = async (id) => {

        try {

            const response = await fetch(
                `${API_URL}/usuarios/${id}/estado`,
                {
                    method: "PATCH",

                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "No se pudo cambiar el estado del usuario."
                );

            }


            setUsuarios(
                (usuariosActuales) =>
                    usuariosActuales.map(
                        (usuario) =>
                            usuario.user_id === id
                                ? data
                                : usuario
                    )
            );


        } catch (error) {

            console.error(
                "Error al cambiar estado:",
                error
            );


            alert(
                error.message ||
                "No se pudo cambiar el estado del usuario."
            );

        }
    };


    // ============================================================
    // CREAR USUARIO
    // POST /api/usuarios
    // ============================================================

    const agregarUsuario = async (e) => {

        e.preventDefault();


        if (!nuevoUsuario.nombre.trim()) {

            alert(
                "Completa el nombre del usuario."
            );

            return;
        }


        if (!nuevoUsuario.email.trim()) {

            alert(
                "Completa el correo electrónico."
            );

            return;
        }


        if (!nuevoUsuario.password) {

            alert(
                "Completa la contraseña."
            );

            return;
        }


        if (
            nuevoUsuario.password.length < 6
        ) {

            alert(
                "La contraseña debe tener como mínimo 6 caracteres."
            );

            return;
        }


        if (
            nuevoUsuario.password !==
            nuevoUsuario.confirmar_password
        ) {

            alert(
                "Las contraseñas no coinciden."
            );

            return;
        }


        setCreandoUsuario(true);


        try {

            const response = await fetch(
                `${API_URL}/usuarios`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({

                        nombre:
                            nuevoUsuario.nombre.trim(),

                        email:
                            nuevoUsuario.email.trim(),

                        rol_id:
                            Number(nuevoUsuario.rol_id),

                        password:
                            nuevoUsuario.password,

                        confirmar_password:
                            nuevoUsuario.confirmar_password,

                        activo:
                            true

                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                if (
                    Array.isArray(data.detail)
                ) {

                    const mensajes =
                        data.detail
                            .map(
                                (error) =>
                                    error.msg
                            )
                            .join("\n");


                    throw new Error(
                        mensajes
                    );
                }


                throw new Error(
                    data.detail ||
                    "No se pudo crear el usuario."
                );
            }


            setUsuarios(
                (usuariosActuales) => [
                    ...usuariosActuales,
                    data
                ]
            );


            setMostrarModalUsuario(false);


            setNuevoUsuario({

                nombre: "",

                email: "",

                rol_id: 2,

                password: "",

                confirmar_password: "",

                activo: true

            });


            alert(
                `¡Usuario ${data.nombre} creado correctamente!`
            );


        } catch (error) {

            console.error(
                "Error al crear usuario:",
                error
            );


            alert(
                error.message ||
                "No se pudo crear el usuario."
            );


        } finally {

            setCreandoUsuario(false);

        }
    };


    // ============================================================
    // CAMBIAR PREFIJO / CORRELATIVO EN PANTALLA
    // ============================================================

    const cambiarSerie = (
        correlativo_id,
        campo,
        valor
    ) => {

        setSeries(
            (seriesActuales) =>
                seriesActuales.map(
                    (serie) =>
                        serie.correlativo_id ===
                            correlativo_id
                            ? {
                                ...serie,
                                [campo]:
                                    campo ===
                                        "siguiente_correlativo"
                                        ? Number(valor)
                                        : valor
                            }
                            : serie
                )
        );
    };


    // ============================================================
    // GUARDAR CORRELATIVO
    // PUT /api/configuracion/correlativos/{id}
    // ============================================================

    const guardarCorrelativo = async (
        serie
    ) => {

        setGuardandoSerie(true);


        try {

            const response = await fetch(
                `${API_URL}/configuracion/correlativos/${serie.correlativo_id}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body: JSON.stringify({

                        prefijo:
                            serie.prefijo.trim(),

                        siguiente_correlativo:
                            Number(
                                serie.siguiente_correlativo
                            ),

                        activo:
                            serie.activo

                    })

                }
            );


            const data = await response.json();


            if (!response.ok) {

                if (
                    Array.isArray(data.detail)
                ) {

                    const mensajes =
                        data.detail
                            .map(
                                (error) =>
                                    error.msg
                            )
                            .join("\n");


                    throw new Error(
                        mensajes
                    );

                }


                throw new Error(
                    data.detail ||
                    "No se pudo actualizar el correlativo."
                );
            }


            setSeries(
                (seriesActuales) =>
                    seriesActuales.map(
                        (item) =>
                            item.correlativo_id ===
                                data.correlativo_id
                                ? data
                                : item
                    )
            );


            alert(
                `Correlativo ${data.tipo_documento} actualizado correctamente.`
            );


        } catch (error) {

            console.error(
                "Error al guardar correlativo:",
                error
            );


            alert(
                error.message ||
                "No se pudo guardar el correlativo."
            );


        } finally {

            setGuardandoSerie(false);

        }
    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="config-page">


            {/* ==================================================
                CABECERA
            ================================================== */}

            <div className="config-header">

                <h2>
                    Configuración y Parámetros del Sistema
                </h2>

                <p>
                    Configuración institucional de
                    VERAMOTORS SAC, usuarios, perfiles
                    de acceso y notificaciones.
                </p>

            </div>


            {/* ==================================================
                PESTAÑAS
            ================================================== */}

            <div className="config-tabs">

                {SUBMENUS_CONFIG.map(
                    (tab) => (

                        <button
                            key={tab}
                            className={
                                `config-tab-btn ${subtab === tab
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                setSubtab(tab)
                            }
                        >
                            {tab}
                        </button>

                    )
                )}

            </div>


            {/* ==================================================
                1. PARÁMETROS DEL TALLER
            ================================================== */}

            {subtab ===
                "Parámetros del Taller" && (

                    <div className="config-card">

                        <h3>
                            🏛️ Información Institucional del Taller
                        </h3>


                        <form
                            onSubmit={guardarEmpresa}
                        >

                            <div
                                className="config-form-grid"
                                style={{
                                    marginBottom:
                                        "16px"
                                }}
                            >

                                <div className="config-field">

                                    <label>
                                        Nombre de la Empresa (App Responsive)
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            empresaData.nombre
                                        }
                                        onChange={(e) =>
                                            setEmpresaData({
                                                ...empresaData,
                                                nombre:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                </div>


                                <div className="config-field">

                                    <label>
                                        Empresa Desarrolladora
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            empresaData.desarrollador
                                        }
                                        onChange={(e) =>
                                            setEmpresaData({
                                                ...empresaData,
                                                desarrollador:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                </div>


                                <div className="config-field">

                                    <label>
                                        RUC Institucional
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            empresaData.ruc
                                        }
                                        onChange={(e) =>
                                            setEmpresaData({
                                                ...empresaData,
                                                ruc:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                </div>


                                <div className="config-field">

                                    <label>
                                        Impuesto General a las Ventas (IGV)
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            `${empresaData.igv}%`
                                        }
                                        disabled
                                        style={{
                                            background:
                                                "#f1f5f9"
                                        }}
                                    />

                                </div>

                            </div>


                            <div
                                className="config-form-grid"
                                style={{
                                    marginBottom:
                                        "20px"
                                }}
                            >

                                <div className="config-field">

                                    <label>
                                        Dirección del Taller Principal
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            empresaData.direccion
                                        }
                                        onChange={(e) =>
                                            setEmpresaData({
                                                ...empresaData,
                                                direccion:
                                                    e.target.value
                                            })
                                        }
                                    />

                                </div>


                                <div className="config-field">

                                    <label>
                                        Teléfono Central
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            empresaData.telefono
                                        }
                                        onChange={(e) =>
                                            setEmpresaData({
                                                ...empresaData,
                                                telefono:
                                                    e.target.value
                                            })
                                        }
                                    />

                                </div>


                                <div className="config-field">

                                    <label>
                                        Correo Institucional
                                    </label>

                                    <input
                                        type="email"
                                        value={
                                            empresaData.email
                                        }
                                        onChange={(e) =>
                                            setEmpresaData({
                                                ...empresaData,
                                                email:
                                                    e.target.value
                                            })
                                        }
                                    />

                                </div>


                                <div className="config-field">

                                    <label>
                                        Moneda del Sistema
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            empresaData.moneda
                                        }
                                        disabled
                                        style={{
                                            background:
                                                "#f1f5f9"
                                        }}
                                    />

                                </div>

                            </div>


                            <button
                                type="submit"
                                className="btn-act-table link"
                                style={{
                                    padding:
                                        "10px 20px",
                                    fontSize:
                                        "0.9rem"
                                }}
                            >
                                💾 Guardar Cambios
                            </button>

                        </form>

                    </div>

                )}


            {/* ==================================================
                2. USUARIOS Y PERFILES
            ================================================== */}

            {subtab ===
                "Usuarios y Perfiles" && (

                    <div className="config-card">

                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                marginBottom:
                                    "16px"
                            }}
                        >

                            <h3
                                style={{
                                    margin: 0,
                                    border: "none"
                                }}
                            >
                                👥 Usuarios y Control de Roles
                            </h3>


                            <button
                                className="btn-act-table link"
                                style={{
                                    padding:
                                        "8px 16px"
                                }}
                                onClick={() =>
                                    setMostrarModalUsuario(
                                        true
                                    )
                                }
                            >
                                + Crear Nuevo Usuario
                            </button>

                        </div>


                        {errorUsuarios && (

                            <div
                                style={{
                                    background:
                                        "#fee2e2",
                                    color:
                                        "#b91c1c",
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "6px",
                                    marginBottom:
                                        "16px",
                                    border:
                                        "1px solid #fecaca"
                                }}
                            >
                                {errorUsuarios}
                            </div>

                        )}


                        <div className="os-table-wrapper">

                            <table className="os-table">

                                <thead>

                                    <tr>

                                        <th>
                                            ID
                                        </th>

                                        <th>
                                            Nombre del Usuario
                                        </th>

                                        <th>
                                            Correo Electrónico
                                        </th>

                                        <th>
                                            Rol Asignado
                                        </th>

                                        <th>
                                            Estado
                                        </th>

                                        <th>
                                            Acciones
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {cargandoUsuarios ? (

                                        <tr>

                                            <td
                                                colSpan="6"
                                                style={{
                                                    textAlign:
                                                        "center",
                                                    padding:
                                                        "30px"
                                                }}
                                            >
                                                Cargando usuarios...
                                            </td>

                                        </tr>

                                    ) : usuarios.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="6"
                                                style={{
                                                    textAlign:
                                                        "center",
                                                    padding:
                                                        "30px"
                                                }}
                                            >
                                                No hay usuarios registrados.
                                            </td>

                                        </tr>

                                    ) : (

                                        usuarios.map(
                                            (u) => (

                                                <tr
                                                    key={
                                                        u.user_id
                                                    }
                                                >

                                                    <td>

                                                        <strong>
                                                            #{u.user_id}
                                                        </strong>

                                                    </td>


                                                    <td>
                                                        {u.nombre}
                                                    </td>


                                                    <td>
                                                        {u.email}
                                                    </td>


                                                    <td>

                                                        <span className="proc-tag preventivo">

                                                            {
                                                                u.rol ||
                                                                obtenerNombreRol(
                                                                    u.rol_id
                                                                )
                                                            }

                                                        </span>

                                                    </td>


                                                    <td>

                                                        <span
                                                            style={{
                                                                color:
                                                                    u.activo
                                                                        ? "#16a34a"
                                                                        : "#ef4444",
                                                                fontWeight:
                                                                    "bold"
                                                            }}
                                                        >

                                                            {u.activo
                                                                ? "Activo"
                                                                : "Inactivo"}

                                                        </span>

                                                    </td>


                                                    <td>

                                                        <button
                                                            className="btn-act-table diag"
                                                            onClick={() =>
                                                                toggleEstadoUsuario(
                                                                    u.user_id
                                                                )
                                                            }
                                                        >

                                                            {u.activo
                                                                ? "Desactivar"
                                                                : "Activar"}

                                                        </button>

                                                    </td>

                                                </tr>

                                            )
                                        )

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                )}


            {/* ==================================================
                3. INTEGRACIONES & NOTIFICACIONES
            ================================================== */}

            {subtab ===
                "Integraciones & Notificaciones" && (

                    <div className="config-card">

                        <h3>
                            📲 Integraciones de Comunicación
                            (Telegram & Email)
                        </h3>


                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "1fr 1fr",
                                gap: "20px"
                            }}
                        >

                            {/* TELEGRAM */}

                            <div
                                style={{
                                    background:
                                        "#f8fafc",
                                    padding:
                                        "16px",
                                    borderRadius:
                                        "8px",
                                    border:
                                        "1px solid #cbd5e1"
                                }}
                            >

                                <h4>
                                    🔵 Telegram Bot
                                </h4>

                                <p
                                    style={{
                                        fontSize:
                                            "0.85rem",
                                        color:
                                            "#64748b"
                                    }}
                                >
                                    Envío automático de citas,
                                    actualizaciones de órdenes
                                    de servicio, aprobaciones
                                    y notificaciones de entrega.
                                </p>


                                <div
                                    className="config-field"
                                    style={{
                                        marginTop:
                                            "12px"
                                    }}
                                >

                                    <label>
                                        Token del Bot de Telegram
                                    </label>

                                    <input
                                        type="password"
                                        placeholder="Token del bot de Telegram"
                                    />

                                </div>


                                <button
                                    className="btn-act-table link"
                                    style={{
                                        marginTop:
                                            "12px"
                                    }}
                                    onClick={() =>
                                        alert(
                                            "La conexión con Telegram estará disponible cuando se configure el Bot."
                                        )
                                    }
                                >
                                    ⚡ Probar Conexión Telegram
                                </button>

                            </div>


                            {/* EMAIL */}

                            <div
                                style={{
                                    background:
                                        "#f8fafc",
                                    padding:
                                        "16px",
                                    borderRadius:
                                        "8px",
                                    border:
                                        "1px solid #cbd5e1"
                                }}
                            >

                                <h4>
                                    ✉️ Servidor de Correo SMTP
                                </h4>

                                <p
                                    style={{
                                        fontSize:
                                            "0.85rem",
                                        color:
                                            "#64748b"
                                    }}
                                >
                                    Notificaciones de ODS,
                                    cotizaciones y facturas
                                    electrónicas vía e-mail.
                                </p>


                                <div
                                    className="config-field"
                                    style={{
                                        marginTop:
                                            "12px"
                                    }}
                                >

                                    <label>
                                        Host SMTP
                                    </label>

                                    <input
                                        type="text"
                                        value="smtp.veramotors.pe:587"
                                        readOnly
                                        style={{
                                            background:
                                                "#e2e8f0"
                                        }}
                                    />

                                </div>


                                <button
                                    className="btn-act-table link"
                                    style={{
                                        marginTop:
                                            "12px"
                                    }}
                                    onClick={() =>
                                        alert(
                                            "La configuración de correo estará disponible cuando se conecte el servidor SMTP."
                                        )
                                    }
                                >
                                    📧 Enviar Correo de Prueba
                                </button>

                            </div>

                        </div>

                    </div>

                )}


            {/* ==================================================
                4. SERIES Y COMPROBANTES
            ================================================== */}

            {subtab ===
                "Series y Comprobantes" && (

                    <div className="config-card">

                        <h3>
                            🧾 Configuración de Series y
                            Correlativos SUNAT / ODS
                        </h3>


                        {errorSeries && (

                            <div
                                style={{
                                    background:
                                        "#fee2e2",
                                    color:
                                        "#b91c1c",
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "6px",
                                    marginBottom:
                                        "16px",
                                    border:
                                        "1px solid #fecaca"
                                }}
                            >
                                {errorSeries}
                            </div>

                        )}


                        {cargandoSeries ? (

                            <div
                                style={{
                                    textAlign:
                                        "center",
                                    padding:
                                        "30px"
                                }}
                            >
                                Cargando configuración de correlativos...
                            </div>

                        ) : series.length === 0 ? (

                            <div
                                style={{
                                    textAlign:
                                        "center",
                                    padding:
                                        "30px"
                                }}
                            >
                                No existen configuraciones de correlativos.
                            </div>

                        ) : (

                            <>

                                <div
                                    className="config-form-grid"
                                    style={{
                                        marginBottom:
                                            "20px"
                                    }}
                                >

                                    {series.map(
                                        (serie) => (

                                            <div
                                                className="config-field"
                                                key={
                                                    serie.correlativo_id
                                                }
                                            >

                                                <label>

                                                    {serie.tipo_documento ===
                                                        "FACTURA"
                                                        ? "Factura Electrónica"
                                                        : serie.tipo_documento ===
                                                            "BOLETA"
                                                            ? "Boleta Electrónica"
                                                            : serie.tipo_documento ===
                                                                "COTIZACION"
                                                                ? "Cotizaciones"
                                                                : "Orden de Servicio (ODS)"}

                                                </label>


                                                <div
                                                    style={{
                                                        display:
                                                            "grid",
                                                        gridTemplateColumns:
                                                            "1fr 1fr",
                                                        gap:
                                                            "10px"
                                                    }}
                                                >

                                                    {/* PREFIJO */}

                                                    <div>

                                                        <small
                                                            style={{
                                                                display:
                                                                    "block",
                                                                marginBottom:
                                                                    "4px",
                                                                color:
                                                                    "#64748b"
                                                            }}
                                                        >
                                                            Prefijo / Serie
                                                        </small>

                                                        <input
                                                            type="text"
                                                            value={
                                                                serie.prefijo
                                                            }
                                                            onChange={(e) =>
                                                                cambiarSerie(
                                                                    serie.correlativo_id,
                                                                    "prefijo",
                                                                    e.target.value
                                                                )
                                                            }
                                                            maxLength="10"
                                                        />

                                                    </div>


                                                    {/* SIGUIENTE */}

                                                    <div>

                                                        <small
                                                            style={{
                                                                display:
                                                                    "block",
                                                                marginBottom:
                                                                    "4px",
                                                                color:
                                                                    "#64748b"
                                                            }}
                                                        >
                                                            Siguiente correlativo
                                                        </small>

                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={
                                                                serie.siguiente_correlativo
                                                            }
                                                            onChange={(e) =>
                                                                cambiarSerie(
                                                                    serie.correlativo_id,
                                                                    "siguiente_correlativo",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />

                                                    </div>

                                                </div>


                                                {/* VISTA PREVIA */}

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "8px",
                                                        padding:
                                                            "8px 10px",
                                                        background:
                                                            "#f1f5f9",
                                                        borderRadius:
                                                            "6px",
                                                        fontSize:
                                                            "0.85rem"
                                                    }}
                                                >

                                                    <strong>
                                                        Próximo:
                                                    </strong>{" "}

                                                    {serie.prefijo}-

                                                    {String(
                                                        serie.siguiente_correlativo
                                                    ).padStart(
                                                        6,
                                                        "0"
                                                    )}

                                                </div>


                                                {/* GUARDAR */}

                                                <button
                                                    type="button"
                                                    className="btn-act-table link"
                                                    style={{
                                                        marginTop:
                                                            "10px",
                                                        padding:
                                                            "8px 16px"
                                                    }}
                                                    disabled={
                                                        guardandoSerie
                                                    }
                                                    onClick={() =>
                                                        guardarCorrelativo(
                                                            serie
                                                        )
                                                    }
                                                >
                                                    💾 Guardar
                                                </button>

                                            </div>

                                        )
                                    )}

                                </div>

                            </>

                        )}

                    </div>

                )}


            {/* ==================================================
                MODAL CREAR USUARIO
            ================================================== */}

            {mostrarModalUsuario && (

                <div className="modal-overlay">

                    <div
                        className="modal-content config-modal"
                        style={{
                            maxWidth:
                                "500px"
                        }}
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Crear Nuevo Usuario del Sistema
                                </h2>

                                <p>
                                    Asigna credenciales y rol
                                    de usuario en VeraMotors.
                                </p>

                            </div>


                            <button
                                className="btn-close"
                                onClick={() =>
                                    setMostrarModalUsuario(
                                        false
                                    )
                                }
                                disabled={
                                    creandoUsuario
                                }
                            >
                                ✕
                            </button>

                        </div>


                        <form
                            onSubmit={
                                agregarUsuario
                            }
                        >

                            <div className="modal-body">


                                {/* NOMBRE */}

                                <div
                                    style={{
                                        marginBottom:
                                            "14px"
                                    }}
                                >

                                    <label
                                        style={{
                                            fontSize:
                                                "0.85rem",
                                            fontWeight:
                                                "bold",
                                            display:
                                                "block",
                                            marginBottom:
                                                "4px"
                                        }}
                                    >
                                        Nombre Completo *
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            nuevoUsuario.nombre
                                        }
                                        onChange={(e) =>
                                            setNuevoUsuario({
                                                ...nuevoUsuario,
                                                nombre:
                                                    e.target.value
                                            })
                                        }
                                        required
                                        disabled={
                                            creandoUsuario
                                        }
                                        placeholder="Ej. Juan Pérez"
                                    />

                                </div>


                                {/* CORREO */}

                                <div
                                    style={{
                                        marginBottom:
                                            "14px"
                                    }}
                                >

                                    <label
                                        style={{
                                            fontSize:
                                                "0.85rem",
                                            fontWeight:
                                                "bold",
                                            display:
                                                "block",
                                            marginBottom:
                                                "4px"
                                        }}
                                    >
                                        Correo Electrónico *
                                    </label>

                                    <input
                                        type="email"
                                        value={
                                            nuevoUsuario.email
                                        }
                                        onChange={(e) =>
                                            setNuevoUsuario({
                                                ...nuevoUsuario,
                                                email:
                                                    e.target.value
                                            })
                                        }
                                        required
                                        disabled={
                                            creandoUsuario
                                        }
                                        placeholder="correo@veramotors.com"
                                    />

                                </div>


                                {/* ROL */}

                                <div
                                    style={{
                                        marginBottom:
                                            "14px"
                                    }}
                                >

                                    <label
                                        style={{
                                            fontSize:
                                                "0.85rem",
                                            fontWeight:
                                                "bold",
                                            display:
                                                "block",
                                            marginBottom:
                                                "4px"
                                        }}
                                    >
                                        Rol del Sistema *
                                    </label>


                                    <select
                                        value={
                                            nuevoUsuario.rol_id
                                        }
                                        onChange={(e) =>
                                            setNuevoUsuario({
                                                ...nuevoUsuario,
                                                rol_id:
                                                    Number(
                                                        e.target.value
                                                    )
                                            })
                                        }
                                        disabled={
                                            creandoUsuario
                                        }
                                    >

                                        {ROLES.map(
                                            (rol) => (

                                                <option
                                                    key={
                                                        rol.rol_id
                                                    }
                                                    value={
                                                        rol.rol_id
                                                    }
                                                >
                                                    {rol.nombre}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                                {/* CONTRASEÑA */}

                                <div
                                    style={{
                                        marginBottom:
                                            "14px"
                                    }}
                                >

                                    <label
                                        style={{
                                            fontSize:
                                                "0.85rem",
                                            fontWeight:
                                                "bold",
                                            display:
                                                "block",
                                            marginBottom:
                                                "4px"
                                        }}
                                    >
                                        Contraseña *
                                    </label>

                                    <input
                                        type="password"
                                        value={
                                            nuevoUsuario.password
                                        }
                                        onChange={(e) =>
                                            setNuevoUsuario({
                                                ...nuevoUsuario,
                                                password:
                                                    e.target.value
                                            })
                                        }
                                        required
                                        minLength="6"
                                        disabled={
                                            creandoUsuario
                                        }
                                        placeholder="Mínimo 6 caracteres"
                                    />

                                </div>


                                {/* CONFIRMAR CONTRASEÑA */}

                                <div
                                    style={{
                                        marginBottom:
                                            "14px"
                                    }}
                                >

                                    <label
                                        style={{
                                            fontSize:
                                                "0.85rem",
                                            fontWeight:
                                                "bold",
                                            display:
                                                "block",
                                            marginBottom:
                                                "4px"
                                        }}
                                    >
                                        Confirmar Contraseña *
                                    </label>

                                    <input
                                        type="password"
                                        value={
                                            nuevoUsuario.confirmar_password
                                        }
                                        onChange={(e) =>
                                            setNuevoUsuario({
                                                ...nuevoUsuario,
                                                confirmar_password:
                                                    e.target.value
                                            })
                                        }
                                        required
                                        minLength="6"
                                        disabled={
                                            creandoUsuario
                                        }
                                        placeholder="Repite la contraseña"
                                    />

                                </div>


                                {/* ESTADO */}

                                <div
                                    style={{
                                        marginBottom:
                                            "14px"
                                    }}
                                >

                                    <label
                                        style={{
                                            fontSize:
                                                "0.85rem",
                                            fontWeight:
                                                "bold",
                                            display:
                                                "block",
                                            marginBottom:
                                                "4px"
                                        }}
                                    >
                                        Estado
                                    </label>

                                    <select
                                        value="Activo"
                                        disabled
                                        style={{
                                            background:
                                                "#f1f5f9",
                                            color:
                                                "#16a34a",
                                            fontWeight:
                                                "bold"
                                        }}
                                    >

                                        <option value="Activo">
                                            Activo
                                        </option>

                                    </select>

                                </div>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={() =>
                                        setMostrarModalUsuario(
                                            false
                                        )
                                    }
                                    disabled={
                                        creandoUsuario
                                    }
                                >
                                    Cancelar
                                </button>


                                <button
                                    type="submit"
                                    className="btn-guardar"
                                    disabled={
                                        creandoUsuario
                                    }
                                >

                                    {creandoUsuario
                                        ? "Creando usuario..."
                                        : "Crear Usuario"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );
}


export default Configuracion;

