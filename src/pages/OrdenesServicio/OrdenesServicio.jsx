import { useEffect, useState } from "react";
import { ROLES, useRole } from "../../context/authContext";
import VisorVehiculo3D from "../../components/Inspeccion3D/VisorVehiculo3D";
import { obtenerODS, actualizarODS, cambiarEstadoODS } from "../../services/odsService";
import { obtenerUsuarios } from "../../services/usuariosService";
import { obtenerInventario } from "../../services/inventarioService";
import { crearDiagnosticoODS, obtenerDiagnosticosODS } from "../../services/diagnosticosService";
import "./OrdenesServicio.css";

function OrdenesServicio() {
    const { rolActivo, usuarioActual } = useRole();
    const esTecnico = rolActivo === ROLES.TECNICO;

    // Submenú de estados
    const [estadoActivo, setEstadoActivo] = useState("Recepción");
    const [filtroBusqueda, setFiltroBusqueda] = useState("");
    const [filtroFecha, setFiltroFecha] = useState("");

    // Modal de Nueva ODS / Edición
    const [modoEdicion, setModoEdicion] = useState(false);

    // ODS seleccionada para modales de detalle, aprobación, diagnóstico y trazabilidad
    const [odsSeleccionadaModal, setOdsSeleccionadaModal] = useState(null);
    const [estadoCambioODS, setEstadoCambioODS] = useState("Diagnóstico");
    const [guardandoEstado, setGuardandoEstado] = useState(false);

    // Datos del Registro de Vehículo
    const [tipoVehiculo, setTipoVehiculo] = useState("");
    const [marca, setMarca] = useState("");
    const [modelo, setModelo] = useState("");
    const [anio, setAnio] = useState("");
    const [placa, setPlaca] = useState("");
    const [color, setColor] = useState("");
    const [vin, setVin] = useState("");
    const [kilometraje, setKilometraje] = useState("");

    // Motivo del Servicio
    const [realizaraDiagnostico, setRealizaraDiagnostico] = useState("Sí");
    const [cotizacionPrevia, setCotizacionPrevia] = useState("Sin Cotización");
    const [procedimiento, setProcedimiento] = useState("Preventivo");
    const [motivoDetallado, setMotivoDetallado] = useState("");
    const [fotosMotivo, setFotosMotivo] = useState([]);

    // Checklist de Inspección
    const [nivelCombustible, setNivelCombustible] = useState("");
    const [fluidos, setFluidos] = useState({ aceite: "", frenos: "", embrague: "", refrigerante: "", hidraulico: "", limpiaparabrisas: "" });
    const [inventarioVehicular, setInventarioVehicular] = useState({ kitEmergencia: false, llantaRepuesto: false, botiquin: false, extintor: false });
    const [documentos, setDocumentos] = useState({ tarjetaPropiedad: false, soat: false, revisionTecnica: false });
    const [danios, setDanios] = useState([]);
    const [daniosODSSeleccionada, setDaniosODSSeleccionada] = useState([]);
    const [guardandoDanosODS, setGuardandoDanosODS] = useState(false);
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
    const [estadoAprobacionCliente, setEstadoAprobacionCliente] = useState("Pendiente");
    const [mostrarModalAdvertenciaDiagnostico, setMostrarModalAdvertenciaDiagnostico] = useState(false);
    const [mostrarModalDiagnostico, setMostrarModalDiagnostico] = useState(false);
    const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
    const [mostrarModalTrazabilidad, setMostrarModalTrazabilidad] = useState(false);

    // Diagnóstico técnico desde PostgreSQL
    const [fallasRegistradas, setFallasRegistradas] = useState([]);
    const [nuevaFalla, setNuevaFalla] = useState("");
    const [nuevosComentarios, setNuevosComentarios] = useState("");
    const [horasHombreFalla, setHorasHombreFalla] = useState("1.5");
    const [repuestosDisponibles, setRepuestosDisponibles] = useState([]);
    const [repuestosODS, setRepuestosODS] = useState([]);
    const [repuestoItemId, setRepuestoItemId] = useState("");
    const [cantidadRepuesto, setCantidadRepuesto] = useState("1");
    const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);
    const [cargandoDiagnostico, setCargandoDiagnostico] = useState(false);
    const [guardandoDiagnostico, setGuardandoDiagnostico] = useState(false);
    const [errorDiagnostico, setErrorDiagnostico] = useState("");
    const [mensajeDiagnostico, setMensajeDiagnostico] = useState("");

    const [listaODS, setListaODS] = useState([]);
    const [usuariosAPI, setUsuariosAPI] = useState([]);
    const [clientesAPI, setClientesAPI] = useState([]);
    const [vehiculosCliente, setVehiculosCliente] = useState([]);
    const [cotizacionesCliente, setCotizacionesCliente] = useState([]);
    const [cotizacionSeleccionadaId, setCotizacionSeleccionadaId] = useState("");
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
                    const asesor = Array.isArray(usuariosData)
                        ? usuariosData.find((u) => Number(u.user_id) === Number(item.asesor_id))
                        : null;

                    const fechaIngreso = item.fecha_ingreso ? new Date(item.fecha_ingreso) : new Date();

                    return {
                        ods_id: item.ods_id,
                        id: item.codigo_ods || `ODS-${item.ods_id}`,
                        ticket: item.numero_ticket || `TK-${item.ods_id}`,
                        cliente_id: item.cliente_id,
                        cliente: item.cliente_nombre || "Cliente sin nombre",
                        vehiculo_id: item.vehiculo_id,
                        placa: item.vehiculo_placa || "Sin placa",
                        marca: item.tipo_procedimiento || "Servicio",
                        estado: item.estado_actual || "Recepción",
                        fecha: fechaIngreso.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }),
                        fecha_ingreso: item.fecha_ingreso,
                        tecnico_id: item.tecnico_id,
                        tecnico: tecnico ? tecnico.nombre : `Técnico ${item.tecnico_id || "sin asignar"}`,
                        asesor_id: item.asesor_id,
                        asesor: asesor ? asesor.nombre : `Asesor ${item.asesor_id || "sin asignar"}`,
                        asignadoHaceMinutos: Math.max(1, Math.round((Date.now() - fechaIngreso.getTime()) / 60000)),
                        procedimiento: item.tipo_procedimiento || "Preventivo",
                        motivo: item.inspeccion_json?.motivo_servicio?.motivo_detallado || item.observaciones || "Servicio vehicular",
                        inspeccion_json: item.inspeccion_json,
                        estado_aprobacion_cliente: item.estado_aprobacion_cliente || "Pendiente",
                        cotizacion_id: item.cotizacion_id,
                        kilometraje: item.kilometraje_ingreso
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

    const abrirInspeccionODS = (ods) => {
        const danosGuardados = ods?.inspeccion_json?.danos_carroceria;

        setDaniosODSSeleccionada(
            Array.isArray(danosGuardados) ? danosGuardados : []
        );

        setOdsSeleccionadaModal(ods);
        setEstadoCambioODS(ods.estado || "Diagnóstico");
        setMostrarModalTrazabilidad(true);
    };

    useEffect(() => {
        let activa = true;
        queueMicrotask(() => {
            if (activa) cargarDatosODS();
        });
        return () => { activa = false; };
    }, []);

    useEffect(() => {
        const cargarDatosDelCliente = async () => {
            if (!clienteSeleccionadoId) {
                setVehiculosCliente([]);
                setVehiculoSeleccionadoId("");
                setCotizacionesCliente([]);
                setCotizacionSeleccionadaId("");
                setCotizacionPrevia("Sin Cotización");
                return;
            }

            try {
                const [resVehiculos, resCotizaciones] = await Promise.all([
                    fetch(`http://127.0.0.1:8000/api/vehiculos?cliente_id=${clienteSeleccionadoId}`),
                    fetch(`http://127.0.0.1:8000/api/cotizaciones?cliente_id=${clienteSeleccionadoId}`)
                ]);

                const dataVehiculos = await resVehiculos.json();
                const dataCotizaciones = await resCotizaciones.json();

                const vehiculos = Array.isArray(dataVehiculos) ? dataVehiculos : [];
                const cotizaciones = Array.isArray(dataCotizaciones) ? dataCotizaciones : [];

                setVehiculosCliente(vehiculos);
                setCotizacionesCliente(cotizaciones);
                setCotizacionSeleccionadaId("");
                setCotizacionPrevia("Sin Cotización");

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
                    setKilometraje("");
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
                console.error("Error cargando datos del cliente:", error);
                setVehiculosCliente([]);
                setVehiculoSeleccionadoId("");
                setCotizacionesCliente([]);
                setCotizacionSeleccionadaId("");
            }
        };

        cargarDatosDelCliente();
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

    const iniciarDiagnosticoModal = async (ods) => {
        if (!ods?.ods_id) return;
        setOdsSeleccionadaModal(ods);
        setErrorDiagnostico("");
        setMensajeDiagnostico("");
        setCargandoDiagnostico(true);
        try {
            const [diagnosticos, inventario] = await Promise.all([
                obtenerDiagnosticosODS(ods.ods_id),
                obtenerInventario(),
            ]);
            setFallasRegistradas(diagnosticos.diagnosticos);
            setRepuestosODS(diagnosticos.repuestos);
            setRepuestosDisponibles(inventario);
            setRepuestosSeleccionados([]);
            setNuevaFalla("");
            setNuevosComentarios("");
            setMostrarModalAdvertenciaDiagnostico(true);
        } catch (error) {
            setErrorDiagnostico(error.message || "No se pudo cargar el diagnóstico de la ODS.");
        } finally {
            setCargandoDiagnostico(false);
        }
    };

    const agregarRepuestoDiagnostico = () => {
        const itemId = Number(repuestoItemId);
        const cantidad = Number(cantidadRepuesto);
        if (!itemId || cantidad <= 0) return;
        setRepuestosSeleccionados((actuales) => {
            const existente = actuales.find((linea) => linea.item_id === itemId);
            if (existente) {
                return actuales.map((linea) => linea.item_id === itemId ? { ...linea, cantidad: linea.cantidad + cantidad } : linea);
            }
            return [...actuales, { item_id: itemId, cantidad }];
        });
        setRepuestoItemId("");
        setCantidadRepuesto("1");
    };

    const confirmarDiagnosticoModal = () => {
        setMostrarModalAdvertenciaDiagnostico(false);
        setMostrarModalDiagnostico(true);
    };

    const agregarFallaDiagnostico = async () => {
        if (!odsSeleccionadaModal?.ods_id || !nuevaFalla.trim()) {
            setErrorDiagnostico("La falla detectada es obligatoria.");
            return;
        }
        setGuardandoDiagnostico(true);
        setErrorDiagnostico("");
        try {
            const estadoSiguiente = repuestosSeleccionados.length > 0 ? "Repuestos" : "Reparación";
            await crearDiagnosticoODS(odsSeleccionadaModal.ods_id, {
                falla_reportada: nuevaFalla.trim(),
                comentarios_tecnico: nuevosComentarios.trim() || null,
                horas_hombre: Number(horasHombreFalla),
                tiempo_estimado_horas: Number(horasHombreFalla),
                repuestos: repuestosSeleccionados,
            });
            const datos = await obtenerDiagnosticosODS(odsSeleccionadaModal.ods_id);
            setFallasRegistradas(datos.diagnosticos);
            setRepuestosODS(datos.repuestos);
            setMensajeDiagnostico(`Diagnóstico guardado. La ODS pasó a ${estadoSiguiente}.`);
            setNuevaFalla("");
            setNuevosComentarios("");
            setRepuestosSeleccionados([]);
            setMostrarModalDiagnostico(false);
            await cargarDatosODS();
        } catch (error) {
            setErrorDiagnostico(error.message || "No se pudo guardar el diagnóstico.");
        } finally {
            setGuardandoDiagnostico(false);
        }
    };

    const seleccionarFotosIngreso = async (event) => {
        const archivos = Array.from(event.target.files || []);
        const totalActual = fotosMotivo.reduce((total, foto) => total + foto.tamano, 0);
        if (fotosMotivo.length + archivos.length > 5 || archivos.some((archivo) => !archivo.type.startsWith("image/") || archivo.size > 2 * 1024 * 1024) || totalActual + archivos.reduce((total, archivo) => total + archivo.size, 0) > 5 * 1024 * 1024) {
            alert("Selecciona hasta cinco imágenes y un máximo total de 5 MB.");
            event.target.value = "";
            return;
        }

        try {
            const fotos = await Promise.all(archivos.map((archivo) => new Promise((resolve, reject) => {
                const lector = new FileReader();
                lector.onload = () => resolve({ nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, contenido: lector.result });
                lector.onerror = () => reject(new Error(`No se pudo leer ${archivo.name}.`));
                lector.readAsDataURL(archivo);
            })));
            setFotosMotivo((actuales) => [...actuales, ...fotos]);
        } catch (error) {
            alert(error.message || "No se pudieron leer las imágenes seleccionadas.");
        } finally {
            event.target.value = "";
        }
    };

    const toggleFluido = (campo, valor) => {
        setFluidos((actual) => ({ ...actual, [campo]: valor }));
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

        const clienteSeleccionadoNombre = clientesAPI.find((item) => String(item.cliente_id) === String(clienteSeleccionadoId))?.nombre_razon_social;
        const asesorSeleccionadoNombre = usuariosAPI.find((item) => String(item.user_id) === String(asesorSeleccionadoId))?.nombre;
        const tecnicoSeleccionadoNombre = usuariosAPI.find((item) => String(item.user_id) === String(tecnicoSeleccionadoId))?.nombre;
        if (!clienteSeleccionadoNombre || !asesorSeleccionadoNombre || !tecnicoSeleccionadoNombre || !usuarioActual?.nombre) {
            alert("No se encontraron los datos reales del cliente, asesor, técnico o usuario autenticado.");
            return;
        }

        const payload = {
            cita_id: null,
            cliente_id: Number(clienteSeleccionadoId),
            vehiculo_id: Number(vehiculoSeleccionadoId),
            cotizacion_id: cotizacionSeleccionadaId ? Number(cotizacionSeleccionadaId) : null,
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
                    motivo_detallado: motivoDetallado.trim(),
                    fotos_ingreso: fotosMotivo,
                    cliente: clienteSeleccionadoNombre,
                    asesor_asignado: asesorSeleccionadoNombre,
                    tecnico_asignado: tecnicoSeleccionadoNombre
                },
                version: 1,
                tipo_inspeccion: "3D",
                tipo_vehiculo: tipoVehiculo,
                danos_carroceria: (Array.isArray(danios) ? danios : []).map(
                    (dano) => ({
                        pieza: dano.pieza,
                        tipo: dano.tipo,
                        severidad: dano.severidad,
                        detalle: dano.observacion || "",
                        posicion_3d: dano.posicion_3d || null
                    })
                ),
                inspectado_por: usuarioActual?.nombre || ""
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
            alert(`¡Orden de Servicio ${data.codigo_ods} registrada con éxito!`);
            setModoEdicion(false);
        } catch (error) {
            console.error("Error creando ODS:", error);
            alert(error.message || "Error al guardar la orden de servicio.");
        }
    };

    const guardarDanosODSSeleccionada = async () => {
        if (!odsSeleccionadaModal) return;

        try {
            setGuardandoDanosODS(true);

            const inspeccionActual = odsSeleccionadaModal.inspeccion_json || {};

            const inspeccionActualizada = {
                ...inspeccionActual,
                version: inspeccionActual.version || 1,
                tipo_inspeccion: "3D",
                tipo_vehiculo:
                    inspeccionActual.tipo_vehiculo ||
                    odsSeleccionadaModal?.tipo_vehiculo ||
                    "Automóvil",
                danos_carroceria: (Array.isArray(daniosODSSeleccionada)
                    ? daniosODSSeleccionada
                    : []
                ).map((dano) => ({
                    pieza: dano.pieza,
                    tipo: dano.tipo,
                    severidad: dano.severidad,
                    detalle:
                        dano.observacion ||
                        dano.detalle ||
                        "Daño visible en zona del vehículo",
                    observacion: dano.observacion || dano.detalle || "",
                    posicion_3d: dano.posicion_3d || null
                }))
            };

            await actualizarODS(odsSeleccionadaModal.ods_id, {
                inspeccion_json: inspeccionActualizada
            });

            setOdsSeleccionadaModal((prev) =>
                prev
                    ? {
                        ...prev,
                        inspeccion_json: inspeccionActualizada
                    }
                    : prev
            );

            await cargarDatosODS();
            alert("¡Inspección 3D actualizada correctamente!");
        } catch (error) {
            console.error("Error guardando daños de la inspección 3D:", error);
            alert(
                error?.message ||
                "No se pudieron guardar los cambios de la inspección 3D."
            );
        } finally {
            setGuardandoDanosODS(false);
        }
    };

    const odsFiltradas = listaODS.filter(o =>
        (o.estado === estadoActivo) &&
        (o.cliente.toLowerCase().includes(filtroBusqueda.toLowerCase()) || o.placa.toLowerCase().includes(filtroBusqueda.toLowerCase()) || o.id.toLowerCase().includes(filtroBusqueda.toLowerCase()))
    );

    return (
        <div className="os-page">

            {mensajeDiagnostico && <div role="status">{mensajeDiagnostico}</div>}

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
                                                            onClick={() => {
                                                                iniciarDiagnosticoModal(ods);
                                                            }}
                                                        >
                                                            📋 Diagnosticar
                                                        </button>
                                                    )}

                                                    {estadoActivo === "Recepción" && (
                                                        <button
                                                            className="btn-act-table link"
                                                            onClick={() => {
                                                                setOdsSeleccionadaModal(ods);
                                                                setEstadoAprobacionCliente(ods.estado_aprobacion_cliente || "Pendiente");
                                                                setMostrarModalCliente(true);
                                                            }}
                                                        >
                                                            📲 Link Cliente
                                                        </button>
                                                    )}

                                                    {estadoActivo === "Entrega" && (
                                                        <button
                                                            className="btn-act-table nps"
                                                            onClick={() => {
                                                                setOdsSeleccionadaModal(ods);
                                                                setMostrarModalEntrega(true);
                                                            }}
                                                        >
                                                            ⭐ Entregar & NPS
                                                        </button>
                                                    )}

                                                    <button
                                                        className="btn-act-table trace"
                                                        onClick={() => {
                                                            abrirInspeccionODS(ods);
                                                        }}
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
                                                {vehiculo.marca} {vehiculo.modelo} / {vehiculo.placa}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="campo-group">
                                    <div className="campo">
                                        <label>Tipo de Vehículo</label>
                                        <select
                                            value={tipoVehiculo || "Sedán"}
                                            onChange={(e) => setTipoVehiculo(e.target.value)}
                                        >
                                            <option value="Sedán">Sedán</option>
                                            <option value="SUV / Camioneta">SUV / Camioneta</option>
                                            <option value="Pick-up">Pick-up</option>
                                            <option value="Hatchback">Hatchback</option>
                                            <option value="Van / Furgoneta">Van / Furgoneta</option>
                                        </select>
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
                                        <select
                                            value={cotizacionSeleccionadaId}
                                            onChange={(e) => {
                                                const cotId = e.target.value;
                                                setCotizacionSeleccionadaId(cotId);
                                                const cot = cotizacionesCliente.find(c => String(c.cotizacion_id) === String(cotId));
                                                if (cot) {
                                                    setCotizacionPrevia(`${cot.codigo_cotizacion} (Total: S/ ${Number(cot.total).toFixed(2)})`);
                                                    if (cot.detalles && cot.detalles.length > 0 && (!motivoDetallado || motivoDetallado === "Ruido inusual en frenos traseros al desacelerar.")) {
                                                        const desc = cot.detalles.map(d => `${d.descripcion} (Cant: ${d.cantidad})`).join(", ");
                                                        setMotivoDetallado(desc);
                                                    }
                                                } else {
                                                    setCotizacionPrevia("Sin Cotización");
                                                }
                                            }}
                                            disabled={!clienteSeleccionadoId}
                                        >
                                            <option value="">Sin Cotización</option>
                                            {cotizacionesCliente.map((cot) => (
                                                <option key={cot.cotizacion_id} value={cot.cotizacion_id}>
                                                    {cot.codigo_cotizacion} - S/ {Number(cot.total).toFixed(2)} ({cot.estado || 'Emitida'}{cot.vehiculo_placa ? ` | ${cot.vehiculo_placa}` : ''})
                                                </option>
                                            ))}
                                        </select>
                                        {clienteSeleccionadoId && cotizacionesCliente.length === 0 && (
                                            <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                ℹ️ No hay cotizaciones previas registradas para este cliente.
                                            </small>
                                        )}
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
                                        {fotosMotivo.map((foto, index) => (
                                            <div key={`${foto.nombre}-${index}`} className="photo-thumb">
                                                <img src={foto.contenido} alt={foto.nombre} width="64" height="48" />
                                                <span>{foto.nombre}</span>
                                            </div>
                                        ))}
                                        <label className="btn-add-photo">
                                            Seleccionar imagen
                                            <input type="file" accept="image/*" multiple onChange={seleccionarFotosIngreso} />
                                        </label>
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

                        {/* 4. INSPECCIÓN 3D DAÑOS EN CARROCERÍA */}
                        <section className="os-card full-width">
                            <div className="card-header">
                                <div className="card-title-icon"><span className="material-symbols-outlined">car_repair</span></div>
                                <div>
                                    <h2>4. Mapa Visual de Daños de Carrocería</h2>
                                    <p>Haz clic en las piezas del vehículo para registrar tipo de daño, severidad, observación y ubicación 3D.</p>
                                </div>
                            </div>

                            <VisorVehiculo3D
                                tipoVehiculo={tipoVehiculo || "Sedán"}
                                colorVehiculo={color || "#2563eb"}
                                danios={danios}
                                setDanios={setDanios}
                                onTipoVehiculoChange={(nuevoTipo) => setTipoVehiculo(nuevoTipo)}
                            />
                        </section>

                    </div>

                </div>
            )}

            {/* =========================================
                MODAL 1: FLUJO DE APROBACIÓN DEL CLIENTE
            ========================================= */}
            {mostrarModalCliente && odsSeleccionadaModal && (
                <div className="modal-overlay">
                    <div className="modal-content client-preview">
                        <div className="modal-header">
                            <div>
                                <span className="read-only-badge">👁 VISTA DE APROBACIÓN DEL CLIENTE</span>
                                <h2>Aprobación de Orden de Servicio</h2>
                                <p>Enlace interactivo generado para envío por WhatsApp o Mail.</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalCliente(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="summary-box">
                                <h3>VERAMOTORS SAC - {odsSeleccionadaModal.id}</h3>
                                <p><strong>Cliente:</strong> {odsSeleccionadaModal.cliente} | <strong>Vehículo / Placa:</strong> {odsSeleccionadaModal.placa}</p>
                                <p><strong>Motivo Reportado:</strong> {odsSeleccionadaModal.motivo}</p>
                                <p><strong>Tipo de Procedimiento:</strong> {odsSeleccionadaModal.procedimiento}</p>
                                <p><strong>Técnico Responsable:</strong> {odsSeleccionadaModal.tecnico}</p>
                            </div>

                            <div style={{ margin: "14px 0", display: "flex", gap: "10px", alignItems: "center" }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}/aprobacion-cliente/${odsSeleccionadaModal.id}`}
                                    style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #334155", background: "#0f172a", color: "#94a3b8", fontSize: "13px" }}
                                />
                                <button
                                    type="button"
                                    className="btn-act-table link"
                                    onClick={() => {
                                        const link = `${window.location.origin}/aprobacion-cliente/${odsSeleccionadaModal.id}`;
                                        navigator.clipboard.writeText(link);
                                        alert(`¡Link de aprobación copiado al portapapeles!\n\n${link}`);
                                    }}
                                    style={{ padding: "8px 14px", fontWeight: "bold" }}
                                >
                                    📋 Copiar Link
                                </button>
                            </div>

                            <div className="approval-status-box">
                                <strong>Estado Actual de Aprobación:</strong>{" "}
                                <span className={`status-pill ${estadoAprobacionCliente.toLowerCase()}`}>
                                    {estadoAprobacionCliente}
                                </span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-reject"
                                onClick={async () => {
                                    try {
                                        await actualizarODS(odsSeleccionadaModal.ods_id, { estado_aprobacion_cliente: "Denegado" });
                                        setEstadoAprobacionCliente("Denegado");
                                        alert(`La orden ${odsSeleccionadaModal.id} ha sido marcada como Denegada.`);
                                        setMostrarModalCliente(false);
                                        await cargarDatosODS();
                                    } catch (err) {
                                        console.error("Error denegando orden:", err);
                                        alert("No se pudo actualizar el estado en el servidor.");
                                    }
                                }}
                            >
                                ✖ Denegar Orden
                            </button>
                            <button
                                className="btn-approve"
                                onClick={async () => {
                                    try {
                                        await actualizarODS(odsSeleccionadaModal.ods_id, {
                                            estado_aprobacion_cliente: "Aprobado",
                                            estado_actual: "Diagnóstico"
                                        });
                                        setEstadoAprobacionCliente("Aprobado");
                                        alert(`¡Orden ${odsSeleccionadaModal.id} aprobada por el cliente! Avanzó automáticamente al estado de Diagnóstico.`);
                                        setMostrarModalCliente(false);
                                        await cargarDatosODS();
                                    } catch (err) {
                                        console.error("Error aprobando orden:", err);
                                        alert("No se pudo actualizar la aprobación en el servidor.");
                                    }
                                }}
                            >
                                ✔ Aprobar & Avanzar a Diagnóstico
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
                                <p>
                                    ODS: {odsSeleccionadaModal?.id || "ODS"} | Vehículo: {odsSeleccionadaModal?.placa || "Vehículo"} | Propietario: {odsSeleccionadaModal?.cliente || "Cliente"}
                                </p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalDiagnostico(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Falla Detectada *</label>
                                <input type="text" value={nuevaFalla} onChange={(e) => setNuevaFalla(e.target.value)} placeholder="Ej: Desgaste severo en pastillas y fuga de líquido de frenos" />
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
                                <label>Repuestos de inventario</label>
                                <div className="repuesto-search-box" style={{ display: "flex", gap: "10px" }}>
                                    <select value={repuestoItemId} onChange={(event) => setRepuestoItemId(event.target.value)}>
                                        <option value="">Selecciona un artículo existente</option>
                                        {repuestosDisponibles.filter((item) => item.activo).map((item) => (
                                            <option key={item.item_id} value={item.item_id}>
                                                {item.codigo_referencia} · {item.nombre_nomenclatura} · stock {item.stock_actual}
                                            </option>
                                        ))}
                                    </select>
                                    <input type="number" min="0.01" step="0.01" value={cantidadRepuesto} onChange={(event) => setCantidadRepuesto(event.target.value)} aria-label="Cantidad de repuesto" />
                                    <button type="button" className="btn-act-table diag" onClick={agregarRepuestoDiagnostico} disabled={!repuestoItemId || Number(cantidadRepuesto) <= 0}>
                                        Añadir
                                    </button>
                                </div>
                                {repuestosODS.length > 0 && <p>Repuestos ya asociados a esta ODS: {repuestosODS.map((item) => `${item.codigo_referencia} × ${item.cantidad}`).join(", ")}</p>}
                                {repuestosSeleccionados.map((linea) => {
                                    const item = repuestosDisponibles.find((disponible) => disponible.item_id === linea.item_id);
                                    return <div key={linea.item_id}>{item?.codigo_referencia} · {item?.nombre_nomenclatura} × {linea.cantidad}</div>;
                                })}
                            </div>

                            {errorDiagnostico && <div role="alert">{errorDiagnostico}</div>}
                            {cargandoDiagnostico && <p>Cargando información de PostgreSQL…</p>}
                            {fallasRegistradas.length > 0 && (
                                <div className="diagnosticos-persistidos">
                                    <h3>Diagnósticos registrados</h3>
                                    {fallasRegistradas.map((diagnostico) => (
                                        <div key={diagnostico.diagnostico_id}>
                                            <strong>{diagnostico.falla_reportada}</strong>
                                            <p>{diagnostico.comentarios_tecnico || "Sin comentarios"}</p>
                                            <small>{new Date(diagnostico.fecha_diagnostico).toLocaleString("es-PE")}</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancelar" onClick={() => setMostrarModalDiagnostico(false)}>Cancelar</button>
                            <button
                                className="btn-guardar"
                                onClick={agregarFallaDiagnostico}
                                disabled={guardandoDiagnostico || cargandoDiagnostico || !nuevaFalla.trim()}
                            >
                                {guardandoDiagnostico ? "Guardando…" : "Guardar diagnóstico y avanzar ODS"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL 4: ENTREGA Y ENCUESTA DE SATISFACCIÓN (NPS)
            ========================================= */}
            {mostrarModalEntrega && odsSeleccionadaModal && (
                <div className="modal-overlay">
                    <div className="modal-content nps-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Entrega de Vehículo - {odsSeleccionadaModal.id}</h2>
                                <p>Cliente: {odsSeleccionadaModal.cliente} | Vehículo: {odsSeleccionadaModal.placa}</p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalEntrega(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <p>Confirma la entrega del vehículo para archivar esta orden de servicio.</p>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancelar" onClick={() => setMostrarModalEntrega(false)}>Cerrar</button>
                            <button
                                className="btn-guardar"
                                onClick={async () => {
                                    try {
                                        await cambiarEstadoODS(odsSeleccionadaModal.ods_id, "Archivados");
                                        alert(`Entrega registrada. La orden ${odsSeleccionadaModal.id} quedó archivada.`);
                                        setMostrarModalEntrega(false);
                                        await cargarDatosODS();
                                    } catch (err) {
                                        console.error("Error finalizando entrega:", err);
                                        alert("No se pudo actualizar el estado de entrega en el servidor.");
                                    }
                                }}
                            >
                                Registrar entrega y archivar orden
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL 5: TRAZABILIDAD Y CONTROL DE ESTADO "VER ODS"
            ========================================= */}
            {mostrarModalTrazabilidad && odsSeleccionadaModal && (
                <div className="modal-overlay">
                    <div
                        className="modal-content trace-modal"
                        style={{
                            maxWidth: "900px",
                            width: "95vw",
                            maxHeight: "92vh",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden"
                        }}
                    >
                        <div className="modal-header">
                            <div>
                                <h2>Trazabilidad & Detalle - {odsSeleccionadaModal.id}</h2>
                                <p style={{ margin: "4px 0 0", color: "#94a3b8" }}>
                                    Ticket: <strong>{odsSeleccionadaModal.ticket}</strong> | Ingreso: {odsSeleccionadaModal.fecha}
                                </p>
                            </div>
                            <button className="btn-close" onClick={() => setMostrarModalTrazabilidad(false)}>✕</button>
                        </div>

                        <div
                            className="modal-body"
                            style={{
                                overflowY: "auto",
                                flex: 1,
                                minHeight: 0
                            }}
                        >
                            {/* DATOS GENERALES DE LA ORDEN */}
                            <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
                                    <div>
                                        <span style={{ color: "#94a3b8" }}>Cliente / Propietario:</span>
                                        <strong style={{ display: "block", color: "#f8fafc", fontSize: "15px" }}>{odsSeleccionadaModal.cliente}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#94a3b8" }}>Vehículo / Placa:</span>
                                        <strong style={{ display: "block", color: "#f8fafc", fontSize: "15px" }}>{odsSeleccionadaModal.placa}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#94a3b8" }}>Técnico Asignado:</span>
                                        <strong style={{ display: "block", color: "#38bdf8" }}>{odsSeleccionadaModal.tecnico}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#94a3b8" }}>Procedimiento:</span>
                                        <strong style={{ display: "block", color: "#f8fafc" }}>{odsSeleccionadaModal.procedimiento}</strong>
                                    </div>
                                    <div style={{ gridColumn: "span 2" }}>
                                        <span style={{ color: "#94a3b8" }}>Motivo de Ingreso:</span>
                                        <p style={{ margin: "4px 0 0", color: "#e2e8f0" }}>{odsSeleccionadaModal.motivo}</p>
                                    </div>
                                </div>
                            </div>

                            {/* =====================================================
                                INSPECCIÓN 3D REGISTRADA
                            ===================================================== */}
                            <div
                                style={{
                                    background: "#0f172a",
                                    border: "1px solid #334155",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    marginBottom: "20px"
                                }}
                            >
                                <div style={{ marginBottom: "14px" }}>
                                    <h3
                                        style={{
                                            margin: 0,
                                            color: "#60a5fa",
                                            fontSize: "16px"
                                        }}
                                    >
                                        🚗 Inspección 3D de Carrocería
                                    </h3>
                                    <p
                                        style={{
                                            margin: "5px 0 0",
                                            color: "#94a3b8",
                                            fontSize: "12px"
                                        }}
                                    >
                                        Visualización de los daños registrados durante la recepción del vehículo.
                                    </p>
                                </div>

                                <VisorVehiculo3D
                                    tipoVehiculo={
                                        odsSeleccionadaModal?.inspeccion_json?.tipo_vehiculo ||
                                        "Sedán"
                                    }
                                    colorVehiculo={
                                        odsSeleccionadaModal?.inspeccion_json?.color ||
                                        odsSeleccionadaModal?.color ||
                                        "#2563eb"
                                    }
                                    danios={daniosODSSeleccionada}
                                    setDanios={setDaniosODSSeleccionada}
                                    modoLectura={false}
                                />

                                <div
                                    style={{
                                        marginTop: "14px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "12px",
                                        flexWrap: "wrap"
                                    }}
                                >
                                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                                        Puedes hacer clic en otra pieza para registrar más daños.
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-guardar"
                                        onClick={guardarDanosODSSeleccionada}
                                        disabled={guardandoDanosODS}
                                        style={{ padding: "10px 16px", fontWeight: "bold" }}
                                    >
                                        {guardandoDanosODS
                                            ? "Guardando inspección..."
                                            : "💾 Guardar cambios de inspección"}
                                    </button>
                                </div>
                            </div>

                            {/* CONTROL INTERACTIVO DE AVANCE DE ESTADO */}
                            <div style={{ background: "#1e293b", border: "1px solid #3b82f6", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: "#60a5fa", fontSize: "16px" }}>Mover Estado Operativo</h3>
                                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Actualiza en tiempo real en la tabla y en el Tablero Kanban</span>
                                    </div>
                                    <span className={`proc-tag ${odsSeleccionadaModal.estado.toLowerCase()}`} style={{ fontSize: "13px", padding: "4px 10px" }}>
                                        Estado: {odsSeleccionadaModal.estado}
                                    </span>
                                </div>

                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    <select
                                        value={estadoCambioODS}
                                        onChange={(e) => setEstadoCambioODS(e.target.value)}
                                        style={{ flex: 1, padding: "10px 12px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff", fontSize: "14px" }}
                                    >
                                        {["Recepción", "Diagnóstico", "Repuestos", "Aprobación", "Reparación", "Control de Calidad", "Entrega", "Archivados"].map((st) => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn-guardar"
                                        disabled={guardandoEstado}
                                        onClick={async () => {
                                            try {
                                                setGuardandoEstado(true);
                                                await cambiarEstadoODS(odsSeleccionadaModal.ods_id, estadoCambioODS);
                                                alert(`¡ODS ${odsSeleccionadaModal.id} movida a "${estadoCambioODS}" con éxito!`);
                                                setMostrarModalTrazabilidad(false);
                                                await cargarDatosODS();
                                            } catch (err) {
                                                console.error("Error cambiando estado:", err);
                                                alert("No se pudo actualizar el estado de la ODS.");
                                            } finally {
                                                setGuardandoEstado(false);
                                            }
                                        }}
                                        style={{ padding: "10px 18px", fontWeight: "bold" }}
                                    >
                                        {guardandoEstado ? "Guardando..." : "🚀 Actualizar Estado"}
                                    </button>
                                </div>
                            </div>

                            {/* TIMELINE VISUAL */}
                            <div className="timeline" style={{ borderLeft: '2px solid #3b82f6', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <strong style={{ color: '#60a5fa' }}>🟢 1. RECEPCIÓN</strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                        Registrado el {odsSeleccionadaModal.fecha} por Asesor de Servicio. Inspección inicial y motivo detallado listos.
                                    </p>
                                </div>
                                <div>
                                    <strong style={{ color: ['Diagnóstico', 'Repuestos', 'Aprobación', 'Reparación', 'Control de Calidad', 'Entrega', 'Archivados'].includes(odsSeleccionadaModal.estado) ? '#eab308' : '#64748b' }}>
                                        🟡 2. EVALUACIÓN Y DIAGNÓSTICO TÉCNICO
                                    </strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        Técnico responsable: <strong>{odsSeleccionadaModal.tecnico}</strong>.
                                    </p>
                                </div>
                                <div>
                                    <strong style={{ color: ['Repuestos', 'Aprobación', 'Reparación', 'Control de Calidad', 'Entrega', 'Archivados'].includes(odsSeleccionadaModal.estado) ? '#a855f7' : '#64748b' }}>
                                        🟣 3. GESTIÓN DE REPUESTOS E INSUMOS
                                    </strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        Despacho y verificación de stock para la orden.
                                    </p>
                                </div>
                                <div>
                                    <strong style={{ color: ['Aprobación', 'Reparación', 'Control de Calidad', 'Entrega', 'Archivados'].includes(odsSeleccionadaModal.estado) ? '#06b6d4' : '#64748b' }}>
                                        🔵 4. APROBACIÓN DEL CLIENTE
                                    </strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        Estado de aprobación del cliente: <strong>{odsSeleccionadaModal.estado_aprobacion_cliente}</strong>.
                                    </p>
                                </div>
                                <div>
                                    <strong style={{ color: ['Reparación', 'Control de Calidad', 'Entrega', 'Archivados'].includes(odsSeleccionadaModal.estado) ? '#f97316' : '#64748b' }}>
                                        🟠 5. REPARACIÓN / SERVICIO EN TALLER
                                    </strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        Ejecución de trabajos y pruebas mecánicas/eléctricas.
                                    </p>
                                </div>
                                <div>
                                    <strong style={{ color: ['Entrega', 'Archivados'].includes(odsSeleccionadaModal.estado) ? '#22c55e' : '#64748b' }}>
                                        🟢 6. CONTROL DE CALIDAD & ENTREGA
                                    </strong>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        Lavado, verificación final y encuesta NPS de satisfacción.
                                    </p>
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