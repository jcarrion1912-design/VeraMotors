import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import {
    cargarVehiculoRealista,
    aplicarColorCarroceria,
    normalizarTipoVehiculo,
    TIPOS_VEHICULO,
    COLORES_CARROCERIA
} from "./VehicleFactory";
import {
    crearPinDanio,
    formatearNombrePieza,
    TIPOS_DANO,
    SEVERIDAD_DANOS
} from "./DamageManager";
import "./VisorVehiculo3D.css";

// =========================================================
// IDENTIFICADOR INTELIGENTE DE PIEZAS DE VEHÍCULO
// =========================================================
function identificarPiezaDesdeImpacto(impacto) {
    if (!impacto?.object) return "carroceria";
    const nombre = impacto.object.name;

    const piezasValidas = [
        "capot", "techo", "maletera", "parabrisas", "luneta",
        "parachoques_delantero", "parachoques_trasero",
        "puerta_delantera_izq", "puerta_trasera_izq",
        "puerta_delantera_der", "puerta_trasera_der",
        "guardabarros_delantero_izq", "guardabarros_delantero_der",
        "guardabarros_trasero_izq", "guardabarros_trasero_der"
    ];

    if (piezasValidas.includes(nombre)) return nombre;

    // Detección espacial por coordenadas 3D para modelos GLB complejos
    const p = impacto.point;
    const x = p.x;
    const y = p.y;
    const z = p.z;

    if (z < -2.6) return "parachoques_delantero";
    if (z > 2.6) return "parachoques_trasero";
    if (y > 1.6 && Math.abs(x) < 1.4 && Math.abs(z) < 1.2) return "techo";
    if (z < -1.1 && y > 0.8 && Math.abs(x) < 1.4) return "capot";
    if (z > 1.1 && y > 0.8 && Math.abs(x) < 1.4) return "maletera";
    if (z < -0.7 && z > -1.7 && y > 1.2) return "parabrisas";
    if (z > 0.7 && z < 1.7 && y > 1.2) return "luneta";

    if (x < -0.8) {
        return z < 0 ? "puerta_delantera_izq" : "puerta_trasera_izq";
    }
    if (x > 0.8) {
        return z < 0 ? "puerta_delantera_der" : "puerta_trasera_der";
    }

    return "carroceria";
}

function VisorVehiculo3D({
    tipoVehiculo = "Automóvil",
    colorVehiculo = "#2563eb",
    danios = [],
    setDanios,
    modoLectura = false,
    onTipoVehiculoChange
}) {
    // =========================================================
    // REFERENCIAS
    // =========================================================
    const contenedorRef = useRef(null);
    const escenaRef = useRef(null);
    const camaraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlesRef = useRef(null);
    const vehiculoRef = useRef(null);
    const grupoPinesRef = useRef(null);
    const animacionRef = useRef(null);
    const tipoActualCargadoRef = useRef("");

    // Daños actualizados para raycast
    const daniosRef = useRef(danios);
    useEffect(() => {
        daniosRef.current = danios;
    }, [danios]);

    // =========================================================
    // ESTADOS
    // =========================================================
    const [tipoActivo, setTipoActivo] = useState(() => normalizarTipoVehiculo(tipoVehiculo));
    const [colorActivo, setColorActivo] = useState(() => colorVehiculo || "#2563eb");
    const [autoRotar, setAutoRotar] = useState(false);
    const [mostrarPines, setMostrarPines] = useState(true);
    const [cargandoModelo, setCargandoModelo] = useState(false);
    const [danioSeleccionado, setDanioSeleccionado] = useState(null);

    // Modal de registro de daño
    const [mostrarModal, setMostrarModal] = useState(false);
    const [piezaSeleccionada, setPiezaSeleccionada] = useState(null);
    const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
    const [tipoDanio, setTipoDanio] = useState("rayon");
    const [severidad, setSeveridad] = useState("leve");
    const [observacion, setObservacion] = useState("");

    // =========================================================
    // SINCRONIZAR PROPS EXTERNAS
    // =========================================================
    useEffect(() => {
        const nuevoTipo = normalizarTipoVehiculo(tipoVehiculo);
        if (nuevoTipo !== tipoActivo) {
            setTipoActivo(nuevoTipo);
        }
    }, [tipoVehiculo]);

    useEffect(() => {
        if (colorVehiculo && colorVehiculo !== colorActivo) {
            setColorActivo(colorVehiculo);
        }
    }, [colorVehiculo]);

    // =========================================================
    // CARGAR O REEMPLAZAR MODELO 3D REALISTA
    // =========================================================
    const cambiarModelo3D = useCallback(async (tipo, color) => {
        const escena = escenaRef.current;
        if (!escena) return;

        // Si el modelo ya es del mismo tipo y solo cambió el color, aplicar directamente
        if (tipoActualCargadoRef.current === tipo && vehiculoRef.current) {
            aplicarColorCarroceria(vehiculoRef.current, color);
            return;
        }

        setCargandoModelo(true);

        try {
            const nuevoVehiculo = await cargarVehiculoRealista(tipo, color);

            // Verificar si el componente sigue montado y la escena existe
            if (!escenaRef.current) return;

            // Limpiar vehículo previo
            if (vehiculoRef.current) {
                escenaRef.current.remove(vehiculoRef.current);
                vehiculoRef.current.traverse((obj) => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach((m) => m.dispose());
                        } else {
                            obj.material.dispose();
                        }
                    }
                });
                vehiculoRef.current = null;
            }

            // Añadir nuevo modelo
            nuevoVehiculo.position.set(0, 0, 0);
            nuevoVehiculo.scale.set(0.1, 0.1, 0.1);
            escenaRef.current.add(nuevoVehiculo);
            vehiculoRef.current = nuevoVehiculo;
            tipoActualCargadoRef.current = tipo;

            // Animación suave de aparición
            let scale = 0.1;
            const popIn = () => {
                scale += 0.12;
                if (scale < 1.0) {
                    if (vehiculoRef.current) {
                        vehiculoRef.current.scale.set(scale, scale, scale);
                    }
                    requestAnimationFrame(popIn);
                } else {
                    if (vehiculoRef.current) {
                        vehiculoRef.current.scale.set(1, 1, 1);
                    }
                }
            };
            popIn();
        } catch (err) {
            console.error("Error al cargar modelo 3D realista:", err);
        } finally {
            setCargandoModelo(false);
        }
    }, []);

    // Actualizar modelo cuando cambie tipo o color
    useEffect(() => {
        cambiarModelo3D(tipoActivo, colorActivo);
    }, [tipoActivo, colorActivo, cambiarModelo3D]);

    // Manejar cambio de tipo de vehículo desde el selector de la UI
    const handleSeleccionarTipo = (nuevoTipoId) => {
        setTipoActivo(nuevoTipoId);
        if (onTipoVehiculoChange) {
            const encontrado = TIPOS_VEHICULO.find((t) => t.id === nuevoTipoId);
            onTipoVehiculoChange(encontrado ? encontrado.label : nuevoTipoId);
        }
    };

    // =========================================================
    // INICIALIZACIÓN DE THREE.JS ESCENA Y CONTROLES
    // =========================================================
    useEffect(() => {
        if (!contenedorRef.current) return;
        const contenedor = contenedorRef.current;

        // 1. Escena
        const escena = new THREE.Scene();
        escena.background = new THREE.Color(0x0a0f1d);
        escena.fog = new THREE.FogExp2(0x0a0f1d, 0.02);
        escenaRef.current = escena;

        // 2. Cámara
        const ancho = contenedor.clientWidth || 800;
        const alto = contenedor.clientHeight || 560;
        const camara = new THREE.PerspectiveCamera(40, ancho / alto, 0.1, 1000);
        camara.position.set(8.5, 4.6, 9.5);
        camaraRef.current = camara;

        // 3. Renderer con WebGL antialiasing de alta calidad
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(ancho, alto);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.touchAction = "none";
        contenedor.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 4. OrbitControls
        const controles = new OrbitControls(camara, renderer.domElement);
        controles.enableDamping = true;
        controles.dampingFactor = 0.06;
        controles.rotateSpeed = 0.8;
        controles.zoomSpeed = 0.9;
        controles.minDistance = 4;
        controles.maxDistance = 22;
        controles.maxPolarAngle = Math.PI / 2 - 0.03;
        controles.target.set(0, 1.1, 0);
        controles.update();
        controlesRef.current = controles;

        // 5. Iluminación tipo Showroom Estudio Automotriz
        const luzAmbiente = new THREE.HemisphereLight(0xffffff, 0x1e293b, 2.0);
        escena.add(luzAmbiente);

        // Luz cenital principal con sombras suaves
        const luzCenital = new THREE.DirectionalLight(0xffffff, 2.8);
        luzCenital.position.set(6, 14, 6);
        luzCenital.castShadow = true;
        luzCenital.shadow.mapSize.width = 1024;
        luzCenital.shadow.mapSize.height = 1024;
        luzCenital.shadow.bias = -0.0003;
        escena.add(luzCenital);

        // Luz de relleno frontal azulada
        const luzRelleno = new THREE.DirectionalLight(0xbcd9ff, 1.4);
        luzRelleno.position.set(-8, 6, -7);
        escena.add(luzRelleno);

        // Luz trasera de contorno (Rim light)
        const luzRecorte = new THREE.DirectionalLight(0x38bdf8, 1.8);
        luzRecorte.position.set(-6, 7, 9);
        escena.add(luzRecorte);

        // 6. Plataforma Showroom Giratoria
        const pisoShowroom = new THREE.Mesh(
            new THREE.CylinderGeometry(8.6, 8.9, 0.15, 64),
            new THREE.MeshStandardMaterial({
                color: 0x172033,
                roughness: 0.35,
                metalness: 0.6
            })
        );
        pisoShowroom.position.y = -0.075;
        pisoShowroom.receiveShadow = true;
        escena.add(pisoShowroom);

        // Anillo de luz en la base
        const anilloLuz = new THREE.Mesh(
            new THREE.RingGeometry(8.2, 8.5, 64),
            new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            })
        );
        anilloLuz.rotation.x = -Math.PI / 2;
        anilloLuz.position.y = 0.01;
        escena.add(anilloLuz);

        // Sombra de contacto bajo el vehículo
        const sombraPlaca = new THREE.Mesh(
            new THREE.PlaneGeometry(6.6, 9.8),
            new THREE.MeshBasicMaterial({
                color: 0x020617,
                transparent: true,
                opacity: 0.6
            })
        );
        sombraPlaca.rotation.x = -Math.PI / 2;
        sombraPlaca.position.y = 0.02;
        escena.add(sombraPlaca);

        // Cuadrícula sutil
        const grid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
        grid.position.y = -0.08;
        escena.add(grid);

        // 7. Grupo de pines de daño
        const grupoPines = new THREE.Group();
        grupoPines.name = "pines_danos";
        escena.add(grupoPines);
        grupoPinesRef.current = grupoPines;

        // 8. Cargar vehículo realista inicial
        cambiarModelo3D(tipoActivo, colorActivo);

        // 9. Raycaster para detección de clics en piezas y pines
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let inicioX = 0;
        let inicioY = 0;
        let arrastrando = false;

        const onPointerDown = (e) => {
            inicioX = e.clientX;
            inicioY = e.clientY;
            arrastrando = false;
        };

        const onPointerMove = (e) => {
            if (Math.abs(e.clientX - inicioX) > 6 || Math.abs(e.clientY - inicioY) > 6) {
                arrastrando = true;
            }
        };

        const onPointerUp = (e) => {
            if (arrastrando) return;

            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camara);

            // Primero verificar si tocó un pin existente
            if (grupoPinesRef.current) {
                const hitsPines = raycaster.intersectObjects(
                    grupoPinesRef.current.children,
                    true
                );
                if (hitsPines.length > 0) {
                    let obj = hitsPines[0].object;
                    while (obj && !obj.userData?.dano && obj.parent) {
                        obj = obj.parent;
                    }
                    if (obj?.userData?.dano) {
                        setDanioSeleccionado(obj.userData.dano);
                        return;
                    }
                }
            }

            if (modoLectura) return;

            // Verificar impacto en el vehículo
            if (!vehiculoRef.current) return;
            const intersecciones = raycaster.intersectObjects(
                vehiculoRef.current.children,
                true
            );

            if (intersecciones.length === 0) return;

            const impacto = intersecciones[0];
            const piezaDetectada = identificarPiezaDesdeImpacto(impacto);

            if (!piezaDetectada || piezaDetectada === "rueda") return;

            setPiezaSeleccionada(piezaDetectada);
            setPuntoSeleccionado({
                x: Number(impacto.point.x.toFixed(3)),
                y: Number(impacto.point.y.toFixed(3)),
                z: Number(impacto.point.z.toFixed(3))
            });
            setDanioSeleccionado(null);
            setMostrarModal(true);
        };

        renderer.domElement.addEventListener("pointerdown", onPointerDown);
        renderer.domElement.addEventListener("pointermove", onPointerMove);
        renderer.domElement.addEventListener("pointerup", onPointerUp);

        // 10. Redimensionamiento
        const onResize = () => {
            if (!contenedor) return;
            const nuevoAncho = contenedor.clientWidth;
            const nuevoAlto = contenedor.clientHeight;
            if (nuevoAncho === 0 || nuevoAlto === 0) return;

            camara.aspect = nuevoAncho / nuevoAlto;
            camara.updateProjectionMatrix();
            renderer.setSize(nuevoAncho, nuevoAlto);
        };
        window.addEventListener("resize", onResize);

        // 11. Bucle de animación (60fps)
        const animar = () => {
            animacionRef.current = requestAnimationFrame(animar);

            if (controlesRef.current) {
                if (autoRotar) {
                    controlesRef.current.autoRotate = true;
                    controlesRef.current.autoRotateSpeed = 2.0;
                } else {
                    controlesRef.current.autoRotate = false;
                }
                controlesRef.current.update();
            }

            renderer.render(escena, camara);
        };
        animar();

        // 12. Cleanup
        return () => {
            if (animacionRef.current) cancelAnimationFrame(animacionRef.current);
            window.removeEventListener("resize", onResize);

            if (renderer.domElement) {
                renderer.domElement.removeEventListener("pointerdown", onPointerDown);
                renderer.domElement.removeEventListener("pointermove", onPointerMove);
                renderer.domElement.removeEventListener("pointerup", onPointerUp);
            }

            controles.dispose();
            renderer.dispose();
            if (contenedor.contains(renderer.domElement)) {
                contenedor.removeChild(renderer.domElement);
            }
        };
    }, []);

    // =========================================================
    // CONTROL DE AUTO-ROTACIÓN DINÁMICO
    // =========================================================
    useEffect(() => {
        if (controlesRef.current) {
            controlesRef.current.autoRotate = autoRotar;
            controlesRef.current.autoRotateSpeed = 2.0;
        }
    }, [autoRotar]);

    // =========================================================
    // VISIBILIDAD DE PINES
    // =========================================================
    useEffect(() => {
        if (grupoPinesRef.current) {
            grupoPinesRef.current.visible = mostrarPines;
        }
    }, [mostrarPines]);

    // =========================================================
    // ACTUALIZAR PINES DE DAÑOS EN LA ESCENA
    // =========================================================
    useEffect(() => {
        const grupo = grupoPinesRef.current;
        if (!grupo) return;

        while (grupo.children.length > 0) {
            const el = grupo.children[0];
            grupo.remove(el);
            el.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
                    else obj.material.dispose();
                }
            });
        }

        if (!Array.isArray(danios)) return;

        danios.forEach((dano, i) => {
            if (!dano?.posicion_3d) return;
            const pinMesh = crearPinDanio(dano, i);
            grupo.add(pinMesh);
        });
    }, [danios]);

    // =========================================================
    // CAMBIO DE ÁNGULOS DE CÁMARA PREESTABLECIDOS
    // =========================================================
    const enfocarVista = (angulo) => {
        const cam = camaraRef.current;
        const ctrl = controlesRef.current;
        if (!cam || !ctrl) return;

        setAutoRotar(false);
        ctrl.target.set(0, 1.1, 0);

        switch (angulo) {
            case "frente":
                cam.position.set(0, 2.2, -10.5);
                break;
            case "trasera":
                cam.position.set(0, 2.2, 10.5);
                break;
            case "lateral_izq":
                cam.position.set(-11.5, 2.0, 0);
                break;
            case "lateral_der":
                cam.position.set(11.5, 2.0, 0);
                break;
            case "techo":
                cam.position.set(0, 13.5, 0.5);
                break;
            case "perspectiva":
            default:
                cam.position.set(8.5, 4.6, 9.5);
                break;
        }
        ctrl.update();
    };

    // =========================================================
    // GUARDAR DAÑO REGISTRADO
    // =========================================================
    const guardarDanio = () => {
        if (!piezaSeleccionada || !puntoSeleccionado) return;

        const nuevoDanio = {
            id: `dano_${Date.now()}`,
            pieza: piezaSeleccionada,
            tipo: tipoDanio,
            severidad: severidad,
            observacion: observacion.trim(),
            posicion_3d: puntoSeleccionado,
            fecha: new Date().toISOString()
        };

        const listaActualizada = [...(Array.isArray(danios) ? danios : []), nuevoDanio];

        if (setDanios) {
            setDanios(listaActualizada);
        }

        setMostrarModal(false);
        setPiezaSeleccionada(null);
        setPuntoSeleccionado(null);
        setObservacion("");
        setTipoDanio("rayon");
        setSeveridad("leve");
    };

    const cancelarDanio = () => {
        setMostrarModal(false);
        setPiezaSeleccionada(null);
        setPuntoSeleccionado(null);
        setObservacion("");
        setTipoDanio("rayon");
        setSeveridad("leve");
    };

    const eliminarDanio = (idEliminar) => {
        if (!setDanios) return;
        const filtrados = danios.filter((d) => d.id !== idEliminar);
        setDanios(filtrados);
        setDanioSeleccionado(null);
    };

    // Conteo de severidad
    const conteoDanios = {
        total: danios?.length || 0,
        leves: danios?.filter((d) => d.severidad === "leve").length || 0,
        medios: danios?.filter((d) => d.severidad === "medio").length || 0,
        graves: danios?.filter((d) => d.severidad === "grave").length || 0
    };

    return (
        <div className="showroom-360-container">
            {/* =========================================================
                1. HEADER / BARRA DE SELECCIÓN DE TIPO DE VEHÍCULO (CARSHOW360)
            ========================================================= */}
            <div className="showroom-body-selector-bar">
                <div className="selector-title">
                    <span className="material-symbols-outlined live-dot">view_in_ar</span>
                    <span>Tipo de Carrocería</span>
                </div>

                <div className="selector-pills-scroll">
                    {TIPOS_VEHICULO.map((item) => {
                        const estaActivo = item.id === tipoActivo;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`pill-body-type ${estaActivo ? "active" : ""}`}
                                onClick={() => handleSeleccionarTipo(item.id)}
                                title={item.subtitulo}
                            >
                                <span className="pill-emoji">{item.emoji}</span>
                                <div className="pill-texts">
                                    <span className="pill-name">{item.label}</span>
                                    <span className="pill-sub">{item.subtitulo}</span>
                                </div>
                                {estaActivo && <span className="active-glow-indicator" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* =========================================================
                2. ÁREA DEL VISOR 3D (CANVAS THREE.JS)
            ========================================================= */}
            <div className="showroom-viewport-wrapper">
                <div ref={contenedorRef} className="showroom-canvas-container" />

                {/* OVERLAY DE CARGA DE MODELO 3D */}
                {cargandoModelo && (
                    <div className="showroom-loading-overlay">
                        <div className="loading-spinner-ring" />
                        <span>Cargando diseño 3D realista...</span>
                    </div>
                )}

                {/* BADGE DE INFORMACIÓN DEL MODELO ACTUAL */}
                <div className="showroom-model-badge">
                    <div className="badge-chip">
                        <span className="badge-icon">3D REAL</span>
                        <strong>
                            {TIPOS_VEHICULO.find((t) => t.id === tipoActivo)?.label || "Sedán"}
                        </strong>
                    </div>
                    <span className="badge-hint">Gira 360° o pulsa una pieza para inspección</span>
                </div>

                {/* CONTADOR DE DAÑOS Y ESTADÍSTICAS */}
                <div className="showroom-damage-counter">
                    <div className="counter-header">
                        <span className="material-symbols-outlined">report_problem</span>
                        <span>{conteoDanios.total} Daños Detectados</span>
                    </div>
                    {conteoDanios.total > 0 && (
                        <div className="counter-breakdown">
                            <span className="badge-severidad-dot leve" title="Leves">
                                🟡 {conteoDanios.leves}
                            </span>
                            <span className="badge-severidad-dot medio" title="Medios">
                                🟠 {conteoDanios.medios}
                            </span>
                            <span className="badge-severidad-dot grave" title="Graves">
                                🔴 {conteoDanios.graves}
                            </span>
                        </div>
                    )}
                </div>

                {/* BOTONERA LATERAL DE ÁNGULOS PREESTABLECIDOS */}
                <div className="showroom-camera-dock">
                    <button
                        type="button"
                        className="btn-dock-icon"
                        onClick={() => enfocarVista("perspectiva")}
                        title="Vista Perspectiva 3/4"
                    >
                        <span className="material-symbols-outlined">crop_rotate</span>
                        <small>3/4</small>
                    </button>
                    <button
                        type="button"
                        className="btn-dock-icon"
                        onClick={() => enfocarVista("frente")}
                        title="Vista Delantera"
                    >
                        <span className="material-symbols-outlined">directions_car</span>
                        <small>Frente</small>
                    </button>
                    <button
                        type="button"
                        className="btn-dock-icon"
                        onClick={() => enfocarVista("lateral_izq")}
                        title="Vista Lateral"
                    >
                        <span className="material-symbols-outlined">swap_horiz</span>
                        <small>Lateral</small>
                    </button>
                    <button
                        type="button"
                        className="btn-dock-icon"
                        onClick={() => enfocarVista("trasera")}
                        title="Vista Posterior / Maletera"
                    >
                        <span className="material-symbols-outlined">back_hand</span>
                        <small>Atrás</small>
                    </button>
                    <button
                        type="button"
                        className="btn-dock-icon"
                        onClick={() => enfocarVista("techo")}
                        title="Vista Cenital / Techo"
                    >
                        <span className="material-symbols-outlined">vertical_align_top</span>
                        <small>Techo</small>
                    </button>
                </div>

                {/* BARRA DE HERRAMIENTAS INFERIOR (SHOWROOM CONTROLS) */}
                <div className="showroom-bottom-toolbar">
                    <button
                        type="button"
                        className={`toolbar-btn ${autoRotar ? "active" : ""}`}
                        onClick={() => setAutoRotar((prev) => !prev)}
                        title="Activar/desactivar rotación continua 360°"
                    >
                        <span className="material-symbols-outlined spin-icon">
                            {autoRotar ? "pause_circle" : "sync"}
                        </span>
                        <span>{autoRotar ? "Pausar Giro" : "Giro 360°"}</span>
                    </button>

                    <div className="color-palette-widget">
                        <span className="color-label">Pintura:</span>
                        <div className="color-swatches">
                            {COLORES_CARROCERIA.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`swatch-btn ${colorActivo === c.preview ? "active" : ""}`}
                                    style={{ backgroundColor: c.preview }}
                                    onClick={() => setColorActivo(c.preview)}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        className={`toolbar-btn ${mostrarPines ? "active" : ""}`}
                        onClick={() => setMostrarPines((prev) => !prev)}
                        title="Mostrar u ocultar marcadores de inspección"
                    >
                        <span className="material-symbols-outlined">
                            {mostrarPines ? "visibility" : "visibility_off"}
                        </span>
                        <span>{mostrarPines ? "Marcadores On" : "Marcadores Off"}</span>
                    </button>
                </div>

                {/* =========================================================
                    TARJETA FLOTANTE DE DETALLE DE DAÑO SELECCIONADO
                ========================================================= */}
                {danioSeleccionado && (
                    <div className="card-detalle-danio-flotante">
                        <div className="detalle-header">
                            <div>
                                <span className={`badge-severidad ${danioSeleccionado.severidad}`}>
                                    {SEVERIDAD_DANOS[danioSeleccionado.severidad]?.emoji}{" "}
                                    {SEVERIDAD_DANOS[danioSeleccionado.severidad]?.label}
                                </span>
                                <h4>{formatearNombrePieza(danioSeleccionado.pieza)}</h4>
                            </div>
                            <button
                                type="button"
                                className="btn-close-card"
                                onClick={() => setDanioSeleccionado(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="detalle-body">
                            <p className="tipo-tag">
                                <strong>Tipo: </strong>
                                {TIPOS_DANO.find((t) => t.id === danioSeleccionado.tipo)?.label ||
                                    danioSeleccionado.tipo}
                            </p>
                            {danioSeleccionado.observacion && (
                                <p className="obs-text">
                                    <strong>Obs: </strong>
                                    {danioSeleccionado.observacion}
                                </p>
                            )}
                        </div>
                        {!modoLectura && (
                            <div className="detalle-footer">
                                <button
                                    type="button"
                                    className="btn-eliminar-danio-card"
                                    onClick={() => eliminarDanio(danioSeleccionado.id)}
                                >
                                    <span className="material-symbols-outlined">delete</span> Eliminar Marcador
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* =========================================================
                3. MODAL DE REGISTRO DE DAÑO EN PIEZA CLICKEADA
            ========================================================= */}
            {mostrarModal && (
                <div className="modal-danio-overlay">
                    <div className="modal-danio animate-pop">
                        <div className="modal-danio-header">
                            <div>
                                <span className="modal-sub">Inspección de Carrocería 3D</span>
                                <h3>{formatearNombrePieza(piezaSeleccionada)}</h3>
                            </div>
                            <button type="button" onClick={cancelarDanio} className="btn-cerrar-modal">
                                ×
                            </button>
                        </div>

                        <div className="modal-danio-body">
                            <div className="campo-danio">
                                <label>Tipo de daño registrado</label>
                                <div className="grid-tipos-danio">
                                    {TIPOS_DANO.map((tipo) => (
                                        <button
                                            key={tipo.id}
                                            type="button"
                                            className={`tipo-chip ${tipoDanio === tipo.id ? "selected" : ""}`}
                                            onClick={() => setTipoDanio(tipo.id)}
                                        >
                                            <span className="material-symbols-outlined">{tipo.icono}</span>
                                            <span>{tipo.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="campo-danio">
                                <label>Nivel de Severidad</label>
                                <div className="opciones-severidad">
                                    {Object.values(SEVERIDAD_DANOS).map((sev) => (
                                        <label
                                            key={sev.id}
                                            className={`opcion-severidad ${sev.id} ${severidad === sev.id ? "seleccionada" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="severidad"
                                                value={sev.id}
                                                checked={severidad === sev.id}
                                                onChange={(e) => setSeveridad(e.target.value)}
                                            />
                                            <span className="sev-emoji">{sev.emoji}</span>
                                            <div>
                                                <strong>{sev.label}</strong>
                                                <small>{sev.subtitulo}</small>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="campo-danio">
                                <label>Observaciones o Detalle Técnico</label>
                                <textarea
                                    value={observacion}
                                    onChange={(e) => setObservacion(e.target.value)}
                                    placeholder="Ejemplo: Raspón de 10cm en borde exterior..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="modal-danio-footer">
                            <button type="button" className="btn-cancelar-danio" onClick={cancelarDanio}>
                                Cancelar
                            </button>
                            <button type="button" className="btn-guardar-danio" onClick={guardarDanio}>
                                <span className="material-symbols-outlined">add_location_alt</span>
                                Guardar Marcador 3D
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VisorVehiculo3D;