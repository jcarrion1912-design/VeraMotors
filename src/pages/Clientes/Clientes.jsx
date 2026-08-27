import { useState, useEffect } from "react";
import "./Clientes.css";

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

    // Form states
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [nuevoDoc, setNuevoDoc] = useState("");
    const [nuevoTelefono, setNuevoTelefono] = useState("");
    const [nuevoEmail, setNuevoEmail] = useState("");
    const [nuevaDireccion, setNuevaDireccion] = useState("");

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
    };

    const registrarCliente = async (e) => {
        e.preventDefault();
        if (!nuevoNombre.trim() || !nuevoDoc.trim()) {
            alert("Por favor completa el nombre o razón social y documento.");
            return;
        }

        try {
            const body = {
                tipo_persona: tipoPersona,
                documento_identidad: nuevoDoc.trim(),
                nombre_razon_social: nuevoNombre.trim(),
                direccion_ubigeo: `${ubigeoDept} - ${ubigeoDist}`,
                telefono: nuevoTelefono.trim() || null,
                email: nuevoEmail.trim() || null
            };

            const res = await fetch(`${API_URL}/clientes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Error al crear cliente.");
            }

            alert("¡Cliente registrado exitosamente en PostgreSQL!");
            setMostrarFormulario(false);
            setNuevoNombre("");
            setNuevoDoc("");
            setNuevoTelefono("");
            setNuevoEmail("");
            await cargarDatos();
        } catch (error) {
            console.error("Error registrando cliente:", error);
            alert(error.message || "Error al guardar en base de datos.");
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
                                            onClick={() =>
                                                alert(
                                                    "Aquí se abrirá la edición del cliente"
                                                )
                                            }
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

                                            <option value="persona">
                                                Persona natural
                                            </option>

                                            <option value="empresa">
                                                Empresa
                                            </option>

                                        </select>

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            {tipoPersona === "persona" ? "DNI (8 dígitos)" : "RUC (11 dígitos)"}
                                        </label>

                                        <input
                                            type="text"
                                            value={nuevoDoc}
                                            onChange={(e) => setNuevoDoc(e.target.value)}
                                            placeholder={tipoPersona === "persona" ? "Ingrese DNI" : "Ingrese RUC"}
                                            required
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            {tipoPersona === "persona" ? "Nombres y Apellidos" : "Razón Social"}
                                        </label>

                                        <input
                                            type="text"
                                            value={nuevoNombre}
                                            onChange={(e) => setNuevoNombre(e.target.value)}
                                            placeholder={tipoPersona === "persona" ? "Ingrese nombres completos" : "Ingrese Razón Social"}
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
                                            <input type="text" value={ubigeoDept} onChange={(e) => setUbigeoDept(e.target.value)} placeholder="Departamento" />
                                            <input type="text" value={ubigeoProv} onChange={(e) => setUbigeoProv(e.target.value)} placeholder="Provincia" />
                                            <input type="text" value={ubigeoDist} onChange={(e) => setUbigeoDist(e.target.value)} placeholder="Distrito" />
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
                                            Marca
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Ej. Toyota"
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Modelo
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Ej. Corolla"
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Placa
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Ej. ABC-123"
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Año
                                        </label>

                                        <input
                                            type="number"
                                            placeholder="Ej. 2024"
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