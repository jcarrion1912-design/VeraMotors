import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// =========================================================
// CONFIGURACIÓN DE CARGA DRACO + GLTF LOADER
// =========================================================
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Cache en memoria para cambio de modelo instantáneo (0 ms)
const cacheModelos = new Map();

// =========================================================
// PALETA DE COLORES DE CARROCERÍA (SHOWROOM CARSHOW360)
// =========================================================
export const COLORES_CARROCERIA = [
    { id: "azul", label: "Azul Eléctrico", hex: 0x2563eb, preview: "#2563eb" },
    { id: "rojo", label: "Rojo Pasión", hex: 0xdc2626, preview: "#dc2626" },
    { id: "plata", label: "Plata Titanio", hex: 0x94a3b8, preview: "#94a3b8" },
    { id: "grafito", label: "Gris Grafito", hex: 0x334155, preview: "#334155" },
    { id: "negro", label: "Negro Obsidiana", hex: 0x0f172a, preview: "#0f172a" },
    { id: "blanco", label: "Blanco Glaciar", hex: 0xf8fafc, preview: "#f8fafc" },
    { id: "dorado", label: "Ámbar Dorado", hex: 0xd97706, preview: "#d97706" }
];

// =========================================================
// DEFINICIÓN DE TIPOS DE VEHÍCULO Y RUTAS GLB
// =========================================================
export const TIPOS_VEHICULO = [
    {
        id: "sedan",
        label: "Sedán",
        subtitulo: "Turismo 4 Puertas",
        icono: "directions_car",
        emoji: "🚗",
        badge: "Sedan",
        modeloUrl: "/sedan.glb",
        desiredLength: 6.8
    },
    {
        id: "suv",
        label: "SUV / Camioneta",
        subtitulo: "Crossover & 4x4",
        icono: "airport_shuttle",
        emoji: "🚙",
        badge: "SUV",
        modeloUrl: "/suv.glb",
        desiredLength: 7.2
    },
    {
        id: "pickup",
        label: "Pick-up",
        subtitulo: "Doble Cabina & Tolva",
        icono: "rv_hookup",
        emoji: "🛻",
        badge: "Pick-up",
        modeloUrl: "/pickup.glb",
        desiredLength: 7.5
    },
    {
        id: "hatchback",
        label: "Hatchback",
        subtitulo: "Compacto Deportivo",
        icono: "electric_car",
        emoji: "🏎️",
        badge: "Hatchback",
        modeloUrl: "/hatchback.glb",
        desiredLength: 6.2
    },
    {
        id: "van",
        label: "Van / Utilitario",
        subtitulo: "Combi & Furgoneta",
        icono: "local_shipping",
        emoji: "🚐",
        badge: "Van",
        modeloUrl: "/van.glb",
        desiredLength: 7.4
    }
];

// =========================================================
// NORMALIZADOR DE TIPO DE VEHÍCULO
// =========================================================
export function normalizarTipoVehiculo(tipo) {
    if (!tipo || typeof tipo !== "string") return "sedan";
    const t = tipo.trim().toLowerCase();

    if (t.includes("suv") || t.includes("crossover") || t.includes("camioneta suv")) {
        return "suv";
    }
    if (t.includes("pick") || t.includes("tolva") || t.includes("batea")) {
        return "pickup";
    }
    if (t.includes("hatch") || t.includes("compact")) {
        return "hatchback";
    }
    if (t.includes("van") || t.includes("furgon") || t.includes("combi") || t.includes("minivan")) {
        return "van";
    }
    return "sedan";
}

// =========================================================
// HELPER: HITBOXES INVISIBLES DE INSPECCIÓN DE DAÑOS
// =========================================================
// Permite que al hacer clic en cualquier parte del modelo 3D realista,
// el sistema detecte con exactitud la pieza (capot, techo, puerta, etc.)
function agregarZonasInspeccion(contenedor, largo = 7.0, ancho = 3.6, alto = 2.0) {
    const grupoZonas = new THREE.Group();
    grupoZonas.name = "zonas_inspeccion";

    // Material de colisión invisible (transparente)
    const matZona = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
    });

    const crearZona = (nombre, geo, x, y, z) => {
        const mesh = new THREE.Mesh(geo, matZona);
        mesh.name = nombre;
        mesh.position.set(x, y, z);
        grupoZonas.add(mesh);
    };

    const halfL = largo / 2;
    const halfW = ancho / 2;
    const yMid = alto * 0.55;
    const yRoof = alto * 0.95;

    // 1. Capó
    crearZona("capot", new THREE.BoxGeometry(ancho * 0.85, alto * 0.25, largo * 0.3), 0, yMid + 0.1, -halfL * 0.5);

    // 2. Parachoques delantero
    crearZona("parachoques_delantero", new THREE.BoxGeometry(ancho * 0.95, alto * 0.45, largo * 0.12), 0, alto * 0.3, -halfL * 0.95);

    // 3. Parabrisas
    crearZona("parabrisas", new THREE.BoxGeometry(ancho * 0.8, alto * 0.35, largo * 0.15), 0, yRoof - 0.2, -halfL * 0.25);

    // 4. Techo
    crearZona("techo", new THREE.BoxGeometry(ancho * 0.78, alto * 0.15, largo * 0.4), 0, yRoof, 0);

    // 5. Luneta trasera
    crearZona("luneta", new THREE.BoxGeometry(ancho * 0.8, alto * 0.35, largo * 0.15), 0, yRoof - 0.2, halfL * 0.3);

    // 6. Maletera / Tolva
    crearZona("maletera", new THREE.BoxGeometry(ancho * 0.85, alto * 0.3, largo * 0.25), 0, yMid, halfL * 0.65);

    // 7. Parachoques trasero
    crearZona("parachoques_trasero", new THREE.BoxGeometry(ancho * 0.95, alto * 0.45, largo * 0.12), 0, alto * 0.3, halfL * 0.95);

    // 8. Puertas izquierdas
    crearZona("puerta_delantera_izq", new THREE.BoxGeometry(0.3, alto * 0.7, largo * 0.25), -halfW * 0.95, yMid, -halfL * 0.12);
    crearZona("puerta_trasera_izq", new THREE.BoxGeometry(0.3, alto * 0.7, largo * 0.25), -halfW * 0.95, yMid, halfL * 0.18);

    // 9. Puertas derechas
    crearZona("puerta_delantera_der", new THREE.BoxGeometry(0.3, alto * 0.7, largo * 0.25), halfW * 0.95, yMid, -halfL * 0.12);
    crearZona("puerta_trasera_der", new THREE.BoxGeometry(0.3, alto * 0.7, largo * 0.25), halfW * 0.95, yMid, halfL * 0.18);

    // 10. Guardabarros
    crearZona("guardabarros_delantero_izq", new THREE.BoxGeometry(0.35, alto * 0.5, largo * 0.2), -halfW * 0.95, alto * 0.4, -halfL * 0.65);
    crearZona("guardabarros_delantero_der", new THREE.BoxGeometry(0.35, alto * 0.5, largo * 0.2), halfW * 0.95, alto * 0.4, -halfL * 0.65);
    crearZona("guardabarros_trasero_izq", new THREE.BoxGeometry(0.35, alto * 0.5, largo * 0.2), -halfW * 0.95, alto * 0.4, halfL * 0.65);
    crearZona("guardabarros_trasero_der", new THREE.BoxGeometry(0.35, alto * 0.5, largo * 0.2), halfW * 0.95, alto * 0.4, halfL * 0.65);

    contenedor.add(grupoZonas);
}

// =========================================================
// APLICAR COLOR DE PINTURA AL MODELO REALISTA
// =========================================================
export function aplicarColorCarroceria(modelo, colorHex) {
    if (!modelo) return;

    let targetColor = colorHex;
    if (typeof colorHex === "string") {
        targetColor = new THREE.Color(colorHex);
    } else if (typeof colorHex === "number") {
        targetColor = new THREE.Color(colorHex);
    }

    modelo.traverse((child) => {
        if (!child.isMesh || !child.material) return;

        const mats = Array.isArray(child.material) ? child.material : [child.material];

        mats.forEach((mat) => {
            const matName = (mat.name || "").toLowerCase();
            const meshName = (child.name || "").toLowerCase();

            // Detectar materiales de pintura de carrocería (body, car, paint, exterior, etc.)
            const esPintura =
                matName.includes("paint") ||
                matName.includes("body") ||
                matName.includes("carroceria") ||
                matName.includes("car") ||
                matName.includes("exterior") ||
                matName.includes("color") ||
                meshName.includes("body") ||
                meshName.includes("carroceria") ||
                meshName.includes("hood") ||
                meshName.includes("door");

            // Evitar teñir vidrios, neumáticos o luces
            const esVidrioOLLanta =
                matName.includes("glass") ||
                matName.includes("window") ||
                matName.includes("vidrio") ||
                matName.includes("tire") ||
                matName.includes("wheel") ||
                matName.includes("rubber") ||
                matName.includes("llanta") ||
                matName.includes("light") ||
                matName.includes("lamp") ||
                matName.includes("faro") ||
                matName.includes("interior");

            if (esPintura && !esVidrioOLLanta) {
                mat.color.copy(targetColor);
                if ("metalness" in mat) mat.metalness = Math.max(mat.metalness, 0.6);
                if ("roughness" in mat) mat.roughness = Math.min(mat.roughness, 0.25);
                if ("clearcoat" in mat) mat.clearcoat = 1.0;
                mat.needsUpdate = true;
            }
        });
    });
}

// =========================================================
// CARGAR MODELO REALISTA ASYNC (GLB) CON NORMALIZACIÓN
// =========================================================
export async function cargarVehiculoRealista(tipo = "sedan", color = 0x2563eb) {
    const tipoNorm = normalizarTipoVehiculo(tipo);
    const config = TIPOS_VEHICULO.find((t) => t.id === tipoNorm) || TIPOS_VEHICULO[0];

    // Contenedor principal que se inserta en la escena
    const contenedor = new THREE.Group();
    contenedor.userData = { tipo: tipoNorm };

    try {
        let gltfEscena = null;

        // Verificar si ya está en caché
        if (cacheModelos.has(config.id)) {
            gltfEscena = cacheModelos.get(config.id).clone(true);
        } else {
            const gltf = await gltfLoader.loadAsync(config.modeloUrl);
            cacheModelos.set(config.id, gltf.scene);
            gltfEscena = gltf.scene.clone(true);
        }

        // Normalizar escala y centrado con BoundingBox
        const bbox = new THREE.Box3().setFromObject(gltfEscena);
        const tamano = bbox.getSize(new THREE.Vector3());
        const centro = bbox.getCenter(new THREE.Vector3());

        // Escalar uniformemente según la longitud deseada
        const longitudActual = Math.max(tamano.x, tamano.z);
        const factorEscala = (config.desiredLength || 6.8) / (longitudActual || 1);
        gltfEscena.scale.set(factorEscala, factorEscala, factorEscala);

        // Re-calcular caja con nueva escala para alineación al piso
        bbox.setFromObject(gltfEscena);
        const centroEscalado = bbox.getCenter(new THREE.Vector3());
        const minEscalado = bbox.min;

        // Centrar en X, Z y posar ruedas sobre el suelo (y = 0)
        gltfEscena.position.x = -centroEscalado.x;
        gltfEscena.position.z = -centroEscalado.z;
        gltfEscena.position.y = -minEscalado.y;

        // Configurar sombras y reflejos PBR en cada malla
        gltfEscena.traverse((hijo) => {
            if (hijo.isMesh) {
                hijo.castShadow = true;
                hijo.receiveShadow = true;

                if (hijo.material) {
                    const mats = Array.isArray(hijo.material) ? hijo.material : [hijo.material];
                    mats.forEach((m) => {
                        m.envMapIntensity = 1.4;
                        m.needsUpdate = true;
                    });
                }
            }
        });

        // Aplicar color de carrocería seleccionado
        aplicarColorCarroceria(gltfEscena, color);

        contenedor.add(gltfEscena);

        // Agregar hitboxes invisibles para mapeo de daños perfecto
        const tamFinal = bbox.getSize(new THREE.Vector3());
        agregarZonasInspeccion(contenedor, tamFinal.z, tamFinal.x, tamFinal.y);

        return contenedor;
    } catch (err) {
        console.warn(`Error al cargar modelo GLB para ${tipoNorm}, usando fallback procedural:`, err);
        return crearVehiculoProcedural(tipoNorm, color);
    }
}

// =========================================================
// FALLBACK PROCEDURAL CURVADO Y AERODINÁMICO (NO MINECRAFT)
// =========================================================
export function crearVehiculoProcedural(tipo = "sedan", colorHex = 0x2563eb) {
    const auto = new THREE.Group();
    auto.userData = { tipo };

    let colorFinal = colorHex;
    if (typeof colorHex === "string") {
        colorFinal = new THREE.Color(colorHex).getHex();
    }

    // Materiales automotrices con brillo de laca transparente (clearcoat)
    const matCarroceria = new THREE.MeshPhysicalMaterial({
        color: colorFinal,
        metalness: 0.75,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08
    });

    const matVidrio = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.05,
        transmission: 0.8,
        transparent: true,
        opacity: 0.82
    });

    const matNeumatico = new THREE.MeshStandardMaterial({
        color: 0x141414,
        roughness: 0.85
    });

    const matRin = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.92,
        roughness: 0.15
    });

    const matFreno = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        metalness: 0.8,
        roughness: 0.2
    });

    const matLucesDelanteras = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 1.2
    });

    const matLucesTraseras = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0xef4444,
        emissiveIntensity: 0.9
    });

    // =========================================================
    // CREAR RUEDA DETALLADA CON DISCO DE FRENO Y PINZA BREMBO
    // =========================================================
    const ensamblarRuedaAvanzada = (x, y, z, radio = 0.68, ancho = 0.44) => {
        const rueda = new THREE.Group();
        rueda.name = "rueda";

        // Neumático curvado
        const llanta = new THREE.Mesh(
            new THREE.CylinderGeometry(radio, radio, ancho, 32),
            matNeumatico
        );
        llanta.rotation.z = Math.PI / 2;
        llanta.castShadow = true;
        rueda.add(llanta);

        // Rin de aleación deportivo
        const rin = new THREE.Mesh(
            new THREE.CylinderGeometry(radio * 0.72, radio * 0.72, ancho + 0.02, 24),
            matRin
        );
        rin.rotation.z = Math.PI / 2;
        rin.castShadow = true;
        rueda.add(rin);

        // 5 Radios dobles en estrella
        for (let i = 0; i < 5; i++) {
            const angulo = (i * Math.PI * 2) / 5;
            const radioMesh = new THREE.Mesh(
                new THREE.BoxGeometry(ancho + 0.03, radio * 0.65, 0.07),
                matRin
            );
            radioMesh.rotation.x = angulo;
            rueda.add(radioMesh);
        }

        // Disco de freno perforado dentro del rin
        const discoFreno = new THREE.Mesh(
            new THREE.CylinderGeometry(radio * 0.52, radio * 0.52, 0.04, 20),
            matRin
        );
        discoFreno.rotation.z = Math.PI / 2;
        discoFreno.position.x = x > 0 ? -0.06 : 0.06;
        rueda.add(discoFreno);

        // Caliper / Pinza de freno roja deportiva
        const pinzaFreno = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.28, 0.2),
            matFreno
        );
        pinzaFreno.position.set(x > 0 ? -0.06 : 0.06, radio * 0.32, 0);
        rueda.add(pinzaFreno);

        rueda.position.set(x, y, z);
        auto.add(rueda);
    };

    // =========================================================
    // SILUETA AERODINÁMICA CURVADA (EXTRUDE CON BEVELS SUAVES)
    // =========================================================
    const shape = new THREE.Shape();
    // Perfil lateral estilizado del vehículo con curvas suaves
    shape.moveTo(-3.4, 0.4);
    shape.quadraticCurveTo(-3.5, 0.8, -3.2, 1.0); // Morro / Splitter
    shape.quadraticCurveTo(-2.4, 1.4, -1.5, 1.45); // Capó arqueado
    shape.quadraticCurveTo(-0.7, 2.1, 0.0, 2.15); // Parabrisas aerodinámico
    shape.quadraticCurveTo(1.2, 2.15, 1.8, 1.95); // Techo fluido
    shape.quadraticCurveTo(2.4, 1.5, 3.1, 1.35); // Luneta fastback
    shape.quadraticCurveTo(3.4, 1.3, 3.4, 0.9); // Cola / Alerón
    shape.quadraticCurveTo(3.3, 0.4, 2.8, 0.35); // Difusor trasero
    shape.lineTo(-3.4, 0.35); // Piso

    const extrudeSettings = {
        steps: 2,
        depth: 3.4,
        bevelEnabled: true,
        bevelThickness: 0.18,
        bevelSize: 0.16,
        bevelOffset: 0,
        bevelSegments: 6
    };

    const geoCarroceria = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geoCarroceria.computeVertexNormals();
    geoCarroceria.center();

    const cuerpoCarroceria = new THREE.Mesh(geoCarroceria, matCarroceria);
    cuerpoCarroceria.rotation.y = Math.PI / 2;
    cuerpoCarroceria.position.y = 1.2;
    cuerpoCarroceria.name = "carroceria";
    cuerpoCarroceria.castShadow = true;
    cuerpoCarroceria.receiveShadow = true;
    auto.add(cuerpoCarroceria);

    // Cabina acristalada curva panorámica
    const geoCabina = new THREE.BoxGeometry(2.8, 0.85, 2.8);
    const cabina = new THREE.Mesh(geoCabina, matVidrio);
    cabina.position.set(0, 1.82, 0.2);
    cabina.name = "techo";
    auto.add(cabina);

    // Faros LED rasgados frontales
    const faroIzq = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.12), matLucesDelanteras);
    faroIzq.position.set(-1.3, 1.15, -3.3);
    faroIzq.name = "parachoques_delantero";
    auto.add(faroIzq);

    const faroDer = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.12), matLucesDelanteras);
    faroDer.position.set(1.3, 1.15, -3.3);
    faroDer.name = "parachoques_delantero";
    auto.add(faroDer);

    // Barra de luz LED trasera continua
    const luzTraseraBar = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.14, 0.1), matLucesTraseras);
    luzTraseraBar.position.set(0, 1.25, 3.32);
    luzTraseraBar.name = "parachoques_trasero";
    auto.add(luzTraseraBar);

    // Salidas de escape dobles cromadas
    const matEscape = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 });
    const escapeIzq = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16), matEscape);
    escapeIzq.rotation.x = Math.PI / 2;
    escapeIzq.position.set(-1.1, 0.65, 3.42);
    auto.add(escapeIzq);

    const escapeDer = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16), matEscape);
    escapeDer.rotation.x = Math.PI / 2;
    escapeDer.position.set(1.1, 0.65, 3.42);
    auto.add(escapeDer);

    // Ruedas deportivas con discos y calipers
    ensamblarRuedaAvanzada(-1.85, 0.68, -2.15);
    ensamblarRuedaAvanzada(1.85, 0.68, -2.15);
    ensamblarRuedaAvanzada(-1.85, 0.68, 2.15);
    ensamblarRuedaAvanzada(1.85, 0.68, 2.15);

    // Agregar hitboxes de inspección
    agregarZonasInspeccion(auto, 6.8, 3.6, 2.2);

    return auto;
}

// Mantener compatibilidad con exports síncronos anteriores
export function crearVehiculo(tipo = "sedan", color = 0x2563eb) {
    return crearVehiculoProcedural(tipo, color);
}
export function crearSedan(color = 0x2563eb) {
    return crearVehiculoProcedural("sedan", color);
}
export function crearSUV(color = 0xdc2626) {
    return crearVehiculoProcedural("suv", color);
}
export function crearPickup(color = 0x334155) {
    return crearVehiculoProcedural("pickup", color);
}
export function crearHatchback(color = 0xd97706) {
    return crearVehiculoProcedural("hatchback", color);
}
export function crearVan(color = 0xf8fafc) {
    return crearVehiculoProcedural("van", color);
}