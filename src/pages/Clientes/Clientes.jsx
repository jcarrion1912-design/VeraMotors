import { useState, useEffect } from "react";
import "./Clientes.css";
import { actualizarCliente, obtenerClientes } from "../../services/clientesService";
import ModalNuevoCliente from "../../components/ModalNuevoCliente/ModalNuevoCliente";
import { obtenerUrlPdfFactura } from "../../services/facturacionService";
import { abrirDocumentoProtegido } from "../../services/autenticacion";

const API_URL = "http://127.0.0.1:8000/api";
const ESTADOS_ODS_CERRADOS = ["Completado", "Entrega", "Archivado", "Archivados"];
const HISTORIAL_INICIAL = 3;

const formatoSoles = (valor) =>
    `S/ ${Number(valor).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Clientes() {
    const [clienteSeleccionado, setClienteSeleccionado] = useState(0);
    const [historialCompleto, setHistorialCompleto] = useState(false);
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
            const listaOVacio = (url) =>
                fetch(url)
                    .then((res) => (res.ok ? res.json() : []))
                    .catch(() => []);

            const [resCli, resVeh, dataOds, dataFacturas] = await Promise.all([
                fetch(`${API_URL}/clientes`),
                fetch(`${API_URL}/vehiculos`),
                listaOVacio(`${API_URL}/ods`),
                listaOVacio(`${API_URL}/facturacion`)
            ]);

            if (resCli.ok && resVeh.ok) {
                const dataCli = await resCli.json();
                const dataVeh = await resVeh.json();

                const estructurados = dataCli.map((c) => {
                    const odsCliente = dataOds
                        .filter((o) => o.cliente_id === c.cliente_id)
                        .sort((a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso));
                    const facturasCliente = dataFacturas.filter((f) => f.cliente_id === c.cliente_id);

                    const vehs = dataVeh.filter((v) => v.cliente_id === c.cliente_id).map((v) => {
                        const odsVehiculo = odsCliente.filter((o) => o.vehiculo_id === v.vehiculo_id);
                        const ultimoKm = odsVehiculo.find((o) => o.kilometraje_ingreso != null)?.kilometraje_ingreso;
                        const servicioAbierto = odsVehiculo.some((o) => !ESTADOS_ODS_CERRADOS.includes(o.estado_actual));
                        return {
                            marca: v.marca,
                            modelo: v.modelo,
                            placa: v.placa,
                            anio: v.anio || "No registrado",
                            color: v.color || "No especificado",
                            vin: v.vin || "No especificado",
                            kilometraje: ultimoKm != null ? `${Number(ultimoKm).toLocaleString("es-PE")} km` : "Sin registro",
                            estado: servicioAbierto ? "Servicio pendiente" : "Al día"
                        };
                    });

                    const totalPagado = facturasCliente
                        .filter((f) => f.estado_pago === "Pagado")
                        .reduce((total, f) => total + Number(f.total || 0), 0);

                    const fechasCliente = [
                        ...odsCliente.map((o) => o.fecha_ingreso),
                        ...facturasCliente.map((f) => f.fecha_emision)
                    ].map((fecha) => new Date(fecha).getFullYear()).filter((anio) => !Number.isNaN(anio));

                    const historial = odsCliente.map((o) => {
                        const vehiculo = dataVeh.find((v) => v.vehiculo_id === o.vehiculo_id);
                        const facturasOds = facturasCliente.filter((f) => f.ods_id === o.ods_id);
                        return {
                            id: o.ods_id,
                            vehiculo: vehiculo
                                ? `${vehiculo.marca} ${vehiculo.modelo} · ${vehiculo.placa}`
                                : (o.vehiculo_placa || "Vehículo no encontrado"),
                            titulo: o.tipo_procedimiento || "Servicio general",
                            fecha: new Date(o.fecha_ingreso).toLocaleDateString("es-PE"),
                            monto: facturasOds.length > 0
                                ? formatoSoles(facturasOds.reduce((total, f) => total + Number(f.total || 0), 0))
                                : "Sin facturar",
                            descripcion: o.inspeccion_json?.motivo_servicio?.motivo_detallado || "Servicio en taller.",
                            estado: o.estado_actual || "Pendiente",
                            cerrado: ESTADOS_ODS_CERRADOS.includes(o.estado_actual),
                            facturaId: facturasOds[0]?.factura_id || null
                        };
                    });

                    const palabras = (c.nombre_razon_social || "").trim().split(" ");
                    const iniciales = palabras.length >= 2
                        ? (palabras[0][0] + palabras[1][0]).toUpperCase()
                        : (palabras[0]?.[0] || "C").toUpperCase();

                    return {
                        id: c.cliente_id,
                        tipoPersona: c.tipo_persona || "Natural",
                        nombre: c.nombre_razon_social,
                        documento: c.documento_identidad,
                        telefono: c.telefono || "",
                        correo: c.email || "",
                        ciudad: c.direccion_ubigeo || "",
                        desde: fechasCliente.length > 0 ? String(Math.min(...fechasCliente)) : "",
                        vehiculos: vehs.length,
                        ltv: formatoSoles(totalPagado),
                        iniciales: iniciales,
                        vehiculosData: vehs,
                        historial
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

                <div className="vm-card clientes-list">

                    {/* BUSCADOR */}

                    <div className="clientes-search">

                        <div className="vm-search">

                            <span className="material-symbols-outlined">
                                search
                            </span>

                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar cliente..."
                                aria-label="Buscar cliente por nombre o documento"
                            />

                        </div>

                    </div>


                    {/* CLIENTES */}

                    <div className={`clientes-list-content ${cargando ? "is-cargando" : ""}`}>

                        <div className="vm-loading clientes-cargando" role="status">
                            Cargando clientes...
                        </div>

                        {clientesFiltrados.length > 0 ? (

                            clientesFiltrados.map((item) => {

                                const posicionOriginal = clientes.findIndex(
                                    (cliente) => cliente.id === item.id
                                );

                                const activo =
                                    posicionOriginal === clienteSeleccionado;

                                return (
                                    <button
                                        key={item.id}
                                        className={`cliente-item ${activo ? "activo" : ""
                                            }`}
                                        onClick={() =>
                                            setClienteSeleccionado(
                                                posicionOriginal
                                            )
                                        }
                                        aria-current={activo}
                                    >

                                        <span className="cliente-item-header">

                                            <span className="cliente-item-nombre">
                                                {item.nombre}
                                            </span>

                                            <span className="cliente-vehiculos">

                                                <span className="material-symbols-outlined">
                                                    directions_car
                                                </span>

                                                {item.vehiculos}

                                            </span>

                                        </span>


                                        <span className="cliente-telefono">

                                            <span className="material-symbols-outlined">
                                                call
                                            </span>

                                            {item.telefono}

                                        </span>


                                        <span className="cliente-item-footer">

                                            <span className="cliente-ltv">
                                                Pagado: {item.ltv}
                                            </span>

                                            {activo && (
                                                <span className="cliente-ver">
                                                    Ver detalles
                                                    <span className="material-symbols-outlined">
                                                        arrow_forward
                                                    </span>
                                                </span>
                                            )}

                                        </span>

                                    </button>
                                );
                            })

                        ) : (

                            <div className="vm-empty clientes-sin-resultados">
                                <span className="material-symbols-outlined">
                                    person_search
                                </span>

                                <strong>
                                    No se encontraron clientes
                                </strong>
                            </div>

                        )}

                    </div>

                </div>


                {/* =========================================
                    DETALLE DEL CLIENTE
                ========================================= */}

                <div className="cliente-detalle-container">

                    <div className="vm-card cliente-detalle">

                        {/* HEADER CLIENTE */}

                        <div className="cliente-detalle-header">

                            <div className="cliente-detalle-info">

                                <div className="cliente-avatar">
                                    {cliente.iniciales}
                                </div>


                                <div className="cliente-detalle-main">

                                    <div className="cliente-detalle-top">

                                        <div className="cliente-detalle-nombre">

                                            <h3>
                                                {cliente.nombre}
                                            </h3>

                                            <p className="cliente-dato">

                                                <span className="material-symbols-outlined">
                                                    location_on
                                                </span>

                                                <span>
                                                    {cliente.ciudad || "Dirección no registrada"}
                                                    {cliente.desde ? ` · Cliente desde ${cliente.desde}` : ""}
                                                </span>

                                            </p>

                                            <p className="cliente-dato">

                                                <span className="material-symbols-outlined">
                                                    mail
                                                </span>

                                                <span>
                                                    {cliente.correo || "Correo no registrado"}
                                                </span>

                                            </p>

                                            <p className="cliente-dato">

                                                <span className="material-symbols-outlined">
                                                    call
                                                </span>

                                                <span>
                                                    {cliente.telefono || "Teléfono no registrado"}
                                                </span>

                                            </p>

                                        </div>


                                        <div className="vm-kpi cliente-ltv-box">

                                            <span className="vm-kpi-label">
                                                Total pagado por el cliente
                                            </span>

                                            <strong className="vm-kpi-value">
                                                {cliente.ltv}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* BOTONES */}

                                    <div className="cliente-acciones">

                                        {cliente.correo && cliente.correo !== "-" && (
                                            <a
                                                className="vm-btn vm-btn-secondary cliente-accion-enlace"
                                                href={`mailto:${cliente.correo}`}
                                            >

                                                <span className="material-symbols-outlined">
                                                    mail
                                                </span>

                                                Email

                                            </a>
                                        )}


                                        <button
                                            className="vm-btn vm-btn-primary"
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

                                <h4 className="cliente-seccion-titulo">
                                    <span className="material-symbols-outlined">
                                        directions_car
                                    </span>
                                    Vehículos registrados (
                                    {cliente.vehiculos}
                                    )
                                </h4>


                                <div className="vehiculos-list">

                                    {cliente.vehiculosData.map(
                                        (vehiculo, index) => (

                                            <div
                                                key={index}
                                                className="vehiculo-card"
                                            >

                                                {vehiculo.estado ===
                                                    "Servicio pendiente" && (

                                                        <div className="vm-badge vm-badge-warning vehiculo-estado">
                                                            Servicio pendiente
                                                        </div>

                                                    )}


                                                <div className="vehiculo-card-head">

                                                    <h5>
                                                        {vehiculo.marca}{" "}
                                                        {vehiculo.modelo}
                                                    </h5>


                                                    <span className="vm-plate">
                                                        {vehiculo.placa}
                                                    </span>

                                                </div>


                                                <div className="vehiculo-datos">

                                                    <span className="label">
                                                        Año
                                                    </span>

                                                    <span className="valor">
                                                        {vehiculo.anio}
                                                    </span>

                                                    <span className="label">
                                                        Color
                                                    </span>

                                                    <span className="valor">
                                                        {vehiculo.color}
                                                    </span>

                                                    <span className="label">
                                                        VIN
                                                    </span>

                                                    <span className="valor vehiculo-vin">
                                                        {vehiculo.vin}
                                                    </span>


                                                    <span className="label">
                                                        Último kilometraje
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

                                <div className="cliente-seccion-titulo historial-header">

                                    <h4>
                                        <span className="material-symbols-outlined">
                                            history
                                        </span>
                                        Historial de servicios
                                    </h4>

                                    {cliente.historial.length > HISTORIAL_INICIAL && (
                                        <button
                                            className="vm-btn vm-btn-ghost vm-btn-sm"
                                            onClick={() => setHistorialCompleto((actual) => !actual)}
                                        >
                                            {historialCompleto ? "Ver menos" : `Ver historial completo (${cliente.historial.length})`}
                                        </button>
                                    )}

                                </div>


                                {cliente.historial.length === 0 && (
                                    <div className="vm-empty">
                                        <span className="material-symbols-outlined">history</span>
                                        <span>Este cliente todavía no tiene órdenes de servicio.</span>
                                    </div>
                                )}

                                <div className="historial">

                                    {(historialCompleto ? cliente.historial : cliente.historial.slice(0, HISTORIAL_INICIAL)).map(
                                        (servicio) => (

                                            <div
                                                key={servicio.id}
                                                className="historial-item"
                                            >

                                                <div className="historial-punto"></div>


                                                <div className="historial-card">

                                                    <div className="historial-top">

                                                        <div className="historial-resumen">

                                                            <span className="historial-vehiculo">
                                                                {
                                                                    servicio.vehiculo
                                                                }
                                                            </span>

                                                            <h5>
                                                                {
                                                                    servicio.titulo
                                                                }
                                                            </h5>

                                                        </div>


                                                        <div className="historial-fecha">

                                                            {servicio.fecha}

                                                            <div className="vm-num historial-monto">
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

                                                        <span className={`vm-badge is-plain ${servicio.cerrado ? "vm-badge-success" : "vm-badge-info"}`}>

                                                            <span className="material-symbols-outlined">
                                                                {servicio.cerrado ? "check_circle" : "pending"}
                                                            </span>

                                                            {servicio.estado}

                                                        </span>


                                                        {servicio.facturaId && (
                                                            <a
                                                                className="btn-act-table link cliente-accion-enlace"
                                                                href={obtenerUrlPdfFactura(servicio.facturaId)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => abrirDocumentoProtegido(e, obtenerUrlPdfFactura(servicio.facturaId))}
                                                            >

                                                                <span className="material-symbols-outlined">
                                                                    receipt_long
                                                                </span>

                                                                Ver factura

                                                            </a>
                                                        )}

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
                    <div className="modal-content modal-cliente">
                        <div className="modal-header">
                            <div>
                                <h2>Editar cliente</h2>
                                <p>Actualiza la información del cliente seleccionado.</p>
                            </div>
                            <button type="button" className="btn-close" onClick={cerrarFormulario} aria-label="Cerrar">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form className="form-cliente" onSubmit={guardarEdicionCliente}>
                            <div className="modal-body">
                                <h3 className="vm-form-section-title">
                                    <span className="material-symbols-outlined">person</span>
                                    Información del cliente
                                </h3>
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

                            <div className="modal-footer">
                                <button type="button" className="btn-cancelar" onClick={cerrarFormulario}>Cancelar</button>
                                <button type="submit" className="btn-guardar-cliente"><span className="material-symbols-outlined">save</span>Guardar cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ModalNuevoCliente
                isOpen={mostrarFormulario}
                onClose={() => setMostrarFormulario(false)}
                onClienteRegistrado={async ({ cliente: nuevoCli, vehiculo: nuevoVeh }) => {
                    setMostrarFormulario(false);
                    await cargarDatos();
                    alert(
                        "¡Cliente y vehículo registrados correctamente!\n\n" +
                        `Cliente ID: ${nuevoCli?.cliente_id}\n` +
                        `Vehículo ID: ${nuevoVeh?.vehiculo_id || "Registrado"}`
                    );
                }}
            />
        </div>
    );
}

export default Clientes;