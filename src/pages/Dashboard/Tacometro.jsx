// Indicador de aguja: lectura única de un porcentaje (0–100).
const INICIO = 135;
const BARRIDO = 270;
const CENTRO = 100;
const RADIO = 78;

const polar = (grados, radio = RADIO) => {
    const rad = (grados * Math.PI) / 180;
    return [CENTRO + radio * Math.cos(rad), CENTRO + radio * Math.sin(rad)];
};

const arco = (desde, hasta) => {
    const [x1, y1] = polar(desde);
    const [x2, y2] = polar(hasta);
    const grande = hasta - desde > 180 ? 1 : 0;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${RADIO} ${RADIO} 0 ${grande} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

function Tacometro({ valor, etiqueta }) {
    const pct = Math.max(0, Math.min(100, Number(valor) || 0));
    const fin = INICIO + (BARRIDO * pct) / 100;
    const [px, py] = polar(fin, 58);

    return (
        <div className="tacometro" role="img" aria-label={`${etiqueta}: ${pct.toFixed(0)}%`}>
            <svg viewBox="0 0 200 208" aria-hidden="true">
                <path d={arco(INICIO, INICIO + BARRIDO)} className="tacometro-pista" />
                {pct > 0 && <path d={arco(INICIO, fin)} className="tacometro-valor" />}

                {Array.from({ length: 11 }, (_, i) => {
                    const g = INICIO + (BARRIDO * i) / 10;
                    const [x1, y1] = polar(g, 66);
                    const [x2, y2] = polar(g, i % 5 === 0 ? 58 : 62);
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="tacometro-marca" />;
                })}

                <line x1={CENTRO} y1={CENTRO} x2={px} y2={py} className="tacometro-aguja" />
                <circle cx={CENTRO} cy={CENTRO} r="6" className="tacometro-eje" />
            </svg>

            <div className="tacometro-lectura">
                <strong>{pct.toFixed(0)}<small>%</small></strong>
                <span>{etiqueta}</span>
            </div>
        </div>
    );
}

export default Tacometro;
