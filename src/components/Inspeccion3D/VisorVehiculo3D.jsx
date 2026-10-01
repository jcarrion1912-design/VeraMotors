import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { crearSedan } from "./VehicleFactory";
import "./VisorVehiculo3D.css";

function VisorVehiculo3D({
    tipoVehiculo = "Automóvil",
    danios = [],
    setDanios
}) {

    // =========================================================
    // REFERENCIAS
    // =========================================================

    const contenedorRef = useRef(null);

    const grupoPinesRef = useRef(null);

    // Mantener siempre los daños actuales
    // disponibles para los eventos.
    const daniosRef = useRef(danios);

    useEffect(() => {
        daniosRef.current = danios;
    }, [danios]);


    // =========================================================
    // ESTADOS
    // =========================================================

    const [piezaSeleccionada, setPiezaSeleccionada] =
        useState(null);

    const [puntoSeleccionado, setPuntoSeleccionado] =
        useState(null);

    const [mostrarModal, setMostrarModal] =
        useState(false);

    const [tipoDanio, setTipoDanio] =
        useState("rayon");

    const [severidad, setSeveridad] =
        useState("leve");

    const [observacion, setObservacion] =
        useState("");


    // =========================================================
    // ESCENA 3D
    // =========================================================

    useEffect(() => {

        if (!contenedorRef.current) {
            return;
        }

        const contenedor =
            contenedorRef.current;


        // =====================================================
        // ESCENA
        // =====================================================

        const escena =
            new THREE.Scene();

        escena.background =
            new THREE.Color(0x111827);


        // =====================================================
        // CAMARA
        // =====================================================

        const anchoInicial =
            contenedor.clientWidth || 800;

        const altoInicial =
            contenedor.clientHeight || 600;

        const camara =
            new THREE.PerspectiveCamera(
                45,
                anchoInicial / altoInicial,
                0.1,
                1000
            );

        camara.position.set(
            9,
            6,
            10
        );


        // =====================================================
        // RENDERER
        // =====================================================

        const renderer =
            new THREE.WebGLRenderer({
                antialias: true
            });

        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );

        renderer.setSize(
            anchoInicial,
            altoInicial
        );

        renderer.shadowMap.enabled =
            true;

        renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        renderer.domElement.style.display =
            "block";

        renderer.domElement.style.width =
            "100%";

        renderer.domElement.style.height =
            "100%";

        renderer.domElement.style.touchAction =
            "none";

        contenedor.appendChild(
            renderer.domElement
        );


        // =====================================================
        // ORBIT CONTROLS
        // =====================================================

        const controles =
            new OrbitControls(
                camara,
                renderer.domElement
            );

        controles.enableRotate =
            true;

        controles.enableZoom =
            true;

        controles.enablePan =
            false;

        controles.enableDamping =
            true;

        controles.dampingFactor =
            0.08;

        controles.rotateSpeed =
            0.8;

        controles.zoomSpeed =
            0.8;

        controles.minDistance =
            5;

        controles.maxDistance =
            25;

        controles.target.set(
            0,
            1,
            0
        );

        controles.update();


        // =====================================================
        // LUCES
        // =====================================================

        const luzAmbiente =
            new THREE.HemisphereLight(
                0xffffff,
                0x374151,
                2.2
            );

        escena.add(
            luzAmbiente
        );


        const luzPrincipal =
            new THREE.DirectionalLight(
                0xffffff,
                3
            );

        luzPrincipal.position.set(
            6,
            10,
            8
        );

        luzPrincipal.castShadow =
            true;

        escena.add(
            luzPrincipal
        );


        const luzFrontal =
            new THREE.DirectionalLight(
                0xffffff,
                1.5
            );

        luzFrontal.position.set(
            -6,
            5,
            -8
        );

        escena.add(
            luzFrontal
        );


        // =====================================================
        // PISO
        // =====================================================

        const piso =
            new THREE.Mesh(
                new THREE.PlaneGeometry(
                    40,
                    40
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x1f2937,
                    roughness: 0.8
                })
            );

        piso.rotation.x =
            -Math.PI / 2;

        piso.position.y =
            0;

        piso.receiveShadow =
            true;

        escena.add(
            piso
        );


        // =====================================================
        // GRID
        // =====================================================

        const grid =
            new THREE.GridHelper(
                40,
                40,
                0x4b5563,
                0x374151
            );

        grid.position.y =
            0.01;

        escena.add(
            grid
        );


        // =====================================================
        // VEHICULO
        // =====================================================

        const vehiculo =
            crearSedan();

        escena.add(
            vehiculo
        );


        // =====================================================
        // SOMBRAS DEL VEHICULO
        // =====================================================

        vehiculo.traverse(
            (objeto) => {

                if (objeto.isMesh) {

                    objeto.castShadow =
                        true;

                    objeto.receiveShadow =
                        true;
                }
            }
        );


        // =====================================================
        // GRUPO DE PINES
        // =====================================================

        const grupoPines =
            new THREE.Group();

        grupoPines.name =
            "pines_danos";

        escena.add(
            grupoPines
        );

        grupoPinesRef.current =
            grupoPines;


        // =====================================================
        // RAYCASTER
        // =====================================================

        const raycaster =
            new THREE.Raycaster();

        const mouse =
            new THREE.Vector2();


        // =====================================================
        // CONTROL CLICK / ARRASTRE
        // =====================================================

        let inicioX = 0;
        let inicioY = 0;

        let arrastrando = false;


        // =====================================================
        // POINTER DOWN
        // =====================================================

        const manejarPointerDown =
            (event) => {

                inicioX =
                    event.clientX;

                inicioY =
                    event.clientY;

                arrastrando =
                    false;
            };


        // =====================================================
        // POINTER MOVE
        // =====================================================

        const manejarPointerMove =
            (event) => {

                const diferenciaX =
                    Math.abs(
                        event.clientX -
                        inicioX
                    );

                const diferenciaY =
                    Math.abs(
                        event.clientY -
                        inicioY
                    );

                if (
                    diferenciaX > 5 ||
                    diferenciaY > 5
                ) {

                    arrastrando =
                        true;
                }
            };


        // =====================================================
        // POINTER UP
        // =====================================================

        const manejarPointerUp =
            (event) => {

                // Si estaba girando el vehículo,
                // no registrar selección.
                if (arrastrando) {
                    return;
                }


                // =============================================
                // POSICION DEL MOUSE
                // =============================================

                const rect =
                    renderer.domElement
                        .getBoundingClientRect();


                mouse.x =
                    (
                        (
                            event.clientX -
                            rect.left
                        ) /
                        rect.width
                    ) * 2 - 1;


                mouse.y =
                    -(
                        (
                            event.clientY -
                            rect.top
                        ) /
                        rect.height
                    ) * 2 + 1;


                // =============================================
                // RAYCAST
                // =============================================

                raycaster.setFromCamera(
                    mouse,
                    camara
                );


                const intersecciones =
                    raycaster.intersectObjects(
                        vehiculo.children,
                        true
                    );


                if (
                    intersecciones.length === 0
                ) {
                    return;
                }


                // =============================================
                // PIEZA IMPACTADA
                // =============================================

                const impacto =
                    intersecciones[0];

                const objeto =
                    impacto.object;

                const pieza =
                    objeto.name;


                if (!pieza) {
                    return;
                }


                // No registrar ruedas como
                // daños de carrocería.
                if (
                    pieza === "rueda"
                ) {
                    return;
                }


                console.log(
                    "Pieza seleccionada:",
                    pieza
                );

                console.log(
                    "Coordenadas 3D:",
                    impacto.point
                );


                // =============================================
                // GUARDAR PIEZA
                // =============================================

                setPiezaSeleccionada(
                    pieza
                );


                // =============================================
                // GUARDAR COORDENADA 3D
                // =============================================

                setPuntoSeleccionado({

                    x: impacto.point.x,

                    y: impacto.point.y,

                    z: impacto.point.z

                });


                // =============================================
                // ABRIR MODAL
                // =============================================

                setMostrarModal(
                    true
                );
            };


        // =====================================================
        // EVENTOS
        // =====================================================

        renderer.domElement.addEventListener(
            "pointerdown",
            manejarPointerDown
        );

        renderer.domElement.addEventListener(
            "pointermove",
            manejarPointerMove
        );

        renderer.domElement.addEventListener(
            "pointerup",
            manejarPointerUp
        );


        // =====================================================
        // RESIZE
        // =====================================================

        const manejarResize =
            () => {

                const ancho =
                    contenedor.clientWidth;

                const alto =
                    contenedor.clientHeight;


                if (
                    ancho === 0 ||
                    alto === 0
                ) {
                    return;
                }


                camara.aspect =
                    ancho / alto;

                camara.updateProjectionMatrix();


                renderer.setSize(
                    ancho,
                    alto
                );
            };


        window.addEventListener(
            "resize",
            manejarResize
        );


        // =====================================================
        // ANIMACION
        // =====================================================

        let animationFrame;


        const animar =
            () => {

                animationFrame =
                    requestAnimationFrame(
                        animar
                    );

                controles.update();

                renderer.render(
                    escena,
                    camara
                );
            };


        animar();


        // =====================================================
        // LIMPIEZA
        // =====================================================

        return () => {

            cancelAnimationFrame(
                animationFrame
            );


            window.removeEventListener(
                "resize",
                manejarResize
            );


            renderer.domElement.removeEventListener(
                "pointerdown",
                manejarPointerDown
            );

            renderer.domElement.removeEventListener(
                "pointermove",
                manejarPointerMove
            );

            renderer.domElement.removeEventListener(
                "pointerup",
                manejarPointerUp
            );


            controles.dispose();

            renderer.dispose();


            if (
                contenedor.contains(
                    renderer.domElement
                )
            ) {

                contenedor.removeChild(
                    renderer.domElement
                );
            }


            grupoPinesRef.current =
                null;
        };

    }, []);


    // =========================================================
    // ACTUALIZAR PINES
    // =========================================================

    useEffect(() => {

        const grupoPines =
            grupoPinesRef.current;


        if (!grupoPines) {
            return;
        }


        // =====================================================
        // ELIMINAR PINES ANTERIORES
        // =====================================================

        while (
            grupoPines.children.length > 0
        ) {

            const elemento =
                grupoPines.children[0];

            grupoPines.remove(
                elemento
            );


            elemento.traverse(
                (objeto) => {

                    if (
                        objeto.geometry
                    ) {

                        objeto.geometry.dispose();
                    }


                    if (
                        objeto.material
                    ) {

                        if (
                            Array.isArray(
                                objeto.material
                            )
                        ) {

                            objeto.material.forEach(
                                (material) => {
                                    material.dispose();
                                }
                            );

                        } else {

                            objeto.material.dispose();
                        }
                    }
                }
            );
        }


        // =====================================================
        // VALIDAR ARRAY
        // =====================================================

        if (
            !Array.isArray(danios)
        ) {

            return;
        }


        // =====================================================
        // CREAR PINES
        // =====================================================

        danios.forEach(
            (dano, indice) => {

                if (
                    !dano ||
                    !dano.posicion_3d
                ) {

                    return;
                }


                const posicion =
                    dano.posicion_3d;


                // =============================================
                // COLOR
                // =============================================

                let color;

                switch (
                dano.severidad
                ) {

                    case "leve":

                        color =
                            0xffff00;

                        break;


                    case "medio":

                        color =
                            0xff8800;

                        break;


                    case "grave":

                        color =
                            0xff0000;

                        break;


                    default:

                        color =
                            0xffff00;
                }


                // =============================================
                // GRUPO DEL PIN
                // =============================================

                const pinGrupo =
                    new THREE.Group();

                pinGrupo.name =
                    `pin_danio_${indice}`;


                // =============================================
                // ESFERA DEL PIN
                // =============================================

                const geometriaPin =
                    new THREE.SphereGeometry(
                        0.18,
                        20,
                        20
                    );


                const materialPin =
                    new THREE.MeshBasicMaterial({
                        color: color,
                        depthTest: false
                    });


                const pin =
                    new THREE.Mesh(
                        geometriaPin,
                        materialPin
                    );


                pin.name =
                    `marcador_${indice}`;

                pin.renderOrder =
                    20;


                // =================================================
                // POSICION REAL
                // =================================================
                //
                // IMPORTANTE:
                // Aquí colocamos la esfera directamente
                // en la coordenada donde se hizo clic.
                //
                // NO movemos pinGrupo.
                //
                // =================================================

                pin.position.set(
                    posicion.x,
                    posicion.y + 0.18,
                    posicion.z
                );


                pinGrupo.add(
                    pin
                );


                // =============================================
                // PALO DEL PIN
                // =============================================

                const geometriaPalo =
                    new THREE.CylinderGeometry(
                        0.025,
                        0.025,
                        0.25,
                        8
                    );


                const materialPalo =
                    new THREE.MeshBasicMaterial({
                        color: color,
                        depthTest: false
                    });


                const palo =
                    new THREE.Mesh(
                        geometriaPalo,
                        materialPalo
                    );


                palo.name =
                    `palo_${indice}`;

                palo.renderOrder =
                    19;


                // El palo se coloca debajo
                // de la esfera.
                palo.position.set(
                    posicion.x,
                    posicion.y + 0.05,
                    posicion.z
                );


                pinGrupo.add(
                    palo
                );


                // =============================================
                // AGREGAR GRUPO
                // =============================================

                grupoPines.add(
                    pinGrupo
                );

            }
        );

    }, [danios]);


    // =========================================================
    // GUARDAR DAÑO
    // =========================================================

    const guardarDanio =
        () => {

            if (
                !piezaSeleccionada
            ) {
                return;
            }


            if (
                !puntoSeleccionado
            ) {
                return;
            }


            const nuevoDanio = {

                pieza:
                    piezaSeleccionada,

                tipo:
                    tipoDanio,

                severidad:
                    severidad,

                observacion:
                    observacion.trim(),

                posicion_3d: {

                    x:
                        puntoSeleccionado.x,

                    y:
                        puntoSeleccionado.y,

                    z:
                        puntoSeleccionado.z

                }

            };


            // =================================================
            // OBTENER DAÑOS ACTUALES
            // =================================================

            const actuales =
                Array.isArray(
                    daniosRef.current
                )
                    ? daniosRef.current
                    : [];


            // =================================================
            // AGREGAR NUEVO DAÑO
            // =================================================

            const nuevosDanios = [

                ...actuales,

                nuevoDanio

            ];


            if (setDanios) {

                setDanios(
                    nuevosDanios
                );
            }


            console.log(
                "================================="
            );

            console.log(
                "DAÑO REGISTRADO"
            );

            console.log(
                nuevoDanio
            );

            console.log(
                "TODOS LOS DAÑOS"
            );

            console.log(
                nuevosDanios
            );

            console.log(
                "================================="
            );


            // =================================================
            // CERRAR MODAL
            // =================================================

            setMostrarModal(
                false
            );


            setPiezaSeleccionada(
                null
            );

            setPuntoSeleccionado(
                null
            );

            setObservacion("");

            setTipoDanio(
                "rayon"
            );

            setSeveridad(
                "leve"
            );
        };


    // =========================================================
    // CANCELAR
    // =========================================================

    const cancelarDanio =
        () => {

            setMostrarModal(
                false
            );

            setPiezaSeleccionada(
                null
            );

            setPuntoSeleccionado(
                null
            );

            setObservacion("");

            setTipoDanio(
                "rayon"
            );

            setSeveridad(
                "leve"
            );
        };


    // =========================================================
    // NOMBRE DE PIEZA
    // =========================================================

    const nombrePieza =
        piezaSeleccionada
            ? piezaSeleccionada
                .replaceAll(
                    "_",
                    " "
                )
                .replace(
                    /\b\w/g,
                    (letra) =>
                        letra.toUpperCase()
                )
            : "";


    // =========================================================
    // CANTIDAD DE DAÑOS
    // =========================================================

    const cantidadDanos =
        Array.isArray(danios)
            ? danios.length
            : 0;


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="visor-3d-wrapper">


            {/* =================================================
                VISOR
            ================================================= */}

            <div
                ref={contenedorRef}
                className="visor-vehiculo-3d"
            />


            {/* =================================================
                CONTADOR
            ================================================= */}

            <div className="contador-danos-3d">

                <span>
                    Daños
                </span>

                <strong>
                    {cantidadDanos}
                </strong>

            </div>


            {/* =================================================
                AYUDA
            ================================================= */}

            <div className="controles-3d-ayuda">

                <span>
                    🖱️ Arrastra para girar
                </span>

                <span>
                    🔍 Rueda para zoom
                </span>

                <span>
                    👆 Clic en una pieza
                </span>

            </div>


            {/* =================================================
                MODAL
            ================================================= */}

            {mostrarModal && (

                <div className="modal-danio-overlay">

                    <div className="modal-danio">


                        {/* =================================================
                            HEADER
                        ================================================= */}

                        <div className="modal-danio-header">

                            <div>

                                <span>
                                    Registrar daño
                                </span>

                                <h3>
                                    {nombrePieza}
                                </h3>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    cancelarDanio
                                }
                                className="btn-cerrar-modal"
                            >
                                ×
                            </button>

                        </div>


                        {/* =================================================
                            CUERPO
                        ================================================= */}

                        <div className="modal-danio-body">


                            {/* =================================================
                                TIPO
                            ================================================= */}

                            <div className="campo-danio">

                                <label>
                                    Tipo de daño
                                </label>

                                <select
                                    value={
                                        tipoDanio
                                    }
                                    onChange={
                                        (e) =>
                                            setTipoDanio(
                                                e.target.value
                                            )
                                    }
                                >

                                    <option value="rayon">
                                        Rayón / Raspadura
                                    </option>

                                    <option value="abolladura">
                                        Abolladura / Golpe
                                    </option>

                                    <option value="rotura">
                                        Rotura
                                    </option>

                                    <option value="pintura">
                                        Pintura levantada
                                    </option>

                                </select>

                            </div>


                            {/* =================================================
                                SEVERIDAD
                            ================================================= */}

                            <div className="campo-danio">

                                <label>
                                    Severidad
                                </label>


                                <div className="opciones-severidad">


                                    {/* LEVE */}

                                    <label
                                        className={
                                            `opcion-severidad leve ${severidad ===
                                                "leve"
                                                ? "seleccionada"
                                                : ""
                                            }`
                                        }
                                    >

                                        <input
                                            type="radio"
                                            name="severidad"
                                            value="leve"
                                            checked={
                                                severidad ===
                                                "leve"
                                            }
                                            onChange={
                                                (e) =>
                                                    setSeveridad(
                                                        e.target.value
                                                    )
                                            }
                                        />

                                        <span>
                                            🟡
                                        </span>

                                        <div>

                                            <strong>
                                                Leve
                                            </strong>

                                            <small>
                                                Rayones o raspaduras
                                            </small>

                                        </div>

                                    </label>


                                    {/* MEDIO */}

                                    <label
                                        className={
                                            `opcion-severidad medio ${severidad ===
                                                "medio"
                                                ? "seleccionada"
                                                : ""
                                            }`
                                        }
                                    >

                                        <input
                                            type="radio"
                                            name="severidad"
                                            value="medio"
                                            checked={
                                                severidad ===
                                                "medio"
                                            }
                                            onChange={
                                                (e) =>
                                                    setSeveridad(
                                                        e.target.value
                                                    )
                                            }
                                        />

                                        <span>
                                            🟠
                                        </span>

                                        <div>

                                            <strong>
                                                Medio
                                            </strong>

                                            <small>
                                                Abolladuras o golpes
                                            </small>

                                        </div>

                                    </label>


                                    {/* GRAVE */}

                                    <label
                                        className={
                                            `opcion-severidad grave ${severidad ===
                                                "grave"
                                                ? "seleccionada"
                                                : ""
                                            }`
                                        }
                                    >

                                        <input
                                            type="radio"
                                            name="severidad"
                                            value="grave"
                                            checked={
                                                severidad ===
                                                "grave"
                                            }
                                            onChange={
                                                (e) =>
                                                    setSeveridad(
                                                        e.target.value
                                                    )
                                            }
                                        />

                                        <span>
                                            🔴
                                        </span>

                                        <div>

                                            <strong>
                                                Grave
                                            </strong>

                                            <small>
                                                Rotura o pieza dañada
                                            </small>

                                        </div>

                                    </label>

                                </div>

                            </div>


                            {/* =================================================
                                OBSERVACION
                            ================================================= */}

                            <div className="campo-danio">

                                <label>
                                    Observación
                                </label>

                                <textarea
                                    value={
                                        observacion
                                    }
                                    onChange={
                                        (e) =>
                                            setObservacion(
                                                e.target.value
                                            )
                                    }
                                    placeholder="Describe el daño..."
                                    rows="4"
                                />

                            </div>

                        </div>


                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="modal-danio-footer">

                            <button
                                type="button"
                                className="btn-cancelar-danio"
                                onClick={
                                    cancelarDanio
                                }
                            >
                                Cancelar
                            </button>


                            <button
                                type="button"
                                className="btn-guardar-danio"
                                onClick={
                                    guardarDanio
                                }
                            >
                                Guardar daño
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default VisorVehiculo3D;