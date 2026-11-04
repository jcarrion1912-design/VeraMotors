import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BrandMark } from "../../components/Brand/Brand";
import "./AprobacionCliente.css";

// Página pública: el cliente entra desde el enlace sin iniciar sesión.
const API_URL = "http://127.0.0.1:8000/api/aprobacion-cliente";

const moneda = (valor) => `S/ ${Number(valor || 0).toFixed(2)}`;

const leerRespuesta = async (respuesta) => {
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
        throw new Error(typeof datos?.detail === "string" ? datos.detail : "No se pudo procesar la solicitud.");
    }
    return datos;
};

function AprobacionCliente() {
    const { token } = useParams();

    const [solicitud, setSolicitud] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let activa = true;
        fetch(`${API_URL}/${encodeURIComponent(token)}`)
            .then(leerRespuesta)
            .then((datos) => { if (activa) setSolicitud(datos); })
            .catch((e) => { if (activa) setError(e.message); })
            .finally(() => { if (activa) setCargando(false); });
        return () => { activa = false; };
    }, [token]);

    const responder = async (decision) => {
        setEnviando(true);
        setError("");
        try {
            const respuesta = await fetch(`${API_URL}/${encodeURIComponent(token)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision })
            });
            setSolicitud(await leerRespuesta(respuesta));
        } catch (e) {
            setError(e.message);
        } finally {
            setEnviando(false);
        }
    };

    const estado = solicitud?.estado_aprobacion;
    const pendiente = estado === "Pendiente";

    return (
        <div className="aprobacion-page">
            <main className="aprobacion-card">
                <header className="aprobacion-marca">
                    <BrandMark size={40} />
                    <div>
                        <strong>VERAMOTORS</strong>
                        <span>Aprobación de servicio</span>
                    </div>
                </header>

                {cargando && <p className="vm-loading" role="status">Consultando tu orden de servicio…</p>}

                {error && (
                    <div className="vm-alert" role="alert">
                        <span className="material-symbols-outlined">error</span>
                        <span>{error}</span>
                    </div>
                )}

                {solicitud && (
                    <>
                        <div className="aprobacion-encabezado">
                            <div>
                                <h1>{solicitud.cliente_nombre ? `Hola, ${solicitud.cliente_nombre}` : "Tu orden de servicio"}</h1>
                                <p>Revisa el servicio propuesto para tu vehículo y confirma si podemos continuar.</p>
                            </div>
                            {solicitud.codigo_ods && <span className="vm-code">{solicitud.codigo_ods}</span>}
                        </div>

                        <dl className="aprobacion-datos">
                            <div>
                                <dt>Vehículo</dt>
                                <dd>
                                    {solicitud.vehiculo || "No registrado"}
                                    {solicitud.placa && <span className="vm-plate">{solicitud.placa}</span>}
                                </dd>
                            </div>
                            <div>
                                <dt>Servicio</dt>
                                <dd>{solicitud.procedimiento || "Servicio general"}</dd>
                            </div>
                            {solicitud.motivo && (
                                <div className="aprobacion-dato-completo">
                                    <dt>Motivo</dt>
                                    <dd>{solicitud.motivo}</dd>
                                </div>
                            )}
                        </dl>

                        {solicitud.items.length > 0 && (
                            <div className="vm-table-wrap aprobacion-tabla">
                                <table className="vm-table">
                                    <thead>
                                        <tr>
                                            <th>Detalle</th>
                                            <th className="vm-num">Cant.</th>
                                            <th className="vm-num">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {solicitud.items.map((item, indice) => (
                                            <tr key={indice}>
                                                <td>{item.descripcion}</td>
                                                <td className="vm-num">{Number(item.cantidad)}</td>
                                                <td className="vm-num">{moneda(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {solicitud.total != null && (
                            <div className="aprobacion-total">
                                <span>Total estimado</span>
                                <strong>{moneda(solicitud.total)}</strong>
                            </div>
                        )}

                        {pendiente ? (
                            <div className="aprobacion-acciones">
                                <button type="button" className="vm-btn vm-btn-danger" disabled={enviando} onClick={() => responder("Denegado")}>
                                    <span className="material-symbols-outlined">close</span>
                                    No autorizar
                                </button>
                                <button type="button" className="vm-btn vm-btn-accent" disabled={enviando} onClick={() => responder("Aprobado")}>
                                    <span className="material-symbols-outlined">check</span>
                                    {enviando ? "Enviando…" : "Autorizar servicio"}
                                </button>
                            </div>
                        ) : (
                            <div className={`vm-alert ${estado === "Aprobado" ? "vm-alert-success" : "vm-alert-warning"}`} role="status">
                                <span className="material-symbols-outlined">{estado === "Aprobado" ? "check_circle" : "info"}</span>
                                <span>
                                    {estado === "Aprobado"
                                        ? "Gracias. Autorizaste el servicio y el taller continuará con tu vehículo."
                                        : "Registramos que no autorizaste el servicio. El taller se pondrá en contacto contigo."}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default AprobacionCliente;
