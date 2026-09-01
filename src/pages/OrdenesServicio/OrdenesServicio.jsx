import { useEffect, useState } from "react";
import { useRole } from "../../context/RoleContext";
import DiagramaVehiculo from "../../components/DiagramaVehiculo";
import { obtenerODS } from "../../services/odsService";
import { obtenerUsuarios } from "../../services/usuariosService";
import "./OrdenesServicio.css";

function OrdenesServicio() {
    const { rolActivo, ROLES, agregarNotificacion } = useRole();
    const esTecnico = rolActivo === ROLES.TECNICO;

    // Submenú de estados
    const [estadoActivo, setEstadoActivo] = useState("Recepción");
    const [filtroBusqueda, setFiltroBusqueda] = useState("");
    const [filtroFecha, setFiltroFecha] = useState("");

    // Modal de Nueva ODS / Edición
    const [modoEdicion, setModoEdicion] = useState(false);

    // Datos del Registro de Vehículo
    const [tipoVehiculo, setTipoVehiculo] = useState("Automóvil");
    const [marca, setMarca] = useState("Toyota");
    const [modelo, setModelo] = useState("Corolla");
    const [anio, setAnio] = useState("2021");
    const [placa, setPlaca] = useState("ABC-123");
    const [color, setColor] = useState("Blanco");
    const [vin, setVin] = useState("8HGD39485739281");
    const [cliente, setCliente] = useState("Carlos Mendoza");
    const [tecnico, setTecnico] = useState("Luis García");
    const [kilometraje, setKilometraje] = useState("84500");

    // Motivo del Servicio
    const [realizaraDiagnostico, setRealizaraDiagnostico] = useState("Sí");
    const [cotizacionPrevia, setCotizacionPrevia] = useState("Sin Cotización");
    const [procedimiento, setProcedimiento] = useState("Preventivo");
    const [motivoDetallado, setMotivoDetallado] = useState("Ruido inusual en frenos traseros al desacelerar.");
    const [fotosMotivo, setFotosMotivo] = useState([]);

    // Checklist de Inspección
    const [nivelCombustible, setNivelCombustible] = useState("1/2");
    const [fluidos, setFluidos] = useState({
        aceite: "Correcto",
        frenos: "Bajo",
        embrague: "Correcto",
        refrigerante: "Correcto",
        hidraulico: "Correcto",
        limpiaparabrisas: "Requiere Cambio"
    });
    const [inventarioVehicular, setInventarioVehicular] = useState({
        kitEmergencia: true,
        llantaRepuesto: true,
        botiquin: true,
        extintor: true
    });
    const [documentos, setDocumentos] = useState({
        tarjetaPropiedad: true,
        soat: true,
        revisionTecnica: false
    });
    const [danios, setDanios] = useState({});

    // Modales de Flujos Especiales (Cliente, Diagnóstico Técnico, Entrega NPS, Trazabilidad)
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
    const [estadoAprobacionCliente, setEstadoAprobacionCliente] = useState("Pendiente");
    const [mostrarModalAdvertenciaDiagnostico, setMostrarModalAdvertenciaDiagnostico] = useState(false);
    const [mostrarModalDiagnostico, setMostrarModalDiagnostico] = useState(false);
    const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
    const [mostrarModalTrazabilidad, setMostrarModalTrazabilidad] = useState(false);

    // Diagnóstico Técnico
    const [fallasRegistradas, setFallasRegistradas] = useState([
        { id: 1, falla: "Desgaste severo en pastillas de freno traseras", comentarios: "Espesor de pasta < 2mm", horasHombre: 2, repuestos: [{ codigo: "BRK-892-C", nombre: "Pastillas Brembo", cant: 2 }] }
    ]);
    const [nuevaFalla, setNuevaFalla] = useState("");
    const [nuevosComentarios, setNuevosComentarios] = useState("");
    const [horasHombreFalla, setHorasHombreFalla] = useState("1.5");
    const [repuestoBusqueda, setRepuestoBusqueda] = useState("");
    const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);

    // Encuesta NPS
    const [npsPuntaje, setNpsPuntaje] = useState(10);
    const [npsComentario, setNpsComentario] = useState("Excelente servicio y atención puntual.");

    const [listaODS, setListaODS] = useState([]);
    const [usuariosAPI, setUsuariosAPI] = useState([]);
    const [clientesAPI, setClientesAPI] = useState([]);
    const [vehiculosCliente, setVehiculosCliente] = useState([]);
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState("");
    const [vehiculoSeleccionadoId, setVehiculoSeleccionadoId] = useState("");
    const [asesorSeleccionadoId, setAsesorSeleccionadoId] = useState("");
    const [tecnicoSeleccionadoId, setTecnicoSeleccionadoId] = useState("");

    const cargarDatosODS = async () => {
        try {
            const [odsData, usuariosData, clientesData] = await Promise.all([
                obtenerODS(),
                obtenerUsuarios(),
                fetch("http://127.0.0.1:8000/api/clientes").then((res) => res.ok ? res.json() : [])
            ]);

            const listaNormalizada = Array.isArray(odsData)
                ? odsData.map((item) => {
                    const tecnico = Array.isArray(usuariosData)
                        ? usuariosData.find((u) => Number(u.user_id) === Number(item.tecnico_id))
                        : null;

                    const fechaIngreso = item.fecha_ingreso ? new Date(item.fecha_ingreso) : new Date();

                    return {
                        id: `ODS-${item.ods_id}`,
                        cliente: item.cliente_nombre || "Cliente sin nombre",
                        placa: item.vehiculo_placa || "Sin placa",
                        marca: item.tipo_procedimiento || "Servicio",
                        estado: item.estado_actual || "Recepción",
                        fecha: fechaIngreso.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }),
                        tecnico: tecnico ? tecnico.nombre : `Técnico ${item.tecnico_id || "sin asignar"}`,
                        asignadoHaceMinutos: Math.max(1, Math.round((Date.now() - fechaIngreso.getTime()) / 60000)),
                        procedimiento: item.tipo_procedimiento || "Preventivo"
                    };
                })
                : [];

            const asesores = Array.isArray(usuariosData)
                ? usuariosData.filter((u) => u.rol === "Asesor de Servicio" || Number(u.rol_id) === 2)
                : [];
            const tecnicos = Array.isArray(usuariosData)
                ? usuariosData.filter((u) => u.rol === "Técnico Automotriz" || Number(u.rol_id) === 4)
                : [];

            setListaODS(listaNormalizada);
            setUsuariosAPI(Array.isArray(usuariosData) ? usuariosData : []);
            setClientesAPI(Array.isArray(clientesData) ? clientesData : []);

            if (Array.isArray(clientesData) && clientesData.length > 0 && !clienteSeleccionadoId) {
                setClienteSeleccionadoId(String(clientesData[0].cliente_id));
            }

            if (asesores.length > 0 && !asesorSeleccionadoId) {
                setAsesorSeleccionadoId(String(asesores[0].user_id));
            }

            if (tecnicos.length > 0 && !tecnicoSeleccionadoId) {
                setTecnicoSeleccionadoId(String(tecnicos[0].user_id));
            }
        } catch (error) {
            console.error("Error cargando ODS reales:", error);
            setListaODS([]);
            setUsuariosAPI([]);
            setClientesAPI([]);
        }
    };

    useEffect(() => {
        cargarDatosODS();
    }, []);

    useEffect(() => {
        const cargarVehiculosDelCliente = async () => {
            if (!clienteSeleccionadoId) {
                setVehiculosCliente([]);
                setVehiculoSeleccionadoId("");
                return;
            }

            try {
                const res = await fetch(`http://127.0.0.1:8000/api/vehiculos?cliente_id=${clienteSeleccionadoId}`);
                const data = await res.json();
                const vehiculos = Array.isArray(data) ? data : [];
                setVehiculosCliente(vehiculos);

                if (vehiculos.length > 0) {
                    const primerVehiculo = vehiculos[0];
                    setVehiculoSeleccionadoId(String(primerVehiculo.vehiculo_id));
                    setTipoVehiculo(primerVehiculo.tipo_vehiculo || "Automóvil");
                    setPlaca(primerVehiculo.placa || "");
                    setMarca(primerVehiculo.marca || "");
                    setModelo(primerVehiculo.modelo || "");
                    setAnio(primerVehiculo.anio ? String(primerVehiculo.anio) : "");
                    setColor(primerVehiculo.color || "");
                    setVin(primerVehiculo.vin || "");
                    setKilometraje("84500");
                } else {
                    setVehiculoSeleccionadoId("");
                    setTipoVehiculo("Automóvil");
                    setPlaca("");
                    setMarca("");
                    setModelo("");
                    setAnio("");
                    setColor("");
                    setVin("");
                    setKilometraje("");
                }
            } catch (error) {
                console.error("Error cargando vehículos del cliente:", error);
                setVehiculosCliente([]);
                setVehiculoSeleccionadoId("");
            }
        };

        cargarVehiculosDelCliente();
    }, [clienteSeleccionadoId]);

    const manejarCambioVehiculo = (vehiculoId) => {
        const vehiculo = vehiculosCliente.find((item) => String(item.vehiculo_id) === String(vehiculoId));
        setVehiculoSeleccionadoId(String(vehiculoId));

        if (!vehiculo) {
            setTipoVehiculo("Automóvil");
            setPlaca("");
            setMarca("");
            setModelo("");
            setAnio("");
            setColor("");
            setVin("");
            return;
        }

        setTipoVehiculo(vehiculo.tipo_vehiculo || "Automóvil");
        setPlaca(vehiculo.placa || "");
        setMarca(vehiculo.marca || "");
        setModelo(vehiculo.modelo || "");
        setAnio(vehiculo.anio ? String(vehiculo.anio) : "");
        setColor(vehiculo.color || "");
        setVin(vehiculo.vin || "");
    };

    // Función formato de tiempo asignado
    const formatearTiempoAsignacion = (minutos, fechaExacta) => {
        if (minutos < 5) {
            return `hace ${minutos} minuto${minutos === 1 ? '' : 's'}`;
        }
        return `Asignado a las ${fechaExacta.split(' ')[1]}`;
    };

    const iniciarDiagnosticoModal = () => {
        setMostrarModalAdvertenciaDiagnostico(true);
    };

    const confirmarDiagnosticoModal = () => {
        setMostrarModalAdvertenciaDiagnostico(false);
        setMostrarModalDiagnostico(true);
    };

    const agregarFallaDiagnostico = () => {
        if (!nuevaFalla) return;
        const nueva = {
            id: Date.now(),
            falla: nuevaFalla,
            comentarios: nuevosComentarios,
            horasHombre: Number(horasHombreFalla) || 1,
            repuestos: [...repuestosSeleccionados]
        };
        setFallasRegistradas([...fallasRegistradas, nueva]);
        setNuevaFalla("");
        setNuevosComentarios("");
        setRepuestosSeleccionados([]);

        // Notificar automáticamente al Asesor de Repuestos
        agregarNotificacion(`Nuevos repuestos requeridos para ODS-1002 por ${rolActivo}`, ROLES.ASESOR_REPUESTOS);
        alert("Diagnóstico guardado. Se ha enviado una notificación automática al Asesor de Repuestos.");
        setMostrarModalDiagnostico(false);
    };

    const toggleFluido = (campo, valor) => {
        setFluidos(prev => ({ ...prev, [campo]: valor }));
    };

    const toggleInventario = (campo) => {
        setInventarioVehicular(prev => ({ ...prev, [campo]: !prev[campo] }));
    };

    const toggleDoc = (campo) => {
        setDocumentos(prev => ({ ...prev, [campo]: !prev[campo] }));
    };

    const guardarODS = async () => {
        if (!clienteSeleccionadoId || !vehiculoSeleccionadoId || !asesorSeleccionadoId || !tecnicoSeleccionadoId) {
            alert("Debes seleccionar un cliente, un vehículo, un asesor y un técnico para registrar la ODS.");
            return;
        }

        const usuarioActual = JSON.parse(localStorage.getItem("usuario") || "null");

        const clienteSeleccionadoNombre = clientesAPI.find((item) => String(item.cliente_id) === String(clienteSeleccionadoId))?.nombre_razon_social || "Cliente";
        const asesorSeleccionadoNombre = usuariosAPI.find((item) => String(item.user_id) === String(asesorSeleccionadoId))?.nombre || "Asesor";
        const tecnicoSeleccionadoNombre = usuariosAPI.find((item) => String(item.user_id) === String(tecnicoSeleccionadoId))?.nombre || "Técnico";

        const payload = {
            codigo_ods: `ODS-${Date.now()}`,
            numero_ticket: `TK-${Date.now()}`,
            cita_id: null,
            cliente_id: Number(clienteSeleccionadoId),
            vehiculo_id: Number(vehiculoSeleccionadoId),
            cotizacion_id: null,
            asesor_id: Number(asesorSeleccionadoId),
            tecnico_id: Number(tecnicoSeleccionadoId),
            estado_actual: "Recepción",
            tipo_procedimiento: procedimiento,
            kilometraje_ingreso: kilometraje ? Number(kilometraje) : null,
            inspeccion_json: {
                checklist_inspeccion: {
                    nivel_combustible: nivelCombustible,
                    fluidos: fluidos,
                    inventario_vehicular: inventarioVehicular,
                    documentacion: documentos,
                    fotos_ingreso: fotosMotivo
                },
                motivo_servicio: {
                    requiere_diagnostico: realizaraDiagnostico === "Sí",
                    cotizacion_previa: cotizacionPrevia,
                    tipo_procedimiento: procedimiento,
                    motivo_detallado: motivoDetallado,
                    fotos_ingreso: fotosMotivo,
                    cliente: clienteSeleccionadoNombre,
                    asesor_asignado: asesorSeleccionadoNombre,
                    tecnico_asignado: tecnicoSeleccionadoNombre
                },
                danos_carroceria: Object.entries(danios || {}).map(([zona, tipo]) => ({
                    zona,
                    tipo: tipo === "rayado" ? "rayado" : tipo === "golpeado" ? "golpeado" : "intacto",
                    detalle: tipo === "golpeado" ? "Daño visible en zona del vehículo" : "Rayado visible en zona del vehículo"
                })),
                inspectado_por: usuarioActual?.nombre || "Sistema"
            },
            observaciones: motivoDetallado,
            estado_aprobacion_cliente: "Pendiente"
        };

        try {
            const res = await fetch("http://127.0.0.1:8000/api/ods", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "No se pudo registrar la orden de servicio.");
            }

            await cargarDatosODS();
            agregarNotificacion(`Nueva ODS ${data.codigo_ods} creada para el cliente ${clienteSeleccionadoId}`, ROLES.ASESOR_SERVICIO);
            agregarNotificacion(`Se le ha asignado la ODS ${data.codigo_ods} al técnico seleccionado`, ROLES.TECNICO);
            alert(`¡Orden de Servicio ${data.codigo_ods} registrada con éxito!`);
            setModoEdicion(false);
        } catch (error) {
            console.error("Error creando ODS:", error);
            alert(error.message || "Error al guardar la orden de servicio.");
        }
    };

    const odsFiltradas = listaODS.filter(o => 
        (o.estado === estadoActivo) &&
        (o.cliente.toLowerCase().includes(filtroBusqueda.toLowerCase()) || o.placa.toLowerCase().includes(filtroBusqueda.toLowerCase()) || o.id.toLowerCase().includes(filtroBusqueda.toLowerCase()))
    );

    return (
        <div className="os-page">

            {/* =========================================
                SUBMENÚ DE ESTADOS OPERATIVOS
            ========================================= */}
            <div className="os-subnav-container">
                <div className="os-subnav-tabs">
                    {["Recepción", "Diagnóstico", "Repuestos", "Aprobación", "Reparación", "Control de Calidad", "Entrega", "Archivados"].map(tab => (
                        <button
                            key={tab}
                            className={`os-subnav-tab ${estadoActivo === tab ? "active" : ""}`}
                            onClick={() => { setEstadoActivo(tab); setModoEdicion(false); }}
                        >
                            {tab}
                            <span className="tab-badge">
                                {listaODS.filter(o => o.estado === tab).length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="os-subnav-actions">
                    <button 
                        className={`btn-nueva-ods ${modoEdicion ? "cancel" : ""}`}
                        onClick={() => setModoEdicion(!modoEdicion)}
                    >
                        <span className="material-symbols-outlined">
                            {modoEdicion ? "arrow_back" : "add_circle"}
                        </span>
                        {modoEdicion ? "Volver a Lista" : "Nueva ODS"}
                    </button>
                </div>
            </div>

            {/* =========================================
                MODO LISTADO O MODO FORMULARIO
            ========================================= */}
            {!modoEdicion ? (
                <div className="os-list-container">
                    
                    {/* BARRA DE FILTROS */}
                    <div className="os-filter-bar">
                        <div className="filter-search">
                            <span className="material-symbols-outlined">search</span>
                            <input 
                                type="text" 
                                placeholder="Buscar por Cliente, Placa o N° Ticket..."
                                value={filtroBusqueda}
                                onChange={(e) => setFiltroBusqueda(e.target.value)}
                            />
                        </div>

                        <div className="filter-date">
                            <span className="material-symbols-outlined filter-date-icon">calendar_month</span>
                            <label>Filtrar por Fecha:</label>
                            <input 
                                type="date"
                                value={filtroFecha}
                                onChange={(e) => setFiltroFecha(e.target.value)}
                            />
                            {filtroFecha && (
                                <button className="btn-clear-date" onClick={() => setFiltroFecha("")} title="Limpiar fecha">✕</button>
                            )}
                        </div>
                    </div>

                    {/* VISTA DE TABLA DE ODS EN EL ESTADO SELECCIONADO */}
                    <div className="os-table-wrapper">
                        <table className="os-table">
                            <thead>
                                <tr>
                                    <th>N° ODS</th>
                                    <th>Cliente</th>
                                    <th>Vehículo / Placa</th>
                                    <th>Procedimiento</th>
                                    <th>Técnico Asignado</th>
                                    <th>Tiempo Asignación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {odsFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                                            No hay órdenes en estado <strong>{estadoActivo}</strong>.
                                        </td>
                                    </tr>
                                ) : (
                                    odsFiltradas.map(ods => (
                                        <tr key={ods.id}>
                                            <td><strong className="ods-badge">{ods.id}</strong></td>
                                            <td>{ods.cliente}</td>
                                            <td>
                                                <div className="v-info">
                                                    <span>{ods.marca}</span>
                                                    <small>{ods.placa}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`proc-tag ${ods.procedimiento.toLowerCase()}`}>
                                                    {ods.procedimiento}
                                                </span>
                                            </td>
                                            <td>{ods.tecnico}</td>
                                            <td>
                                                <span className="time-tag">
                                                    ⏱ {formatearTiempoAsignacion(ods.asignadoHaceMinutos, ods.fecha)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    {esTecnico && estadoActivo === "Diagnóstico" && (
                                                        <button 
                                                            className="btn-act-table diag"
                                                            onClick={iniciarDiagnosticoModal}
                                                        >
                                                            📋 Diagnosticar
                                                        </button>
                                                    )}

                                                    {estadoActivo === "Recepción" && (
                                                        <button 
                                                            className="btn-act-table link"
                                                            onClick={() => setMostrarModalCliente(true)}
                                                        >
                                                            📲 Link Cliente
                                                        </button>
                                                    )}

                                                    {estadoActivo === "Entrega" && (
                                                        <button 
                                                            className="btn-act-table nps"
                                                            onClick={() => setMostrarModalEntrega(true)}
                                                        >
                                                            ⭐ Entregar & NPS
                                                        </button>
                                                    )}

                                                    <button 
                                                        className="btn-act-table trace"
                                                        onClick={() => setMostrarModalTrazabilidad(true)}
                                                    >
                                                        🔍 Ver ODS
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            ) : (
                /* =========================================
                    FORMULARIO DE NUEVA ODS (RECEPCIÓN)
                ========================================= */
                <div className="os-form-container">

                    <div className="os-header">
                        <div className="os-header-info">
                            <div className="os-breadcrumb">ÓRDENES DE SERVICIO <span>/</span> NUEVA ORDEN DE RECEPCIÓN</div>
                            <h1>Registro de Recepción e Inspección</h1>
                            <p>Complete todos los datos del vehículo, motivo del servicio e inspección vehicular inicial.</p>
                        </div>
                        <div className="os-header-actions">
                            <button className="btn-cancelar" onClick={() => setModoEdicion(false)}>Cancelar</button>
                            <button className="btn-guardar" onClick={guardarODS}>
                                <span className="material-symbols-outlined">save</span> Guardar Orden
                            </button>
                        </div>
                    </div>

                    <div className="os-main-grid">

                        {/* 1. REGISTRO DE VEHÍCULO */}
                        <section className="os-card os-vehicle-card">
                            <div className="card-header">
                                <div className="card-title-icon"><span className="material-symbols-outlined">directions_car</span></div>
                                <div>
                                    <h2>1. Registro del Vehículo</h2>
                                    <p>Especificaciones generales y propietario.</p>
                                </div>
                            </div>

                            <div className="os-form">
                                <div className="campo">
                                    <label>Cliente / Propietario</label>
                                    <select value={clienteSeleccionadoId} onChange={(e) => setClienteSeleccionadoId(e.target.value)}>
                                        <option value="">Seleccione un cliente</option>
                                        {clientesAPI.map((clienteItem) => (
                                            <option key={clienteItem.cliente_id} value={clienteItem.cliente_id}>
                                                {clienteItem.nombre_razon_social}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="campo">
                                    <label>Vehículo del Cliente</label>
                                    <select value={vehiculoSeleccionadoId} onChange={(e) => manejarCambioVehiculo(e.target.value)} disabled={!clienteSeleccionadoId || vehiculosCliente.length === 0}>
                                        <option value="">Seleccione un vehículo</option>
                                        {vehiculosCliente.map((vehiculo) => (
                                            <option key={vehiculo.vehiculo_id} value={vehiculo.vehiculo_id}>
                                                {vehiculo.marca} {vehiculo.modelo} - {vehiculo.placa}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="campo-group">
                                    <div className="campo">
                                        <label>Tipo de Vehículo</label>
                                        <input type="text" value={tipoVehiculo} readOnly placeholder="Automóvil" />
                                    </div>
                                    <div className="campo">
                                        <label>Placa</label>
                                        <input type="text" value={placa} readOnly placeholder="ABC-123" />
                                    </div>
                                </div>

                                <div className="campo-group">
                                    <div className="campo">
                                        <label>Marca</label>
                                        <input type="text" value={marca} readOnly />
                                    </div>
                                    <div className="campo">
                                        <label>Modelo</label>
                                        <input type="text" value={modelo} readOnly />
                                    </div>
                                    <div className="campo">
                                        <label>Año</label>
                                        <input type="number" value={anio} readOnly />
                                    </div>
                                </div>

                                <div className="campo-group">
                                    <div className="campo">
                                        <label>Color</label>
                                        <input type="text" value={color} readOnly />
                                    </div>
                                    <div className="campo">
                                        <label>VIN (N° Chasis)</label>
                                        <input type="text" value={vin} readOnly />
                                    </div>
                                    <div className="campo">
                                        <label>Kilometraje Ingreso</label>
                                        <div className="input-suffix">
                                            <input type="number" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} />
                                            <span>km</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="campo">
                                    <label>Asesor de Servicio Asignado</label>
                                    <select value={asesorSeleccionadoId} onChange={(e) => setAsesorSeleccionadoId(e.target.value)}>
                                        <option value="">Seleccione un asesor</option>
                                        {usuariosAPI
                                            .filter((usuario) => usuario.rol === "Asesor de Servicio" || Number(usuario.rol_id) === 2)
                                            .map((usuario) => (
                                                <option key={usuario.user_id} value={usuario.user_id}>
                                                    {usuario.nombre}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="campo">
                                    <label>Técnico Automotriz Asignado</label>
                                    <select value={tecnicoSeleccionadoId} onChange={(e) => setTecnicoSeleccionadoId(e.target.value)}>
                                        <option value="">Seleccione un técnico</option>
                                        {usuariosAPI
                                            .filter((usuario) => usuario.rol === "Técnico Automotriz" || Number(usuario.rol_id) === 4)
                                            .map((usuario) => (
                                                <option key={usuario.user_id} value={usuario.user_id}>
                                                    {usuario.nombre}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* 2. MOTIVO DEL SERVICIO */}
                        <section className="os-card os-motivo-card">
                            <div className="card-header">
                                <div className="card-title-icon"><span className="material-symbols-outlined">build</span></div>
                                <div>
                                    <h2>2. Motivo del Servicio</h2>
                                    <p>Detalle de la solicitud e inspección inicial.</p>
                                </div>
                            </div>

                            <div className="os-form">
                                <div className="campo-group">
                                    <div className="campo">
                                        <label>¿Realizará Diagnóstico?</label>
                                        <select value={realizaraDiagnostico} onChange={(e) => setRealizaraDiagnostico(e.target.value)}>
                                            <option value="Sí">Sí - Requiere Evaluación Técnica</option>
                                            <option value="No">No - Ingreso Directo a Servicio</option>
                                        </select>
                                    </div>

                                    <div className="campo">
                                        <label>Enlazar Cotización Previa</label>
                                        <select value={cotizacionPrevia} onChange={(e) => setCotizacionPrevia(e.target.value)}>
                                            <option>Sin Cotización</option>
                                            <option>COT-5501 (Mantenimiento 80k km - S/ 650)</option>
                                            <option>COT-5504 (Cambio de Discos - S/ 420)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="campo">
                                    <label>Tipo de Procedimiento</label>
                                    <div className="radio-pills">
                                        {["Preventivo", "Correctivo"].map(proc => (
                                            <button 
                                                key={proc} 
                                                type="button" 
                                                className={`pill-btn ${procedimiento === proc ? "selected" : ""}`}
                                                onClick={() => setProcedimiento(proc)}
                                            >
                                                {proc}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="campo">
                                    <label>Motivo Detallado de Ingreso</label>
                                    <textarea 
                                        rows="3" 
                                        value={motivoDetallado} 
                                        onChange={(e) => setMotivoDetallado(e.target.value)} 
                                        placeholder="Escriba las fallas reportadas por el cliente..." 
                                    />
                                </div>

                                <div className="campo">
                                    <label>Fotos de Evidencia al Ingreso</label>
                                    <div className="photo-uploader">
                                        {fotosMotivo.map((f, i) => (
                                            <div key={i} className="photo-thumb">📷 {f}</div>
                                        ))}
                                        <button type="button" className="btn-add-photo" onClick={() => setFotosMotivo([...fotosMotivo, `foto_${Date.now()}.jpg`])}>
                                            + Agregar Foto
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. CHECKLIST DE INSPECCIÓN VEHICULAR */}
                        <section className="os-card full-width">
                            <div className="card-header">
                                <div className="card-title-icon"><span className="material-symbols-outlined">fact_check</span></div>
                                <div>
                                    <h2>3. Checklist de Inspección Inicial</h2>
                                    <p>Nivel de combustible, fluidos, inventario de cabina y documentos.</p>
                                </div>
                            </div>

                            <div className="checklist-grid">
                                
                                {/* COMBUSIBLE */}
                                <div className="check-block">
                                    <h3>⛽ Nivel de Combustible</h3>
                                    <select value={nivelCombustible} onChange={(e) => setNivelCombustible(e.target.value)}>
                                        <option>Reserva</option>
                                        <option>1/4</option>
                                        <option>1/2</option>
                                        <option>3/4</option>
                                        <option>Lleno</option>
                                    </select>
                                </div>

                                {/* FLUIDOS */}
                                <div className="check-block">
                                    <h3>💧 Estado de Fluidos del Motor</h3>
                                    <div className="fluidos-list">
                                        {[
                                            { key: "aceite", label: "Aceite de Motor", icon: "🛢️" },
                                            { key: "frenos", label: "Líquido de Frenos", icon: "🛑" },
                                            { key: "embrague", label: "Líquido de Embrague", icon: "⚙️" },
                                            { key: "refrigerante", label: "Refrigerante / Coolant", icon: "❄️" },
                                            { key: "hidraulico", label: "Líquido Hidráulico", icon: "💧" },
                                            { key: "limpiaparabrisas", label: "Agua Limpiaparabrisas", icon: "🧹" }
                                        ].map(({ key, label, icon }) => (
                                            <div key={key} className={`fluid-row fluid-status-${fluidos[key]?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                <div className="fluid-label">
                                                    <span className="fluid-icon">{icon}</span>
                                                    <span>{label}</span>
                                                </div>
                                                <select 
                                                    className={`fluid-select status-val-${fluidos[key]?.toLowerCase().replace(/\s+/g, '-')}`}
                                                    value={fluidos[key]} 
                                                    onChange={(e) => toggleFluido(key, e.target.value)}
                                                >
                                                    <option value="Correcto">🟢 Correcto</option>
                                                    <option value="Bajo">🟡 Nivel Bajo</option>
                                                    <option value="Requiere Cambio">🔴 Cambiar</option>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* INVENTARIO CABINA */}
                                <div className="check-block">
                                    <h3>🧰 Inventario Vehicular</h3>
                                    <div className="checkbox-list">
                                        <label>
                                            <input type="checkbox" checked={inventarioVehicular.kitEmergencia} onChange={() => toggleInventario('kitEmergencia')} />
                                            Kit de Emergencia
                                        </label>
                                        <label>
                                            <input type="checkbox" checked={inventarioVehicular.llantaRepuesto} onChange={() => toggleInventario('llantaRepuesto')} />
                                            Llanta de Repuesto
                                        </label>
                                        <label>
                                            <input type="checkbox" checked={inventarioVehicular.botiquin} onChange={() => toggleInventario('botiquin')} />
                                            Botiquín de Auxilio
                                        </label>
                                        <label>
                                            <input type="checkbox" checked={inventarioVehicular.extintor} onChange={() => toggleInventario('extintor')} />
                                            Extintor Operativo
                                        </label>
                                    </div>
                                </div>

                                {/* DOCUMENTOS */}
                                <div className="check-block">
                                    <h3>📄 Documentación Recibida</h3>
                                    <div className="checkbox-list">
                                        <label>
                                            <input type="checkbox" checked={documentos.tarjetaPropiedad} onChange={() => toggleDoc('tarjetaPropiedad')} />
                                            Tarjeta de Propiedad
                                        </label>
                                        <label>
                                            <input type="checkbox" checked={documentos.soat} onChange={() => toggleDoc('soat')} />
                                            SOAT Vigente
                                        </label>
                                        <label>
                                            <input type="checkbox" checked={documentos.revisionTecnica} onChange={() => toggleDoc('revisionTecnica')} />
                                            Revisión Técnica
                                        </label>
                                    </div>
                                </div>

                            </div>
                        </section>

                        {/* 4. DIAGRAMA 2D DAÑOS EN CARROCERÍA */}
                        <section className="os-card full-width">
                            <div className="card-header">
                                <div className="card-title-icon"><span className="material-symbols-outlined">car_repair</span></div>
                                <div>
                                    <h2>4. Mapa Visual de Daños de Carrocería</h2>
                                    <p>Haz clic en las zonas para registrar tipo de daño (Rayado, fogueado, sumido, picado, golpeado, intacto).</p>
                                </div>
                            </div>

                            <DiagramaVehiculo danios={danios} setDanios={setDanios} />
                        </section>

                    </div>

                </div>
            )}

            {/* =========================================
                MODAL 1: FLUJO DE APROBACIÓN DEL CLIENTE (MODO SOLO LECTURA)
            ========================================= */}
            {mostrarModalCliente && (
                <div className="modal-overlay">
                    <div className="modal-content client-preview">
                        <div className="modal-header">
                            <div>
                                <span className="read-only-badge">👁 MODO SOLO LECTURA - VISTA CLIENTE</span>
                                <h2>Aprobación de Orden de Servicio</h2>
                                <p>El cliente recibe esta vista interactiva mediante WhatsApp o Mail.</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalCliente(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="summary-box">
                                <h3>VERAMOTORS SAC - ODS #1004</h3>
                                <p><strong>Cliente:</strong> {cliente} | <strong>Vehículo:</strong> {marca} {modelo} ({placa})</p>
                                <p><strong>Motivo:</strong> {motivoDetallado}</p>
                                <p><strong>Procedimiento:</strong> {procedimiento}</p>
                            </div>

                            <div className="approval-status-box">
                                <strong>Estado Actual:</strong> <span className={`status-pill ${estadoAprobacionCliente.toLowerCase()}`}>{estadoAprobacionCliente}</span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn-reject" 
                                onClick={() => {
                                    setEstadoAprobacionCliente("Denegado");
                                    agregarNotificacion(`ATENCIÓN: El cliente ${cliente} ha DENEGADO la ODS #1004. Contactar de inmediato.`, ROLES.ASESOR_SERVICIO);
                                    alert("Notificación enviada al Asesor de Servicio por denegación del cliente.");
                                }}
                            >
                                ✖ Denegar Orden
                            </button>
                            <button 
                                className="btn-approve" 
                                onClick={() => {
                                    setEstadoAprobacionCliente("Aprobado");
                                    agregarNotificacion(`El cliente ${cliente} ha APROBADO la ODS #1004.`, ROLES.ASESOR_SERVICIO);
                                    alert("¡Orden de servicio Aprobada por el cliente! Avanzando al siguiente estado.");
                                    setMostrarModalCliente(false);
                                }}
                            >
                                ✔ Aprobar Orden
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL 2: ADVERTENCIA AL TÉCNICO AL INICIAR DIAGNÓSTICO
            ========================================= */}
            {mostrarModalAdvertenciaDiagnostico && (
                <div className="modal-overlay">
                    <div className="modal-content warning-modal">
                        <div className="modal-header yellow">
                            <h2>⚠️ ADVERTENCIA DE DIAGNÓSTICO TÉCNICO</h2>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '1rem', lineHeight: '1.5', color: '#f8fafc' }}>
                                Estimado Técnico <strong>{rolActivo}</strong>:
                            </p>
                            <ul style={{ margin: '15px 0', paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.8' }}>
                                <li>Debe tener especial cuidado al diagnosticar cada sistema del vehículo.</li>
                                <li>Detalle minuciosamente cada falla y causa raíz encontrada.</li>
                                <li>Asigne correctamente las <strong>Horas Hombre (HH)</strong> necesarias.</li>
                                <li>Requiera repuestos e insumos directamente desde el inventario.</li>
                            </ul>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancelar" onClick={() => setMostrarModalAdvertenciaDiagnostico(false)}>Cancelar</button>
                            <button className="btn-guardar" onClick={confirmarDiagnosticoModal}>Entrar a Diagnóstico</button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL 3: REGISTRO DE DIAGNÓSTICO TÉCNICO
            ========================================= */}
            {mostrarModalDiagnostico && (
                <div className="modal-overlay">
                    <div className="modal-content diag-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Registro de Diagnóstico Técnico</h2>
                                <p>Vehículo: Toyota Corolla (ABC-123) | Propietario: Carlos Mendoza | Ingreso: 09:30 AM</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalDiagnostico(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Falla Detectada *</label>
                                <input type="text" value={nuevaFalla} onChange={(e) => setNuevaFalla(e.target.value)} placeholder="Ej: Fuga de líquido de frenos en caliper izquierdo" />
                            </div>

                            <div className="form-group">
                                <label>Comentarios del Técnico / Observaciones *</label>
                                <textarea rows="3" value={nuevosComentarios} onChange={(e) => setNuevosComentarios(e.target.value)} placeholder="Describa el diagnóstico exacto y causa raíz..." />
                            </div>

                            <div className="form-group">
                                <label>Tiempo Estimado en Horas Hombre (HH) *</label>
                                <input type="number" value={horasHombreFalla} onChange={(e) => setHorasHombreFalla(e.target.value)} step="0.5" />
                            </div>

                            <div className="form-group">
                                <label>Requerir Repuestos de Inventario (Notifica a Asesor de Repuestos)</label>
                                <div className="repuesto-search-box" style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por código de inventario (Ej: BRK-892-C)..." 
                                        value={repuestoBusqueda}
                                        onChange={(e) => setRepuestoBusqueda(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-act-table diag"
                                        onClick={() => {
                                            if (repuestoBusqueda) {
                                                setRepuestosSeleccionados([...repuestosSeleccionados, { codigo: repuestoBusqueda, nombre: "Pastillas de Freno Brembo", cant: 1 }]);
                                                setRepuestoBusqueda("");
                                            }
                                        }}
                                    >
                                        + Añadir Repuesto
                                    </button>
                                </div>

                                {repuestosSeleccionados.length > 0 && (
                                    <div className="repuestos-added-list" style={{ marginTop: '10px' }}>
                                        {repuestosSeleccionados.map((r, i) => (
                                            <div key={i} style={{ background: '#1e293b', padding: '6px 12px', borderRadius: '4px', marginTop: '4px', fontSize: '0.85rem' }}>
                                                📦 [{r.codigo}] {r.nombre} (Cant: {r.cant})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancelar" onClick={() => setMostrarModalDiagnostico(false)}>Cancelar</button>
                            <button className="btn-guardar" onClick={agregarFallaDiagnostico}>Guardar Diagnóstico & Notificar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL 4: ENTREGA Y ENCUESTA DE SATISFACCIÓN (NPS)
            ========================================= */}
            {mostrarModalEntrega && (
                <div className="modal-overlay">
                    <div className="modal-content nps-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Modal de Entrega del Vehículo</h2>
                                <p>Envío de Encuesta de Satisfacción (NPS) vía WhatsApp o Mail.</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalEntrega(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <h3>Encuesta de Satisfacción NPS (1 a 10)</h3>
                            <div className="nps-scale" style={{ display: 'flex', gap: '8px', margin: '15px 0' }}>
                                {[1,2,3,4,5,6,7,8,9,10].map(val => (
                                    <button 
                                        key={val} 
                                        type="button" 
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '6px',
                                            border: '1px solid #334155',
                                            background: npsPuntaje === val ? '#3b82f6' : '#1e293b',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setNpsPuntaje(val)}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>

                            <div className="form-group">
                                <label>Comentario del Cliente</label>
                                <textarea rows="3" value={npsComentario} onChange={(e) => setNpsComentario(e.target.value)} />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancelar" onClick={() => setMostrarModalEntrega(false)}>Cerrar</button>
                            <button 
                                className="btn-guardar"
                                onClick={() => {
                                    alert(`Encuesta NPS registrada (${npsPuntaje}/10). Notificación enviada al cliente.`);
                                    setMostrarModalEntrega(false);
                                }}
                            >
                                📲 Enviar Encuesta NPS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL 5: TRAZABILIDAD CRONOLÓGICA "VER ODS"
            ========================================= */}
            {mostrarModalTrazabilidad && (
                <div className="modal-overlay">
                    <div className="modal-content trace-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Trazabilidad Cronológica Completa - ODS-1001</h2>
                                <p>Historial y registro de cambios en la Orden de Servicio</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalTrazabilidad(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="timeline" style={{ borderLeft: '2px solid #3b82f6', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <strong style={{ color: '#60a5fa' }}>🟢 09:30 AM - RECEPCIÓN</strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>Vehículo ingresado por Asesor de Servicio. Inspección 2D completada (1 daño registrado).</p>
                                </div>
                                <div>
                                    <strong style={{ color: '#eab308' }}>🟡 10:15 AM - DIAGNÓSTICO</strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>Técnico Luis García registró falla en frenos (2.0 HH). Repuestos solicitados.</p>
                                </div>
                                <div>
                                    <strong style={{ color: '#a855f7' }}>🟣 11:00 AM - REPUESTOS</strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>Asesor de Repuestos despacho Pastillas Brembo (BRK-892-C).</p>
                                </div>
                                <div>
                                    <strong style={{ color: '#22c55e' }}>🟢 11:45 AM - APROBACIÓN CLIENTE</strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>Cliente Carlos Mendoza aprobó la orden de servicio vía WhatsApp.</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancelar" onClick={() => setMostrarModalTrazabilidad(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default OrdenesServicio;