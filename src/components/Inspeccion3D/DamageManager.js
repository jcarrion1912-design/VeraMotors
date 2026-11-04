import * as THREE from "three";

// =========================================================
// CONFIGURACIÓN DE SEVERIDAD DE DAÑOS
// =========================================================
export const SEVERIDAD_DANOS = {
    leve: {
        id: "leve",
        label: "Leve",
        subtitulo: "Rayones, raspaduras o microrayones",
        colorHex: 0xeab308,
        colorCSS: "#eab308",
        emoji: "🟡",
        icono: "info"
    },
    medio: {
        id: "medio",
        label: "Medio",
        subtitulo: "Abolladuras, golpes o fisuras",
        colorHex: 0xf97316,
        colorCSS: "#f97316",
        emoji: "🟠",
        icono: "warning"
    },
    grave: {
        id: "grave",
        label: "Grave",
        subtitulo: "Rotura, descuadre o perforación",
        colorHex: 0xef4444,
        colorCSS: "#ef4444",
        emoji: "🔴",
        icono: "error"
    }
};

// =========================================================
// TIPOS DE DAÑO
// =========================================================
export const TIPOS_DANO = [
    { id: "rayon", label: "Rayón / Raspadura", icono: "edit" },
    { id: "abolladura", label: "Abolladura / Golpe", icono: "lens_blur" },
    { id: "rotura", label: "Rotura / Quebradura", icono: "broken_image" },
    { id: "pintura", label: "Pintura Levantada / Salpicada", icono: "format_paint" },
    { id: "descuadre", label: "Descuadre / Deformación", icono: "compare_arrows" },
    { id: "desgaste", label: "Desgaste / Corrosión", icono: "warning" }
];

// =========================================================
// OBTENER COLOR DE PIN
// =========================================================
export function obtenerColorSeveridad(severidad = "leve") {
    const s = SEVERIDAD_DANOS[severidad?.toLowerCase()] || SEVERIDAD_DANOS.leve;
    return s.colorHex;
}

// =========================================================
// CREAR OBJETO 3D DE PIN / MARCADOR
// =========================================================
export function crearPinDanio(dano, indice) {
    const severidad = dano?.severidad || "leve";
    const color = obtenerColorSeveridad(severidad);

    const pinGrupo = new THREE.Group();
    pinGrupo.name = `pin_danio_${indice}`;

    // Esfera exterior brillante
    const geoEsfera = new THREE.SphereGeometry(0.2, 16, 16);
    const matEsfera = new THREE.MeshBasicMaterial({
        color: color,
        depthTest: false,
        transparent: true,
        opacity: 0.95
    });
    const esfera = new THREE.Mesh(geoEsfera, matEsfera);
    esfera.renderOrder = 25;
    esfera.name = `marcador_${indice}`;

    // Núcleo blanco
    const geoCentro = new THREE.SphereGeometry(0.08, 12, 12);
    const matCentro = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        depthTest: false
    });
    const centro = new THREE.Mesh(geoCentro, matCentro);
    centro.renderOrder = 26;
    esfera.add(centro);

    // Vástago o palo del pin
    const geoPalo = new THREE.CylinderGeometry(0.03, 0.015, 0.35, 8);
    const matPalo = new THREE.MeshBasicMaterial({
        color: color,
        depthTest: false
    });
    const palo = new THREE.Mesh(geoPalo, matPalo);
    palo.renderOrder = 24;
    palo.name = `palo_${indice}`;

    // Posición del pin y vástago
    const pos = dano.posicion_3d || { x: 0, y: 0, z: 0 };
    esfera.position.set(pos.x, pos.y + 0.28, pos.z);
    palo.position.set(pos.x, pos.y + 0.12, pos.z);

    pinGrupo.add(esfera);
    pinGrupo.add(palo);

    // Guardar metadata en el objeto para interacción
    pinGrupo.userData = {
        dano,
        indice
    };

    return pinGrupo;
}

// =========================================================
// FORMATEAR NOMBRE DE PIEZA
// =========================================================
export function formatearNombrePieza(pieza = "") {
    if (!pieza) return "Zona no identificada";
    return pieza
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
}
