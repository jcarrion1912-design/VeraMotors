import { useState, useEffect } from "react";
import "./Clientes.css";
import { actualizarCliente, obtenerClientes } from "../../services/clientesService";

const API_URL = "http://127.0.0.1:8000/api";

function Clientes() {
    const [clienteSeleccionado, setClienteSeleccionado] = useState(0);
    const [busqueda, setBusqueda] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [tipoPersona, setTipoPersona] = useState("Natural");
    const [ubigeoDept, setUbigeoDept] = useState("Lima");
    const [ubigeoProv, setUbigeoProv] = useState("Lima");
    const [ubigeoDist, setUbigeoDist] = useState("San Isidro");

    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [mostrarEdicion, setMostrarEdicion] = useState(false);
    const [clienteEditar, setClienteEditar] = useState(null);

    // Form states
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [nuevoDoc, setNuevoDoc] = useState("");
    const [nuevoTelefono, setNuevoTelefono] = useState("");
    const [nuevoEmail, setNuevoEmail] = useState("");
    const [nuevaDireccion, setNuevaDireccion] = useState("");

    // Form states - vehículo
    const [nuevoTipoVehiculo, setNuevoTipoVehiculo] = useState("Automóvil");
    const [nuevaMarca, setNuevaMarca] = useState("");
    const [nuevoModelo, setNuevoModelo] = useState("");
    const [nuevaPlaca, setNuevaPlaca] = useState("");
    const [nuevoAnio, setNuevoAnio] = useState("");
    const [nuevoMotor, setNuevoMotor] = useState("");
    const [nuevoKilometraje, setNuevoKilometraje] = useState("");
    const [nuevoColor, setNuevoColor] = useState("");
    const [nuevoVin, setNuevoVin] = useState("");

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [resCli, resVeh] = await Promise.all([
                fetch(`${API_URL}/clientes`),
                fetch(`${API_URL}/vehiculos`)
            ]);

            if (resCli.ok && resVeh.ok) {
                const dataCli = await resCli.json();
                const dataVeh = await resVeh.json();

                const estructurados = dataCli.map((c) => {
                    const vehs = dataVeh.filter((v) => v.cliente_id === c.cliente_id).map((v) => ({
                        marca: v.marca,
                        modelo: v.modelo,
                        placa: v.placa,
                        anio: v.anio || "2022",
                        motor: "2.0",
                        kilometraje: "45,000 km",
                        estado: "Al día"
                    }));

                    const palabras = (c.nombre_razon_social || "").trim().split(" ");
                    const iniciales = palabras.length >= 2
                        ? (palabras[0][0] + palabras[1][0]).toUpperCase()
                        : (palabras[0]?.[0] || "C").toUpperCase();

                    return {
                        id: c.cliente_id,
                        tipoPersona: c.tipo_persona || "Natural",
                        nombre: c.nombre_razon_social,
                        documento: c.documento_identidad,
                        telefono: c.telefono || "+51 999 999 999",
                        correo: c.email || "cliente@correo.com",
                        ciudad: c.direccion_ubigeo || "Lima, Perú",
                        desde: "2024",
                        vehiculos: vehs.length,
                        ltv: "S/ 1,250.00",
                        iniciales: iniciales,
                        vehiculosData: vehs,
                        historial: [
                            {
                                vehiculo: vehs[0] ? `${vehs[0].marca} ${vehs[0].modelo} · ${vehs[0].placa}` : "Vehículo asignado",
                                titulo: "Mantenimiento preventivo",
                                fecha: "Reciente",
                                monto: "S/ 350.00",
                                descripcion: "Revisión general y servicios en taller.",
                                estado: "Completado"
                            }
                        ]
                    };
                });

                setClientes(estructurados);
            }
        } catch (error) {
            console.error("Error cargando clientes de BD:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const cliente = clientes[clienteSeleccionado] || {
        nombre: "Selecciona un cliente",
        telefono: "-",
        correo: "-",
        ciudad: "-",
        desde: "-",
        vehiculos: 0,
        ltv: "S/ 0.00",
        iniciales: "VM",
        vehiculosData: [],
        historial: []
    };

    const clientesFiltrados = clientes.filter((item) =>
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.documento && item.documento.includes(busqueda))
    );

    const cerrarFormulario = () => {
        setMostrarFormulario(false);
        setMostrarEdicion(false);
        setClienteEditar(null);
    };

    const abrirEdicionCliente = () => {
        if (!cliente || !cliente.id) return;

        setClienteEditar({
            cliente_id: cliente.id,
            tipo_persona: cliente.tipoPersona || "Natural",
            documento_identidad: cliente.documento || "",
            nombre_razon_social: cliente.nombre || "",
            telefono: cliente.telefono || "",
            email: cliente.correo || "",
            direccion_ubigeo: cliente.ciudad || ""
        });
        setMostrarEdicion(true);
    };

    const guardarEdicionCliente = async (e) => {
        e.preventDefault();

        if (!clienteEditar || !clienteEditar.cliente_id) return;

        const tipo = clienteEditar.tipo_persona;
        const documento = (clienteEditar.documento_identidad || "").trim();
        const nombre = (clienteEditar.nombre_razon_social || "").trim();
        const telefono = (clienteEditar.telefono || "").trim();
        const email = (clienteEditar.email || "").trim();
        const direccion = (clienteEditar.direccion_ubigeo || "").trim();

        // Validación de documento
        const documentoRegex = tipo === "Natural" ? /^\d{8}$/ : /^\d{11}$/;

        if (!documentoRegex.test(documento)) {
            alert(
                tipo === "Natural"
                    ? "El DNI debe tener exactamente 8 dígitos numéricos."
                    : "El RUC debe tener exactamente 11 dígitos numéricos."
            );
            return;
        }

        // Validación de nombre / razón social
        if (nombre.length < 2) {
            alert(
                tipo === "Natural"
                    ? "Ingresa los nombres y apellidos del cliente."
                    : "Ingresa la razón social de la empresa."
            );
            return;
        }

        // Validación de teléfono
        if (telefono && !/^\d{9}$/.test(telefono)) {
            alert("El teléfono/celular debe tener exactamente 9 dígitos numéricos.");
            return;
        }

        // Validación de correo
        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
        ) {
            alert("Ingresa un correo electrónico válido.");
            return;
        }

        // Validación de dirección
        if (!direccion) {
            alert("Ingresa la dirección del cliente.");
            return;
        }

        // Evitar documento duplicado en los clientes cargados
        const documentoDuplicado = clientes.some(
            (item) =>
                String(item.documento || "").trim() === documento &&
                String(item.id) !== String(clienteEditar.cliente_id)
        );

        if (documentoDuplicado) {
            alert("Ya existe un cliente registrado con ese documento.");
            return;
        }

        try {
            await actualizarCliente(clienteEditar.cliente_id, {
                tipo_persona: tipo,
                documento_identidad: documento,
                nombre_razon_social: nombre,
                direccion_ubigeo: direccion,
                telefono: telefono || null,
                email: email || null
            });

            setMostrarEdicion(false);
            setClienteEditar(null);
            await cargarDatos();
            alert("Perfil del cliente actualizado correctamente.");
        } catch (error) {
            console.error("Error actualizando cliente:", error);
            alert(error.message || "No se pudo actualizar el cliente.");
        }
    };

    const registrarCliente = async (e) => {
        e.preventDefault();

        // ==============================
        // DATOS DEL CLIENTE
        // ==============================
        const documento = nuevoDoc.trim();
        const nombre = nuevoNombre.trim();
        const telefono = nuevoTelefono.trim();
        const email = nuevoEmail.trim();

        // ==============================
        // DATOS DEL VEHÍCULO NUEVO
        // ==============================
        const tipoVehiculo = nuevoTipoVehiculo.trim();
        const marca = nuevaMarca.trim();
        const modelo = nuevoModelo.trim();
        const placa = nuevaPlaca.trim().toUpperCase();
        const anio = nuevoAnio.trim();
        const color = nuevoColor.trim();
        const vin = nuevoVin.trim().toUpperCase();

        // ==============================
        // VALIDACIONES CLIENTE
        // ==============================
        const documentoRegex =
            tipoPersona === "Natural" ? /^\d{8}$/ : /^\d{11}$/;

        if (!documentoRegex.test(documento)) {
            alert(
                tipoPersona === "Natural"
                    ? "El DNI debe tener exactamente 8 dígitos numéricos."
                    : "El RUC debe tener exactamente 11 dígitos numéricos."
            );
            return;
        }

        if (nombre.length < 2) {
            alert(
                tipoPersona === "Natural"
                    ? "Ingresa los nombres y apellidos del cliente."
                    : "Ingresa la razón social de la empresa."
            );
            return;
        }

        if (telefono && !/^\d{9}$/.test(telefono)) {
            alert("El teléfono/celular debe tener exactamente 9 dígitos.");
            return;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            alert("Ingresa un correo electrónico válido.");
            return;
        }

        if (!ubigeoDept.trim() || !ubigeoProv.trim() || !ubigeoDist.trim()) {
            alert("Completa Departamento, Provincia y Distrito.");
            return;
        }

        const documentoDuplicado = clientes.some(
            (item) => String(item.documento || "").trim() === documento
        );

        if (documentoDuplicado) {
            alert("Ya existe un cliente registrado con ese documento.");
            return;
        }

        // ==============================
        // VALIDACIONES VEHÍCULO
        // El vehículo es nuevo y se registra
        // junto con el cliente.
        // ==============================
        if (!tipoVehiculo) {
            alert("Selecciona el tipo de vehículo.");
            return;
        }

        if (!marca) {
            alert("Ingresa la marca del vehículo.");
            return;
        }

        if (!modelo) {
            alert("Ingresa el modelo del vehículo.");
            return;
        }

        if (!placa) {
            alert("Ingresa la placa del vehículo.");
            return;
        }

        if (anio && !/^\d{4}$/.test(anio)) {
            alert("El año del vehículo debe tener 4 dígitos.");
            return;
        }

        try {
            // ==============================
            // PASO 1: CREAR CLIENTE
            // ==============================
            const clienteBody = {
                tipo_persona: tipoPersona,
                documento_identidad: documento,
                nombre_razon_social: nombre,
                direccion_ubigeo: `${ubigeoDept.trim()} - ${ubigeoDist.trim()}`,
                telefono: telefono || null,
                email: email || null
            };

            console.log("1. Registrando cliente:", clienteBody);

            const resCliente = await fetch(`${API_URL}/clientes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(clienteBody)
            });

            if (!resCliente.ok) {
                let mensaje = "No se pudo registrar el cliente.";

                try {
                    const errorData = await resCliente.json();

                    if (typeof errorData.detail === "string") {
                        mensaje = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        mensaje = errorData.detail
                            .map((item) => item.msg)
                            .filter(Boolean)
                            .join("\n");
                    }
                } catch {
                    // Mantener mensaje genérico si la respuesta no es JSON.
                }

                throw new Error(mensaje);
            }

            const clienteCreado = await resCliente.json();
            const clienteId = clienteCreado.cliente_id;

            console.log("2. Cliente creado. ID:", clienteId);

            if (!clienteId) {
                throw new Error(
                    "El cliente se creó, pero el backend no devolvió su cliente_id."
                );
            }

            // ==============================
            // PASO 2: CREAR VEHÍCULO
            // EN LA TABLA vehiculos
            // ==============================
            const vehiculoBody = {
                cliente_id: Number(clienteId),
                tipo_vehiculo: tipoVehiculo,
                placa: placa,
                marca: marca,
                modelo: modelo,
                anio: anio ? Number(anio) : null,
                color: color || null,
                vin: vin || null
            };

            console.log("3. Registrando vehículo:", vehiculoBody);

            const resVehiculo = await fetch(`${API_URL}/vehiculos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(vehiculoBody)
            });

            if (!resVehiculo.ok) {
                let mensaje = "El cliente se registró, pero el vehículo no pudo guardarse.";

                try {
                    const errorData = await resVehiculo.json();

                    if (typeof errorData.detail === "string") {
                        mensaje = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        mensaje = errorData.detail
                            .map((item) => item.msg)
                            .filter(Boolean)
                            .join("\n");
                    }
                } catch {
                    // Mantener mensaje anterior.
                }

                throw new Error(mensaje);
            }

            const vehiculoCreado = await resVehiculo.json();

            console.log("4. Vehículo creado:", vehiculoCreado);

            // ==============================
            // LIMPIAR FORMULARIO
            // ==============================
            setMostrarFormulario(false);

            setNuevoNombre("");
            setNuevoDoc("");
            setNuevoTelefono("");
            setNuevoEmail("");
            setTipoPersona("Natural");

            setUbigeoDept("Lima");
            setUbigeoProv("Lima");
            setUbigeoDist("San Isidro");

            setNuevoTipoVehiculo("Automóvil");
            setNuevaMarca("");
            setNuevoModelo("");
            setNuevaPlaca("");
            setNuevoAnio("");
            setNuevoMotor("");
            setNuevoKilometraje("");
            setNuevoColor("");
            setNuevoVin("");

            // Volver a consultar clientes y vehículos.
            await cargarDatos();

            alert(
                `¡Cliente y vehículo registrados correctamente!\n\n` +
                `Cliente ID: ${clienteId}\n` +
                `Vehículo ID: ${vehiculoCreado.vehiculo_id}`
            );

        } catch (error) {
            console.error("Error registrando cliente y vehículo:", error);
            alert(error.message || "Error al guardar cliente y vehículo.");
        }
    };

    return (
        <div className="clientes-page">

            {/* =========================================
                CABECERA
            ========================================= */}

            <div className="clientes-header">
                <div>
                    <h2>Clientes</h2>

                    <p>
                        Gestiona los perfiles de clientes y su historial de servicios.
                    </p>
                </div>

                <button
                    className="btn-nuevo-cliente"
                    onClick={() => setMostrarFormulario(true)}
                >
                    <span className="material-symbols-outlined">
                        person_add
                    </span>

                    Nuevo Cliente
                </button>
            </div>


            {/* =========================================
                MASTER DETAIL
            ========================================= */}

            <div className="clientes-layout">

                {/* =========================================
                    LISTA DE CLIENTES
                ========================================= */}

                <div className="clientes-list">

                    {/* BUSCADOR */}

                    <div className="clientes-search">

                        <div className="clientes-search-box">

                            <span className="material-symbols-outlined">
                                search
                            </span>

                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar cliente..."
                            />

                        </div>

                    </div>


                    {/* CLIENTES */}

                    <div className="clientes-list-content">

                        {clientesFiltrados.length > 0 ? (

                            clientesFiltrados.map((item) => {

                                const posicionOriginal = clientes.findIndex(
                                    (cliente) => cliente.id === item.id
                                );

                                const activo =
                                    posicionOriginal === clienteSeleccionado;

                                return (
                                    <div
                                        key={item.id}
                                        className={`cliente-item ${activo ? "activo" : ""
                                            }`}
                                        onClick={() =>
                                            setClienteSeleccionado(
                                                posicionOriginal
                                            )
                                        }
                                    >

                                        <div className="cliente-item-header">

                                            <h3>
                                                {item.nombre}
                                            </h3>

                                            <span className="cliente-vehiculos">

                                                <span className="material-symbols-outlined">
                                                    directions_car
                                                </span>

                                                {item.vehiculos}

                                            </span>

                                        </div>


                                        <div className="cliente-telefono">

                                            <span className="material-symbols-outlined">
                                                call
                                            </span>

                                            {item.telefono}

                                        </div>


                                        <div className="cliente-item-footer">

                                            <span className="cliente-ltv">
                                                LTV: {item.ltv}
                                            </span>

                                            {activo && (
                                                <span className="cliente-ver">
                                                    Ver detalles →
                                                </span>
                                            )}

                                        </div>

                                    </div>
                                );
                            })

                        ) : (

                            <div className="clientes-sin-resultados">
                                <span className="material-symbols-outlined">
                                    person_search
                                </span>

                                <p>
                                    No se encontraron clientes
                                </p>
                            </div>

                        )}

                    </div>

                </div>


                {/* =========================================
                    DETALLE DEL CLIENTE
                ========================================= */}

                <div className="cliente-detalle-container">

                    <div className="cliente-detalle">

                        {/* HEADER CLIENTE */}

                        <div className="cliente-detalle-header">

                            <div className="cliente-detalle-info">

                                <div className="cliente-avatar">
                                    {cliente.iniciales}
                                </div>


                                <div className="cliente-detalle-main">

                                    <div className="cliente-detalle-top">

                                        <div className="cliente-detalle-nombre">

                                            <h1>
                                                {cliente.nombre}
                                            </h1>

                                            <p className="cliente-ubicacion">

                                                <span className="material-symbols-outlined">
                                                    location_on
                                                </span>

                                                {cliente.ciudad} · Cliente desde{" "}
                                                {cliente.desde}

                                            </p>

                                            <p className="cliente-correo">

                                                <span className="material-symbols-outlined">
                                                    mail
                                                </span>

                                                {cliente.correo}

                                            </p>

                                            <p className="cliente-correo">

                                                <span className="material-symbols-outlined">
                                                    call
                                                </span>

                                                {cliente.telefono}

                                            </p>

                                        </div>


                                        <div className="cliente-ltv-box">

                                            <span>
                                                Valor total del cliente
                                            </span>

                                            <strong>
                                                {cliente.ltv}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* BOTONES */}

                                    <div className="cliente-acciones">

                                        <button
                                            className="btn-cliente"
                                            onClick={() =>
                                                alert(
                                                    `Correo: ${cliente.correo}`
                                                )
                                            }
                                        >

                                            <span className="material-symbols-outlined">
                                                mail
                                            </span>

                                            Email

                                        </button>


                                        <button
                                            className="btn-cliente"
                                            onClick={abrirEdicionCliente}
                                        >

                                            <span className="material-symbols-outlined">
                                                edit
                                            </span>

                                            Editar perfil

                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* =========================================
                            CUERPO
                        ========================================= */}

                        <div className="cliente-detalle-body">

                            {/* VEHICULOS */}

                            <div className="vehiculos-section">

                                <h3>
                                    Vehículos registrados (
                                    {cliente.vehiculos}
                                    )
                                </h3>


                                <div className="vehiculos-list">

                                    {cliente.vehiculosData.map(
                                        (vehiculo, index) => (

                                            <div
                                                key={index}
                                                className="vehiculo-card"
                                            >

                                                {vehiculo.estado ===
                                                    "Servicio pendiente" && (

                                                        <div className="vehiculo-estado">
                                                            Servicio pendiente
                                                        </div>

                                                    )}


                                                <h4>
                                                    {vehiculo.marca}{" "}
                                                    {vehiculo.modelo}
                                                </h4>


                                                <span className="vehiculo-placa">
                                                    {vehiculo.placa}
                                                </span>


                                                <div className="vehiculo-datos">

                                                    <span className="label">
                                                        Año:
                                                    </span>

                                                    <span className="valor">
                                                        {vehiculo.anio}
                                                    </span>


                                                    <span className="label">
                                                        Motor:
                                                    </span>

                                                    <span className="valor">
                                                        {vehiculo.motor}
                                                    </span>


                                                    <span className="label">
                                                        Kilometraje:
                                                    </span>

                                                    <span className="valor">
                                                        {vehiculo.kilometraje}
                                                    </span>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>


                            {/* HISTORIAL */}

                            <div className="historial-section">

                                <div className="historial-header">

                                    <h3>
                                        Historial de servicios
                                    </h3>

                                    <button className="btn-ver-historial">
                                        Ver historial completo
                                    </button>

                                </div>


                                <div className="historial">

                                    {cliente.historial.map(
                                        (servicio, index) => (

                                            <div
                                                key={index}
                                                className="historial-item"
                                            >

                                                <div className="historial-punto"></div>


                                                <div className="historial-card">

                                                    <div className="historial-top">

                                                        <div>

                                                            <span className="historial-vehiculo">
                                                                {
                                                                    servicio.vehiculo
                                                                }
                                                            </span>

                                                            <h4>
                                                                {
                                                                    servicio.titulo
                                                                }
                                                            </h4>

                                                        </div>


                                                        <div className="historial-fecha">

                                                            {servicio.fecha}

                                                            <div className="historial-monto">
                                                                {
                                                                    servicio.monto
                                                                }
                                                            </div>

                                                        </div>

                                                    </div>


                                                    <p className="historial-descripcion">
                                                        {
                                                            servicio.descripcion
                                                        }
                                                    </p>


                                                    <div className="historial-footer">

                                                        <span className="estado-completado">

                                                            <span className="material-symbols-outlined">
                                                                check_circle
                                                            </span>

                                                            {servicio.estado}

                                                        </span>


                                                        <button className="btn-factura">

                                                            <span className="material-symbols-outlined">
                                                                receipt_long
                                                            </span>

                                                            Ver factura

                                                        </button>

                                                    </div>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =========================================
                MODAL NUEVO CLIENTE
            ========================================= */}

            {mostrarEdicion && clienteEditar && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) cerrarFormulario();
                }}>
                    <div className="modal-cliente">
                        <div className="modal-cliente-header">
                            <div>
                                <h2>Editar cliente</h2>
                                <p>Actualiza la información del cliente seleccionado.</p>
                            </div>
                            <button type="button" className="btn-cerrar-modal" onClick={cerrarFormulario}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form className="form-cliente" onSubmit={guardarEdicionCliente}>
                            <div className="form-section">
                                <h3>Información del cliente</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Tipo de cliente</label>
                                        <select value={clienteEditar.tipo_persona} onChange={(e) => setClienteEditar({ ...clienteEditar, tipo_persona: e.target.value })}>
                                            <option value="Natural">Persona natural</option>
                                            <option value="Jurídica">Empresa</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Documento</label>
                                        <input
                                            type="text"
                                            value={clienteEditar.documento_identidad}
                                            onChange={(e) =>
                                                setClienteEditar({
                                                    ...clienteEditar,
                                                    documento_identidad: e.target.value.replace(/\D/g, "")
                                                })
                                            }
                                            maxLength={clienteEditar.tipo_persona === "Natural" ? 8 : 11}
                                            inputMode="numeric"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Nombre / Razón Social</label>
                                        <input type="text" value={clienteEditar.nombre_razon_social} onChange={(e) => setClienteEditar({ ...clienteEditar, nombre_razon_social: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input
                                            type="tel"
                                            value={clienteEditar.telefono}
                                            onChange={(e) =>
                                                setClienteEditar({
                                                    ...clienteEditar,
                                                    telefono: e.target.value.replace(/\D/g, "")
                                                })
                                            }
                                            maxLength={9}
                                            inputMode="numeric"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Correo</label>
                                        <input type="email" value={clienteEditar.email} onChange={(e) => setClienteEditar({ ...clienteEditar, email: e.target.value })} />
                                    </div>
                                    <div className="form-group form-group-full">
                                        <label>Dirección</label>
                                        <input type="text" value={clienteEditar.direccion_ubigeo} onChange={(e) => setClienteEditar({ ...clienteEditar, direccion_ubigeo: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-cliente-footer">
                                <button type="button" className="btn-cancelar" onClick={cerrarFormulario}>Cancelar</button>
                                <button type="submit" className="btn-guardar-cliente"><span className="material-symbols-outlined">save</span>Guardar cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarFormulario && (

                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            cerrarFormulario();
                        }
                    }}
                >

                    <div className="modal-cliente">

                        {/* HEADER */}

                        <div className="modal-cliente-header">

                            <div>

                                <h2>
                                    Nuevo Cliente
                                </h2>

                                <p>
                                    Registra la información del nuevo cliente.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="btn-cerrar-modal"
                                onClick={cerrarFormulario}
                            >

                                <span className="material-symbols-outlined">
                                    close
                                </span>

                            </button>

                        </div>


                        {/* FORMULARIO */}

                        <form
                            className="form-cliente"
                            onSubmit={registrarCliente}
                        >

                            {/* INFORMACIÓN DEL CLIENTE */}

                            <div className="form-section">

                                <h3>
                                    Información del cliente
                                </h3>


                                <div className="form-grid">

                                    <div className="form-group">

                                        <label>
                                            Tipo de cliente
                                        </label>

                                        <select
                                            value={tipoPersona}
                                            onChange={(e) => setTipoPersona(e.target.value)}
                                        >

                                            <option value="Natural">
                                                Persona natural
                                            </option>

                                            <option value="Jurídica">
                                                Empresa
                                            </option>

                                        </select>

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            {tipoPersona === "Natural" ? "DNI (8 dígitos)" : "RUC (11 dígitos)"}
                                        </label>

                                        <input
                                            type="text"
                                            value={nuevoDoc}
                                            onChange={(e) => setNuevoDoc(e.target.value)}
                                            placeholder={tipoPersona === "Natural" ? "Ingrese DNI" : "Ingrese RUC"}
                                            required
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            {tipoPersona === "Natural" ? "Nombres y Apellidos" : "Razón Social"}
                                        </label>

                                        <input
                                            type="text"
                                            value={nuevoNombre}
                                            onChange={(e) => setNuevoNombre(e.target.value)}
                                            placeholder={tipoPersona === "Natural" ? "Ingrese nombres completos" : "Ingrese Razón Social"}
                                            required
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Teléfono / Celular
                                        </label>

                                        <input
                                            type="tel"
                                            value={nuevoTelefono}
                                            onChange={(e) => setNuevoTelefono(e.target.value)}
                                            placeholder="Ingrese teléfono"
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Correo electrónico
                                        </label>

                                        <input
                                            type="email"
                                            value={nuevoEmail}
                                            onChange={(e) => setNuevoEmail(e.target.value)}
                                            placeholder="Ingrese correo"
                                        />

                                    </div>


                                    <div className="form-group form-group-full">

                                        <label>
                                            Dirección Ubigeo (Departamento, Provincia, Distrito - Autoguarda última)
                                        </label>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                            <input type="text" value={ubigeoDept} onChange={(e) => setUbigeoDept(e.target.value)} placeholder="Departamento" required />
                                            <input type="text" value={ubigeoProv} onChange={(e) => setUbigeoProv(e.target.value)} placeholder="Provincia" required />
                                            <input type="text" value={ubigeoDist} onChange={(e) => setUbigeoDist(e.target.value)} placeholder="Distrito" required />
                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* INFORMACIÓN VEHÍCULO */}

                            <div className="form-section">

                                <h3>
                                    Información del vehículo
                                </h3>


                                <div className="form-grid">

                                    <div className="form-group">

                                        <label>
                                            Tipo de vehículo
                                        </label>

                                        <select
                                            value={nuevoTipoVehiculo}
                                            onChange={(e) => setNuevoTipoVehiculo(e.target.value)}
                                        >
                                            <option value="Automóvil">Automóvil</option>
                                            <option value="SUV">SUV</option>
                                            <option value="Camioneta">Camioneta</option>
                                            <option value="Camión">Camión</option>
                                            <option value="Motocicleta">Motocicleta</option>
                                            <option value="Otro">Otro</option>
                                        </select>

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Marca
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Ej. Toyota"
                                            value={nuevaMarca}
                                            onChange={(e) => setNuevaMarca(e.target.value)}
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Modelo
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Ej. Corolla"
                                            value={nuevoModelo}
                                            onChange={(e) => setNuevoModelo(e.target.value)}
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Placa
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Ej. ABC-123"
                                            value={nuevaPlaca}
                                            onChange={(e) => setNuevaPlaca(e.target.value)}
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Año
                                        </label>

                                        <input
                                            type="number"
                                            placeholder="Ej. 2024"
                                            value={nuevoAnio}
                                            onChange={(e) => setNuevoAnio(e.target.value)}
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Motor
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Ej. 2.0"
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Kilometraje
                                        </label>

                                        <input
                                            type="number"
                                            placeholder="Ej. 45000"
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* FOOTER */}

                            <div className="modal-cliente-footer">

                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={cerrarFormulario}
                                >
                                    Cancelar
                                </button>


                                <button
                                    type="submit"
                                    className="btn-guardar-cliente"
                                >

                                    <span className="material-symbols-outlined">
                                        save
                                    </span>

                                    Registrar cliente

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Clientes;