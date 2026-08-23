import { useState } from "react";
import "./Clientes.css";

function Clientes() {
    const [clienteSeleccionado, setClienteSeleccionado] = useState(0);
    const [busqueda, setBusqueda] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [tipoPersona, setTipoPersona] = useState("persona");
    const [ubigeoDept, setUbigeoDept] = useState("Lima");
    const [ubigeoProv, setUbigeoProv] = useState("Lima");
    const [ubigeoDist, setUbigeoDist] = useState("San Isidro");

    const clientes = [
        {
            id: 1,
            nombre: "Carlos Mendoza",
            telefono: "+51 987 654 321",
            correo: "carlos.mendoza@gmail.com",
            ciudad: "Lima, Perú",
            desde: "2021",
            vehiculos: 2,
            ltv: "S/ 3,450.00",
            iniciales: "CM",

            vehiculosData: [
                {
                    marca: "Toyota",
                    modelo: "Corolla",
                    placa: "ABC-123",
                    anio: "2018",
                    motor: "2.0",
                    kilometraje: "84,500 km",
                    estado: "Servicio pendiente",
                },
                {
                    marca: "Hyundai",
                    modelo: "Tucson",
                    placa: "XYZ-456",
                    anio: "2020",
                    motor: "2.0",
                    kilometraje: "62,300 km",
                    estado: "Al día",
                },
            ],

            historial: [
                {
                    vehiculo: "Toyota Corolla · ABC-123",
                    titulo: "Mantenimiento preventivo",
                    fecha: "12 Oct, 2023",
                    monto: "S/ 450.00",
                    descripcion:
                        "Cambio de aceite, filtro de aceite, filtro de aire y revisión general del vehículo.",
                    estado: "Completado",
                },
                {
                    vehiculo: "Hyundai Tucson · XYZ-456",
                    titulo: "Diagnóstico de motor",
                    fecha: "04 Jun, 2023",
                    monto: "S/ 185.00",
                    descripcion:
                        "Diagnóstico computarizado y revisión del sistema de inyección.",
                    estado: "Completado",
                },
            ],
        },

        {
            id: 2,
            nombre: "Elena Rojas",
            telefono: "+51 912 345 678",
            correo: "elena.rojas@gmail.com",
            ciudad: "Lima, Perú",
            desde: "2023",
            vehiculos: 1,
            ltv: "S/ 850.00",
            iniciales: "ER",

            vehiculosData: [
                {
                    marca: "Kia",
                    modelo: "Sportage",
                    placa: "DEF-789",
                    anio: "2021",
                    motor: "2.0",
                    kilometraje: "45,200 km",
                    estado: "Al día",
                },
            ],

            historial: [
                {
                    vehiculo: "Kia Sportage · DEF-789",
                    titulo: "Cambio de aceite",
                    fecha: "15 May, 2024",
                    monto: "S/ 280.00",
                    descripcion:
                        "Cambio de aceite y filtros correspondientes al mantenimiento preventivo.",
                    estado: "Completado",
                },
            ],
        },

        {
            id: 3,
            nombre: "Talleres Industriales S.A.",
            telefono: "+51 900 555 111",
            correo: "contacto@talleresindustriales.com",
            ciudad: "Lima, Perú",
            desde: "2020",
            vehiculos: 14,
            ltv: "S/ 24,100.00",
            iniciales: "TI",

            vehiculosData: [
                {
                    marca: "Toyota",
                    modelo: "Hilux",
                    placa: "GHI-321",
                    anio: "2022",
                    motor: "2.8",
                    kilometraje: "35,400 km",
                    estado: "Al día",
                },
                {
                    marca: "Ford",
                    modelo: "Ranger",
                    placa: "JKL-654",
                    anio: "2021",
                    motor: "3.2",
                    kilometraje: "52,100 km",
                    estado: "Servicio pendiente",
                },
            ],

            historial: [
                {
                    vehiculo: "Toyota Hilux · GHI-321",
                    titulo: "Mantenimiento general",
                    fecha: "20 Ago, 2024",
                    monto: "S/ 1,250.00",
                    descripcion:
                        "Mantenimiento completo del vehículo y revisión de componentes.",
                    estado: "Completado",
                },
            ],
        },
    ];

    const cliente = clientes[clienteSeleccionado];

    const clientesFiltrados = clientes.filter((item) =>
        item.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const cerrarFormulario = () => {
        setMostrarFormulario(false);
    };

    const registrarCliente = (e) => {
        e.preventDefault();

        alert("Cliente registrado correctamente");

        setMostrarFormulario(false);
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
                                            placeholder={tipoPersona === "persona" ? "Ingrese DNI" : "Ingrese RUC"}
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            {tipoPersona === "persona" ? "Nombres" : "Razón Social"}
                                        </label>

                                        <input
                                            type="text"
                                            placeholder={tipoPersona === "persona" ? "Ingrese nombres" : "Ingrese Razón Social"}
                                        />

                                    </div>


                                    {tipoPersona === "persona" && (
                                        <div className="form-group">

                                            <label>
                                                Apellidos
                                            </label>

                                            <input
                                                type="text"
                                                placeholder="Ingrese apellidos"
                                            />

                                        </div>
                                    )}


                                    <div className="form-group">

                                        <label>
                                            Teléfono / Celular
                                        </label>

                                        <input
                                            type="tel"
                                            placeholder="Ingrese teléfono"
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Correo electrónico
                                        </label>

                                        <input
                                            type="email"
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

                                        <input
                                            type="text"
                                            placeholder="Av. Principal N° 123, Urb..."
                                        />

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