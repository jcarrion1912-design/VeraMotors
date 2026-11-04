import { useState } from "react";

// Columnas de una sola serie con grilla, eje Y y tooltip por columna.
const ANCHO = 560;
const ALTO = 210;
const MARGEN = { sup: 18, inf: 26, izq: 46, der: 8 };
const GROSOR = 24;

const moneda = (v) => `S/ ${Number(v || 0).toLocaleString("es-PE", { maximumFractionDigits: 0 })}`;
const compacto = (v) => (v >= 10000 ? `${Math.round(v / 1000)}K` : Number(v).toLocaleString("es-PE"));

const escalaLimpia = (max) => {
    if (max <= 0) return { tope: 4, paso: 1 };
    const crudo = max / 4;
    const base = 10 ** Math.floor(Math.log10(crudo));
    const paso = [1, 2, 2.5, 5, 10].map((m) => m * base).find((p) => p >= crudo);
    return { tope: paso * Math.ceil(max / paso), paso };
};

function ColumnasMensuales({ datos }) {
    const [activa, setActiva] = useState(null);

    const max = Math.max(0, ...datos.map((d) => d.total));
    const { tope, paso } = escalaLimpia(max);
    const lienzoAlto = ALTO - MARGEN.sup - MARGEN.inf;
    const lienzoAncho = ANCHO - MARGEN.izq - MARGEN.der;
    const banda = lienzoAncho / Math.max(datos.length, 1);
    const y = (v) => MARGEN.sup + lienzoAlto - (v / tope) * lienzoAlto;
    const marcas = [];
    for (let v = 0; v <= tope + paso / 2; v += paso) marcas.push(v);

    const dato = activa !== null ? datos[activa] : null;

    return (
        <div className="columnas">
            <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Facturación de los últimos seis meses">
                {marcas.map((v) => (
                    <g key={v}>
                        <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={y(v)} y2={y(v)} className="columnas-grilla" />
                        <text x={MARGEN.izq - 8} y={y(v) + 4} textAnchor="end" className="columnas-eje">{compacto(v)}</text>
                    </g>
                ))}

                {datos.map((d, i) => {
                    const cx = MARGEN.izq + banda * i + banda / 2;
                    const yv = y(d.total);
                    const h = MARGEN.sup + lienzoAlto - yv;
                    const r = Math.min(4, h);
                    const x = cx - GROSOR / 2;
                    const base = MARGEN.sup + lienzoAlto;
                    const esUltima = i === datos.length - 1;

                    return (
                        <g
                            key={d.clave}
                            onMouseEnter={() => setActiva(i)}
                            onMouseLeave={() => setActiva(null)}
                        >
                            <rect x={cx - banda / 2} y={MARGEN.sup} width={banda} height={lienzoAlto} fill="transparent" />
                            {h > 0 && (
                                <path
                                    d={`M${x} ${base}V${yv + r}Q${x} ${yv} ${x + r} ${yv}H${x + GROSOR - r}Q${x + GROSOR} ${yv} ${x + GROSOR} ${yv + r}V${base}Z`}
                                    className={`columnas-barra ${esUltima ? "is-actual" : ""} ${activa === i ? "is-hover" : ""}`}
                                />
                            )}
                            {esUltima && d.total > 0 && (
                                <text x={cx} y={yv - 6} textAnchor="middle" className="columnas-valor">{compacto(d.total)}</text>
                            )}
                            <text x={cx} y={ALTO - 8} textAnchor="middle" className="columnas-eje">{d.etiqueta}</text>
                        </g>
                    );
                })}
            </svg>

            {dato && (
                <div
                    className="columnas-tooltip"
                    style={{ left: `${((MARGEN.izq + banda * activa + banda / 2) / ANCHO) * 100}%` }}
                >
                    <strong>{dato.etiquetaLarga}</strong>
                    <span>{moneda(dato.total)}</span>
                    <span>{dato.cantidad} {dato.cantidad === 1 ? "factura" : "facturas"}</span>
                </div>
            )}

            <table className="vm-sr-only">
                <caption>Facturación mensual</caption>
                <thead><tr><th>Mes</th><th>Total</th><th>Facturas</th></tr></thead>
                <tbody>
                    {datos.map((d) => (
                        <tr key={d.clave}><td>{d.etiquetaLarga}</td><td>{moneda(d.total)}</td><td>{d.cantidad}</td></tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ColumnasMensuales;
