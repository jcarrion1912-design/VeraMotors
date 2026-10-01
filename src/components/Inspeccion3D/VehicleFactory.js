import * as THREE from "three";

export function crearSedan() {
    const auto = new THREE.Group();

    // =========================
    // MATERIALES
    // =========================

    const materialCarroceria = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        metalness: 0.35,
        roughness: 0.3
    });

    const materialVidrio = new THREE.MeshStandardMaterial({
        color: 0x263238,
        metalness: 0.2,
        roughness: 0.15,
        transparent: true,
        opacity: 0.8
    });

    const materialNeumatico = new THREE.MeshStandardMaterial({
        color: 0x151515,
        roughness: 0.8
    });

    // =========================
    // CUERPO PRINCIPAL
    // =========================

    const cuerpo = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.8, 7),
        materialCarroceria
    );

    cuerpo.position.y = 1;
    cuerpo.name = "carroceria";

    auto.add(cuerpo);

    // =========================
    // PARTE SUPERIOR / CABINA
    // =========================

    const cabina = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.9, 3.3),
        materialCarroceria
    );

    cabina.position.set(0, 1.75, 0.3);
    cabina.name = "techo";

    auto.add(cabina);

    // =========================
    // PARABRISAS
    // =========================

    const parabrisas = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.65, 0.08),
        materialVidrio
    );

    parabrisas.position.set(
        0,
        1.75,
        -1.35
    );

    parabrisas.rotation.x = THREE.MathUtils.degToRad(-15);
    parabrisas.name = "parabrisas";

    auto.add(parabrisas);

    // =========================
    // LUNETA
    // =========================

    const luneta = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.65, 0.08),
        materialVidrio
    );

    luneta.position.set(
        0,
        1.75,
        1.95
    );

    luneta.rotation.x = THREE.MathUtils.degToRad(15);
    luneta.name = "luneta";

    auto.add(luneta);

    // =========================
    // CAPÓ
    // =========================

    const capot = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.18, 1.8),
        materialCarroceria
    );

    capot.position.set(0, 1.43, -2.45);
    capot.name = "capot";

    auto.add(capot);

    // =========================
    // MALETERA
    // =========================

    const maletera = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.18, 1.3),
        materialCarroceria
    );

    maletera.position.set(0, 1.43, 2.55);
    maletera.name = "maletera";

    auto.add(maletera);

    // =========================
    // PARACHOQUES
    // =========================

    const parachoquesDelantero = new THREE.Mesh(
        new THREE.BoxGeometry(3.7, 0.45, 0.35),
        materialCarroceria
    );

    parachoquesDelantero.position.set(0, 0.8, -3.5);
    parachoquesDelantero.name = "parachoques_delantero";

    auto.add(parachoquesDelantero);

    const parachoquesTrasero = new THREE.Mesh(
        new THREE.BoxGeometry(3.7, 0.45, 0.35),
        materialCarroceria
    );

    parachoquesTrasero.position.set(0, 0.8, 3.5);
    parachoquesTrasero.name = "parachoques_trasero";

    auto.add(parachoquesTrasero);

    // =========================
    // PUERTAS
    // =========================

    crearPuerta(
        auto,
        materialCarroceria,
        "puerta_delantera_izq",
        -1.94,
        0.8
    );

    crearPuerta(
        auto,
        materialCarroceria,
        "puerta_trasera_izq",
        -1.94,
        1.9
    );

    crearPuerta(
        auto,
        materialCarroceria,
        "puerta_delantera_der",
        1.94,
        0.8
    );

    crearPuerta(
        auto,
        materialCarroceria,
        "puerta_trasera_der",
        1.94,
        1.9
    );

    // =========================
    // RUEDAS
    // =========================

    crearRueda(auto, materialNeumatico, -2, -2.2);
    crearRueda(auto, materialNeumatico, 2, -2.2);
    crearRueda(auto, materialNeumatico, -2, 2.2);
    crearRueda(auto, materialNeumatico, 2, 2.2);

    return auto;
}

function crearPuerta(
    auto,
    material,
    nombre,
    x,
    z
) {
    const puerta = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1.2, 1),
        material
    );

    puerta.position.set(
        x,
        1.05,
        z
    );

    puerta.name = nombre;

    auto.add(puerta);
}

function crearRueda(
    auto,
    material,
    x,
    z
) {
    const rueda = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.65,
            0.65,
            0.45,
            32
        ),
        material
    );

    rueda.rotation.z = Math.PI / 2;

    rueda.position.set(
        x,
        0.65,
        z
    );

    rueda.name = "rueda";

    auto.add(rueda);
}