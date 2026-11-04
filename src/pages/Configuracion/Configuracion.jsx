
import { useEffect, useState } from "react";
import "./Configuracion.css";
import { obtenerParametrosEmpresa, guardarParametrosEmpresa } from "../../services/configuracionService";

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


    const [guardandoEmpresa, setGuardandoEmpresa] = useState(false);
    const [errorEmpresa, setErrorEmpresa] = useState("");

    useEffect(() => {
        let activa = true;
        obtenerParametrosEmpresa()
            .then((datos) => {
                if (!activa || !datos) return;
                setEmpresaData({
                    nombre: datos.nombre || "",
                    desarrollador: datos.desarrollador || "",
                    ruc: datos.ruc || "",
                    direccion: datos.direccion || "",
                    telefono: datos.telefono || "",
                    email: datos.email || "",
                    igv: String(Number(datos.igv)),
                    moneda: datos.moneda || ""
                });
            })
            .catch((error) => {
                if (activa) setErrorEmpresa(error.message || "No se pudieron cargar los parámetros del taller.");
            });
        return () => { activa = false; };
    }, []);

    const guardarEmpresa = async (e) => {

        e.preventDefault();

        if (!/^\d{11}$/.test(empresaData.ruc.trim())) {
            setErrorEmpresa("El RUC debe tener exactamente 11 dígitos.");
            return;
        }

        setGuardandoEmpresa(true);
        setErrorEmpresa("");

        try {
            await guardarParametrosEmpresa({
                ...empresaData,
                ruc: empresaData.ruc.trim(),
                igv: Number(empresaData.igv)
            });
            alert(
                "¡Parámetros del taller actualizados correctamente!"
            );
        } catch (error) {
            console.error("Error guardando parámetros:", error);
            setErrorEmpresa(error.message || "No se pudieron guardar los parámetros del taller.");
        } finally {
            setGuardandoEmpresa(false);
        }
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

                    <div className="vm-card config-card">

                        <div className="vm-card-head">

                            <h3>
                                <span className="material-symbols-outlined" aria-hidden="true">account_balance</span>
                                Información Institucional del Taller
                            </h3>

                        </div>


                        <form
                            className="vm-card-body"
                            onSubmit={guardarEmpresa}
                        >

                            <h4 className="vm-form-section-title">
                                <span className="material-symbols-outlined" aria-hidden="true">badge</span>
                                Identidad y datos fiscales
                            </h4>

                            {errorEmpresa && (
                                <div className="vm-alert" role="alert">
                                    <span className="material-symbols-outlined" aria-hidden="true">error</span>
                                    <span>{errorEmpresa}</span>
                                </div>
                            )}

                            <div className="form-grid config-seccion-grid">

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
                                    />

                                </div>

                            </div>


                            <h4 className="vm-form-section-title">
                                <span className="material-symbols-outlined" aria-hidden="true">contact_phone</span>
                                Ubicación, contacto y moneda
                            </h4>

                            <div className="form-grid config-seccion-grid">

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
                                    />

                                </div>

                            </div>


                            <div className="config-form-acciones">

                                <button
                                    type="submit"
                                    className="vm-btn vm-btn-accent"
                                    disabled={guardandoEmpresa}
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">save</span>
                                    {guardandoEmpresa ? "Guardando…" : "Guardar Cambios"}
                                </button>

                            </div>

                        </form>

                    </div>

                )}


            {/* ==================================================
                2. USUARIOS Y PERFILES
            ================================================== */}

            {subtab ===
                "Usuarios y Perfiles" && (

                    <div className="vm-card config-card">

                        <div className="vm-card-head">

                            <h3>
                                <span className="material-symbols-outlined" aria-hidden="true">group</span>
                                Usuarios y Control de Roles
                            </h3>


                            <button
                                className="vm-btn vm-btn-accent"
                                onClick={() =>
                                    setMostrarModalUsuario(
                                        true
                                    )
                                }
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">person_add</span>
                                Crear Nuevo Usuario
                            </button>

                        </div>


                        {errorUsuarios && (

                            <div className="vm-alert config-card-alerta" role="alert">
                                <span className="material-symbols-outlined" aria-hidden="true">error</span>
                                {errorUsuarios}
                            </div>

                        )}


                        <div className="os-table-wrapper">

                            <table className="os-table config-tabla-usuarios">

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

                                            <td colSpan="6">
                                                <div className="vm-loading config-card-carga">
                                                    Cargando usuarios...
                                                </div>
                                            </td>

                                        </tr>

                                    ) : usuarios.length === 0 ? (

                                        <tr>

                                            <td colSpan="6">
                                                <div className="vm-empty">
                                                    <span className="material-symbols-outlined" aria-hidden="true">group_off</span>
                                                    No hay usuarios registrados.
                                                </div>
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

                                                        <span className="vm-code">
                                                            #{u.user_id}
                                                        </span>

                                                    </td>


                                                    <td>
                                                        <strong>
                                                            {u.nombre}
                                                        </strong>
                                                    </td>


                                                    <td>
                                                        {u.email}
                                                    </td>


                                                    <td>

                                                        <span className="vm-badge vm-badge-info is-plain">

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
                                                            className={
                                                                `vm-badge ${u.activo
                                                                    ? "vm-badge-success"
                                                                    : "vm-badge-danger"
                                                                }`
                                                            }
                                                        >

                                                            {u.activo
                                                                ? "Activo"
                                                                : "Inactivo"}

                                                        </span>

                                                    </td>


                                                    <td>

                                                        <button
                                                            className={
                                                                `btn-act-table ${u.activo
                                                                    ? "config-accion-desactivar"
                                                                    : "nps"
                                                                }`
                                                            }
                                                            onClick={() =>
                                                                toggleEstadoUsuario(
                                                                    u.user_id
                                                                )
                                                            }
                                                        >

                                                            <span className="material-symbols-outlined" aria-hidden="true">power_settings_new</span>

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

                    <div className="vm-card config-card">

                        <div className="vm-card-head">

                            <h3>
                                <span className="material-symbols-outlined" aria-hidden="true">hub</span>
                                Integraciones de Comunicación
                                (Telegram & Email)
                            </h3>

                        </div>


                        <div className="vm-card-body config-integraciones">

                            {/* TELEGRAM */}

                            <div className="config-integracion">

                                <h4 className="vm-form-section-title">
                                    <span className="material-symbols-outlined" aria-hidden="true">send</span>
                                    Telegram Bot
                                </h4>

                                <p className="config-integracion-texto">
                                    Envío automático de citas,
                                    actualizaciones de órdenes
                                    de servicio, aprobaciones
                                    y notificaciones de entrega.
                                </p>


                                <div className="config-field">

                                    <label>
                                        Token del Bot de Telegram
                                    </label>

                                    <input
                                        type="password"
                                        placeholder="Token del bot de Telegram"
                                    />

                                </div>


                                <button
                                    className="vm-btn vm-btn-secondary"
                                    onClick={() =>
                                        alert(
                                            "La conexión con Telegram estará disponible cuando se configure el Bot."
                                        )
                                    }
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">bolt</span>
                                    Probar Conexión Telegram
                                </button>

                            </div>


                            {/* EMAIL */}

                            <div className="config-integracion">

                                <h4 className="vm-form-section-title">
                                    <span className="material-symbols-outlined" aria-hidden="true">mail</span>
                                    Servidor de Correo SMTP
                                </h4>

                                <p className="config-integracion-texto">
                                    Notificaciones de ODS,
                                    cotizaciones y facturas
                                    electrónicas vía e-mail.
                                </p>


                                <div className="config-field">

                                    <label>
                                        Host SMTP
                                    </label>

                                    <input
                                        type="text"
                                        value="smtp.veramotors.pe:587"
                                        readOnly
                                    />

                                </div>


                                <button
                                    className="vm-btn vm-btn-secondary"
                                    onClick={() =>
                                        alert(
                                            "La configuración de correo estará disponible cuando se conecte el servidor SMTP."
                                        )
                                    }
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">forward_to_inbox</span>
                                    Enviar Correo de Prueba
                                </button>

                            </div>

                        </div>

                    </div>

                )}


            {/* ==================================================
                4. SERIES Y COMPROBANTES
            ================================================== */}

            {subtab === "Series y Comprobantes" && (

                <div className="vm-card config-card">

                    <div className="vm-card-head">
                        <h3>
                            <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                            Configuración de Series y Correlativos SUNAT / Sistema
                        </h3>
                    </div>

                    <p className="config-card-intro">
                        Configura el prefijo y el número correlativo para cada tipo de documento emitido por VeraMotors.
                        El cambio entra en vigencia a partir del siguiente comprobante generado.
                    </p>

                    {errorSeries && (
                        <div className="vm-alert config-card-alerta" role="alert">
                            <span className="material-symbols-outlined" aria-hidden="true">error</span>
                            {errorSeries}
                        </div>
                    )}

                    {cargandoSeries ? (
                        <div className="vm-loading config-card-carga">
                            Cargando configuración de correlativos...
                        </div>

                    ) : series.length === 0 ? (
                        <div className="vm-empty">
                            <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                            No existen configuraciones de correlativos registradas.
                        </div>

                    ) : (

                        <div className="os-table-wrapper">
                            <table className="os-table config-tabla-series">
                                <thead>
                                    <tr>
                                        <th>Tipo de Documento</th>
                                        <th>Uso en el Sistema</th>
                                        <th className="config-col-compacta">Prefijo / Serie</th>
                                        <th className="config-col-compacta vm-num">Siguiente N°</th>
                                        <th>Vista Previa</th>
                                        <th className="config-centro">Estado</th>
                                        <th className="config-centro">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {series
                                        .slice()
                                        .sort((a, b) => {
                                            const orden = ["FACTURA", "BOLETA", "COTIZACION", "ODS", "NOTA_CREDITO", "NOTA_CREDITO_FACTURA", "NOTA_CREDITO_BOLETA", "NOTA_DEBITO", "NOTA_DEBITO_FACTURA", "NOTA_DEBITO_BOLETA", "REMISION", "COMPRA"];
                                            const posicion = (tipo) => {
                                                const indice = orden.indexOf(tipo);
                                                return indice === -1 ? orden.length : indice;
                                            };
                                            return posicion(a.tipo_documento) - posicion(b.tipo_documento);
                                        })
                                        .map((serie) => {
                                            const etiquetas = {
                                                FACTURA: { nombre: "Factura Electrónica", icono: "receipt_long", desc: "Ventas a empresas con RUC" },
                                                BOLETA: { nombre: "Boleta Electrónica", icono: "receipt", desc: "Ventas a personas naturales" },
                                                COTIZACION: { nombre: "Cotización de Servicios", icono: "request_quote", desc: "Presupuesto previo al servicio" },
                                                ODS: { nombre: "Orden de Servicio (ODS)", icono: "build", desc: "Ingreso de vehículo al taller" },
                                                NOTA_CREDITO: { nombre: "Nota de Crédito", icono: "undo", desc: "Anulación o devolución parcial" },
                                                NOTA_CREDITO_FACTURA: { nombre: "Nota de Crédito de Factura", icono: "undo", desc: "Anulación o devolución sobre una factura" },
                                                NOTA_CREDITO_BOLETA: { nombre: "Nota de Crédito de Boleta", icono: "undo", desc: "Anulación o devolución sobre una boleta" },
                                                NOTA_DEBITO: { nombre: "Nota de Débito", icono: "add_card", desc: "Cargos adicionales sobre un comprobante" },
                                                NOTA_DEBITO_FACTURA: { nombre: "Nota de Débito de Factura", icono: "add_card", desc: "Cargos adicionales sobre una factura" },
                                                NOTA_DEBITO_BOLETA: { nombre: "Nota de Débito de Boleta", icono: "add_card", desc: "Cargos adicionales sobre una boleta" },
                                                REMISION: { nombre: "Guía de Remisión", icono: "local_shipping", desc: "Traslado de bienes / repuestos" },
                                                COMPRA: { nombre: "Orden de Compra (ODC)", icono: "shopping_cart", desc: "Compras a proveedores" },
                                            };
                                            const meta = etiquetas[serie.tipo_documento] || { nombre: serie.tipo_documento, icono: "description", desc: "Documento interno" };
                                            const vistaPrevia = `${serie.prefijo}-${String(serie.siguiente_correlativo).padStart(5, "0")}`;

                                            return (
                                                <tr key={serie.correlativo_id}>
                                                    <td>
                                                        <div className="config-doc">
                                                            <span className="material-symbols-outlined config-doc-icono" aria-hidden="true">{meta.icono}</span>
                                                            <div>
                                                                <strong>{meta.nombre}</strong>
                                                                <small>{meta.desc}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <code className="vm-code config-code-neutro">
                                                            {serie.tipo_documento}
                                                        </code>
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="config-serie-input"
                                                            type="text"
                                                            value={serie.prefijo}
                                                            onChange={(e) => cambiarSerie(serie.correlativo_id, "prefijo", e.target.value)}
                                                            maxLength="10"
                                                        />
                                                    </td>
                                                    <td className="vm-num">
                                                        <input
                                                            className="config-serie-input config-serie-numero"
                                                            type="number"
                                                            min="1"
                                                            value={serie.siguiente_correlativo}
                                                            onChange={(e) => cambiarSerie(serie.correlativo_id, "siguiente_correlativo", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <code className="vm-code">
                                                            {vistaPrevia}
                                                        </code>
                                                    </td>
                                                    <td className="config-centro">
                                                        <span className={`vm-badge ${serie.activo ? "vm-badge-success" : "vm-badge-danger"}`}>
                                                            {serie.activo ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </td>
                                                    <td className="config-centro">
                                                        <button
                                                            type="button"
                                                            className="btn-act-table link"
                                                            disabled={guardandoSerie}
                                                            onClick={() => guardarCorrelativo(serie)}
                                                        >
                                                            <span className="material-symbols-outlined" aria-hidden="true">save</span>
                                                            Guardar
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>

            )}


            {/* ==================================================
                MODAL CREAR USUARIO
            ================================================== */}

            {mostrarModalUsuario && (

                <div className="modal-overlay">

                    <div className="modal-content config-modal">

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
                                aria-label="Cerrar"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>

                        </div>


                        <form
                            onSubmit={
                                agregarUsuario
                            }
                        >

                            <div className="modal-body">


                                <h4 className="vm-form-section-title">
                                    <span className="material-symbols-outlined" aria-hidden="true">person</span>
                                    Datos del usuario
                                </h4>

                                <div className="form-grid config-seccion-grid">


                                {/* NOMBRE */}

                                <div className="form-group form-group-full">

                                    <label>
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

                                <div className="form-group">

                                    <label>
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

                                <div className="form-group">

                                    <label>
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


                                </div>


                                <h4 className="vm-form-section-title">
                                    <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                                    Credenciales y estado
                                </h4>

                                <div className="form-grid config-seccion-grid">


                                {/* CONTRASEÑA */}

                                <div className="form-group">

                                    <label>
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

                                <div className="form-group">

                                    <label>
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

                                <div className="form-group form-group-full">

                                    <label>
                                        Estado
                                    </label>

                                    <select
                                        className="config-estado-fijo"
                                        value="Activo"
                                        disabled
                                    >

                                        <option value="Activo">
                                            Activo
                                        </option>

                                    </select>

                                </div>

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

