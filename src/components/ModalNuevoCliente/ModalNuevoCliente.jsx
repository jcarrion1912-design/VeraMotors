import { useState } from "react";
import "./ModalNuevoCliente.css";

const API_URL = "http://127.0.0.1:8000/api";

function ModalNuevoCliente({ isOpen, onClose, onClienteRegistrado }) {
    const [tipoPersona, setTipoPersona] = useState("Natural");
    const [nuevoDoc, setNuevoDoc] = useState("");
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [nuevoTelefono, setNuevoTelefono] = useState("");
    const [nuevoEmail, setNuevoEmail] = useState("");
    const [ubigeoDept, setUbigeoDept] = useState("Lima");
    const [ubigeoProv, setUbigeoProv] = useState("Lima");
    const [ubigeoDist, setUbigeoDist] = useState("San Isidro");

    // Vehículo
    const [nuevoTipoVehiculo, setNuevoTipoVehiculo] = useState("Automóvil");
    const [nuevaMarca, setNuevaMarca] = useState("");
    const [nuevoModelo, setNuevoModelo] = useState("");
    const [nuevaPlaca, setNuevaPlaca] = useState("");
    const [nuevoAnio, setNuevoAnio] = useState("");
    const [nuevoColor, setNuevoColor] = useState("");
    const [nuevoVin, setNuevoVin] = useState("");

    const [guardando, setGuardando] = useState(false);

    const [marcaPersonalizada, setMarcaPersonalizada] = useState("");
    const [modeloPersonalizado, setModeloPersonalizado] = useState("");

    const marcasModelos = {
        Toyota: ["Corolla", "Yaris", "Hilux", "RAV4", "Fortuner", "Avanza", "Etios", "Rush"],
        Nissan: ["Versa", "Sentra", "Frontier", "X-Trail", "Kicks", "Qashqai"],
        Honda: ["Civic", "Accord", "CR-V", "HR-V", "Fit"],
        Mazda: ["Mazda 2", "Mazda 3", "CX-3", "CX-5", "CX-30"],
        Mitsubishi: ["L200", "ASX", "Outlander", "Montero", "Lancer"],
        Suzuki: ["Swift", "Vitara", "Jimny", "S-Presso", "Celerio"],

        Volkswagen: ["Gol", "Polo", "Jetta", "Tiguan", "Amarok", "T-Cross"],
        BMW: ["Serie 1", "Serie 3", "Serie 5", "X1", "X3", "X5"],
        "Mercedes-Benz": ["Clase A", "Clase C", "Clase E", "GLA", "GLC"],
        Audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
        Porsche: ["911", "Cayenne", "Macan", "Panamera"],

        Hyundai: ["Accent", "Elantra", "Tucson", "Santa Fe", "Creta", "i10"],
        Kia: ["Rio", "Cerato", "Sportage", "Sorento", "Picanto", "Seltos"],
        Genesis: ["G70", "G80", "GV70", "GV80"],

        BYD: ["Seagull", "Dolphin", "Yuan Plus", "Song Plus", "Han"],
        Chery: ["Tiggo 2", "Tiggo 4", "Tiggo 7", "Tiggo 8", "Arrizo 5"],
        "Great Wall": ["Wingle 5", "Wingle 7", "Poer", "Haval H6"],
        Geely: ["Coolray", "Geometry C", "Okavango", "Emgrand"],

        Ford: ["Ranger", "Everest", "Explorer", "Escape", "Mustang"],
        Chevrolet: ["Onix", "Tracker", "Captiva", "Colorado", "Tahoe"],
        Jeep: ["Renegade", "Compass", "Wrangler", "Grand Cherokee"],
        Tesla: ["Model 3", "Model S", "Model X", "Model Y"]
    };

    const gruposMarcas = {
        "Japonesas": ["Toyota", "Nissan", "Honda", "Mazda", "Mitsubishi", "Suzuki"],
        "Alemanas": ["Volkswagen", "BMW", "Mercedes-Benz", "Audi", "Porsche"],
        "Coreanas": ["Hyundai", "Kia", "Genesis"],
        "Chinas": ["BYD", "Chery", "Great Wall", "Geely"],
        "Estadounidenses": ["Ford", "Chevrolet", "Jeep", "Tesla"]
    };

    if (!isOpen) return null;

    const resetForm = () => {
        setTipoPersona("Natural");
        setNuevoDoc("");
        setNuevoNombre("");
        setNuevoTelefono("");
        setNuevoEmail("");
        setUbigeoDept("Lima");
        setUbigeoProv("Lima");
        setUbigeoDist("San Isidro");

        setNuevoTipoVehiculo("Automóvil");
        setNuevaMarca("");
        setNuevoModelo("");
        setNuevaPlaca("");
        setNuevoAnio("");
        setNuevoColor("");
        setNuevoVin("");
        setMarcaPersonalizada("");
        setModeloPersonalizado("");
    };

    const handleClose = () => {
        if (guardando) return;
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const documento = nuevoDoc.trim();
        const nombre = nuevoNombre.trim();
        const telefono = nuevoTelefono.trim();
        const email = nuevoEmail.trim();

        // Vehículo
        const tipoVehiculo = nuevoTipoVehiculo.trim();
        const marca = (
            nuevaMarca === "Otros"
                ? marcaPersonalizada
                : nuevaMarca
        ).trim();

        const modelo = (
            nuevoModelo === "Otros" || nuevaMarca === "Otros"
                ? modeloPersonalizado
                : nuevoModelo
        ).trim();
        const placa = nuevaPlaca.trim().toUpperCase();
        const anio = nuevoAnio.trim();
        const color = nuevoColor.trim();
        const vin = nuevoVin.trim().toUpperCase();

        // Validaciones Cliente
        const documentoRegex = tipoPersona === "Natural" ? /^\d{8}$/ : /^\d{11}$/;
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

        // Validaciones Vehículo
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
            setGuardando(true);

            // PASO 1: CREAR CLIENTE
            const clienteBody = {
                tipo_persona: tipoPersona,
                documento_identidad: documento,
                nombre_razon_social: nombre,
                direccion_ubigeo: `${ubigeoDept.trim()} - ${ubigeoDist.trim()}`,
                telefono: telefono || null,
                email: email || null
            };

            const resCliente = await fetch(`${API_URL}/clientes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(clienteBody)
            });

            if (!resCliente.ok) {
                let mensaje = "No se pudo registrar el cliente.";
                try {
                    const errorData = await resCliente.json();
                    if (typeof errorData.detail === "string") {
                        mensaje = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        mensaje = errorData.detail.map((item) => item.msg).filter(Boolean).join("\n");
                    }
                } catch {
                    // Mantener mensaje genérico
                }
                throw new Error(mensaje);
            }

            const clienteCreado = await resCliente.json();
            const clienteId = clienteCreado.cliente_id;

            // PASO 2: CREAR VEHÍCULO
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

            const resVehiculo = await fetch(`${API_URL}/vehiculos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(vehiculoBody)
            });

            let vehiculoCreado = null;
            if (!resVehiculo.ok) {
                let mensaje = "El cliente se registró, pero el vehículo no pudo guardarse.";
                try {
                    const errorData = await resVehiculo.json();
                    if (typeof errorData.detail === "string") {
                        mensaje = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        mensaje = errorData.detail.map((item) => item.msg).filter(Boolean).join("\n");
                    }
                } catch {
                    // Mantener mensaje anterior
                }
                alert(mensaje);
            } else {
                vehiculoCreado = await resVehiculo.json();
            }

            resetForm();
            if (onClienteRegistrado) {
                await onClienteRegistrado({ cliente: clienteCreado, vehiculo: vehiculoCreado });
            }
        } catch (error) {
            console.error("Error al registrar cliente y vehículo:", error);
            alert(error.message || "Ocurrió un error inesperado al registrar el cliente.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div
            className="modal-nuevo-cliente-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div className="modal-nuevo-cliente-card">
                <div className="modal-nuevo-cliente-header">
                    <div>
                        <h2>Nuevo Cliente</h2>
                        <p>Registra la información del cliente y su vehículo inicial.</p>
                    </div>
                    <button
                        type="button"
                        className="btn-cerrar-modal-nc"
                        onClick={handleClose}
                        disabled={guardando}
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form className="form-nuevo-cliente" onSubmit={handleSubmit}>
                    {/* INFORMACIÓN DEL CLIENTE */}
                    <div className="form-section">
                        <h3>Información del cliente</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Tipo de cliente</label>
                                <select
                                    value={tipoPersona}
                                    onChange={(e) => setTipoPersona(e.target.value)}
                                >
                                    <option value="Natural">Persona natural</option>
                                    <option value="Jurídica">Empresa</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>
                                    {tipoPersona === "Natural" ? "DNI (8 dígitos)" : "RUC (11 dígitos)"}
                                </label>
                                <input
                                    type="text"
                                    value={nuevoDoc}
                                    onChange={(e) => setNuevoDoc(e.target.value.replace(/\D/g, ""))}
                                    placeholder={tipoPersona === "Natural" ? "Ingrese DNI" : "Ingrese RUC"}
                                    maxLength={tipoPersona === "Natural" ? 8 : 11}
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
                                <label>Teléfono / Celular</label>
                                <input
                                    type="tel"
                                    value={nuevoTelefono}
                                    onChange={(e) => setNuevoTelefono(e.target.value.replace(/\D/g, ""))}
                                    placeholder="Ingrese teléfono (9 dígitos)"
                                    maxLength={9}
                                />
                            </div>

                            <div className="form-group">
                                <label>Correo electrónico</label>
                                <input
                                    type="email"
                                    value={nuevoEmail}
                                    onChange={(e) => setNuevoEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                />
                            </div>

                            <div className="form-group form-group-full">
                                <label>
                                    Dirección Ubigeo (Departamento, Provincia, Distrito)
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={ubigeoDept}
                                        onChange={(e) => setUbigeoDept(e.target.value)}
                                        placeholder="Departamento"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={ubigeoProv}
                                        onChange={(e) => setUbigeoProv(e.target.value)}
                                        placeholder="Provincia"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={ubigeoDist}
                                        onChange={(e) => setUbigeoDist(e.target.value)}
                                        placeholder="Distrito"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INFORMACIÓN DEL VEHÍCULO */}
                    <div className="form-section">
                        <h3>Información del vehículo</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Tipo de vehículo</label>
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
                                <label>Marca</label>

                                <select
                                    value={nuevaMarca}
                                    onChange={(e) => {
                                        setNuevaMarca(e.target.value);
                                        setNuevoModelo("");
                                        setMarcaPersonalizada("");
                                        setModeloPersonalizado("");
                                    }}
                                    required
                                >
                                    <option value="">Seleccionar marca</option>

                                    {Object.entries(gruposMarcas).map(([grupo, marcas]) => (
                                        <optgroup key={grupo} label={grupo}>
                                            {marcas.map((marca) => (
                                                <option key={marca} value={marca}>
                                                    {marca}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}

                                    <option value="Otros">Otros</option>
                                </select>

                                {nuevaMarca === "Otros" && (
                                    <input
                                        type="text"
                                        placeholder="Escribir marca"
                                        value={marcaPersonalizada}
                                        onChange={(e) => setMarcaPersonalizada(e.target.value)}
                                        required
                                    />
                                )}
                            </div>

                            <div className="form-group">
                                <label>Modelo</label>

                                <select
                                    value={nuevoModelo}
                                    onChange={(e) => {
                                        setNuevoModelo(e.target.value);
                                        setModeloPersonalizado("");
                                    }}
                                    disabled={!nuevaMarca || nuevaMarca === "Otros"}
                                    required={nuevaMarca !== "Otros"}
                                >
                                    <option value="">Seleccionar modelo</option>

                                    {marcasModelos[nuevaMarca]?.map((modelo) => (
                                        <option key={modelo} value={modelo}>
                                            {modelo}
                                        </option>
                                    ))}

                                    {nuevaMarca && nuevaMarca !== "Otros" && (
                                        <option value="Otros">Otros</option>
                                    )}
                                </select>

                                {(nuevoModelo === "Otros" || nuevaMarca === "Otros") && (
                                    <input
                                        type="text"
                                        placeholder="Escribir modelo"
                                        value={modeloPersonalizado}
                                        onChange={(e) => setModeloPersonalizado(e.target.value)}
                                        required
                                    />
                                )}
                            </div>

                            <div className="form-group">
                                <label>Placa</label>
                                <input
                                    type="text"
                                    placeholder="Ej. ABC-123"
                                    value={nuevaPlaca}
                                    onChange={(e) => setNuevaPlaca(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Año</label>
                                <input
                                    type="number"
                                    placeholder="Ej. 2024"
                                    value={nuevoAnio}
                                    onChange={(e) => setNuevoAnio(e.target.value)}
                                />
                            </div>

                            {/* CAMBIO 1: COLOR Y VIN */}
                            <div className="form-group">
                                <label>Color</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Rojo metálico, Blanco, etc."
                                    value={nuevoColor}
                                    onChange={(e) => setNuevoColor(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>VIN (N° de Chasis)</label>
                                <input
                                    type="text"
                                    placeholder="Ej. 1HGCR2F83HA000000"
                                    value={nuevoVin}
                                    onChange={(e) => setNuevoVin(e.target.value)}
                                    maxLength={50}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-nuevo-cliente-footer">
                        <button
                            type="button"
                            className="btn-cancelar"
                            onClick={handleClose}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-guardar-cliente"
                            disabled={guardando}
                        >
                            <span className="material-symbols-outlined">save</span>
                            {guardando ? "Registrando..." : "Registrar cliente"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalNuevoCliente;

