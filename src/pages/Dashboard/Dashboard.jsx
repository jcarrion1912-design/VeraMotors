import "./Dashboard.css";

function Dashboard() {
    return (
        <div className="dashboard">

            {/* ENCABEZADO DEL DASHBOARD */}
            <div className="dashboard-header">

                <div>
                    <h1>Resumen del Taller</h1>
                    <p>Vista general operativa de hoy</p>
                </div>

                <button className="report-button">
                    <span>⇩</span>
                    Reporte
                </button>

            </div>


            {/* TARJETAS KPI */}
            <div className="stats-grid">

                {/* VEHÍCULOS EN TALLER */}
                <div className="stat-card">

                    <div className="stat-card-top">
                        <span>Vehículos en taller</span>

                        <div className="stat-icon blue">
                            🚗
                        </div>
                    </div>

                    <div className="stat-value">
                        12
                    </div>

                    <div className="stat-description positive">
                        ↑ +2
                        <span>vs ayer</span>
                    </div>

                </div>


                {/* CITAS */}
                <div className="stat-card">

                    <div className="stat-card-top">
                        <span>Citas hoy</span>

                        <div className="stat-icon dark">
                            📅
                        </div>
                    </div>

                    <div className="stat-value-row">

                        <div className="stat-value">
                            8
                        </div>

                        <span className="capacity">
                            / 10 cap.
                        </span>

                    </div>

                    <div className="progress-container">
                        <div
                            className="progress-bar"
                            style={{ width: "80%" }}
                        ></div>
                    </div>

                </div>


                {/* INGRESOS */}
                <div className="stat-card">

                    <div className="stat-card-top">
                        <span>Ingresos mes</span>

                        <div className="stat-icon green">
                            💰
                        </div>
                    </div>

                    <div className="stat-value">
                        S/ 15.4k
                    </div>

                    <div className="stat-description positive green-text">
                        ↑ +12%
                        <span>vs mes anterior</span>
                    </div>

                </div>


                {/* ALERTAS */}
                <div className="stat-card alert-card">

                    <div className="stat-card-top">
                        <span>Alertas stock</span>

                        <div className="stat-icon red">
                            ⚠
                        </div>
                    </div>

                    <div className="stat-value alert-value">
                        3
                    </div>

                    <div className="stat-description alert-text">
                        Items críticos
                        <span className="detail-link">
                            Ver detalle
                        </span>
                    </div>

                </div>

            </div>


            {/* CONTENIDO PRINCIPAL */}
            <div className="dashboard-content">

                {/* SERVICIOS RECIENTES */}
                <div className="services-card">

                    <div className="section-header">

                        <h2>
                            <span className="section-icon">🔧</span>
                            Servicios Recientes
                        </h2>

                        <button className="view-all">
                            Ver todos
                        </button>

                    </div>


                    <div className="table-container">

                        <table>

                            <thead>
                                <tr>
                                    <th>Placa / Modelo</th>
                                    <th>Servicio</th>
                                    <th>Estado</th>
                                    <th>Prioridad</th>
                                </tr>
                            </thead>

                            <tbody>

                                <tr>

                                    <td>
                                        <div className="plate">
                                            ABC-1234
                                        </div>

                                        <div className="vehicle">
                                            Toyota Hilux 2021
                                        </div>
                                    </td>

                                    <td>
                                        Cambio de Aceite & Filtros
                                    </td>

                                    <td>
                                        <span className="status progress">
                                            <span></span>
                                            En Progreso
                                        </span>
                                    </td>

                                    <td className="priority normal">
                                        —
                                    </td>

                                </tr>


                                <tr>

                                    <td>
                                        <div className="plate">
                                            XYZ-9876
                                        </div>

                                        <div className="vehicle">
                                            Ford Ranger 2019
                                        </div>
                                    </td>

                                    <td>
                                        Reparación de Frenos
                                    </td>

                                    <td>
                                        <span className="status waiting">
                                            <span></span>
                                            Espera Repuestos
                                        </span>
                                    </td>

                                    <td className="priority high">
                                        ↑↑
                                    </td>

                                </tr>


                                <tr>

                                    <td>
                                        <div className="plate">
                                            DEF-4567
                                        </div>

                                        <div className="vehicle">
                                            Honda Civic 2022
                                        </div>
                                    </td>

                                    <td>
                                        Mantenimiento 50k
                                    </td>

                                    <td>
                                        <span className="status completed">
                                            <span></span>
                                            Completado
                                        </span>
                                    </td>

                                    <td className="priority normal">
                                        —
                                    </td>

                                </tr>


                                <tr>

                                    <td>
                                        <div className="plate">
                                            GHI-8901
                                        </div>

                                        <div className="vehicle">
                                            Nissan Navara 2020
                                        </div>
                                    </td>

                                    <td>
                                        Diagnóstico Motor
                                    </td>

                                    <td>
                                        <span className="status pending">
                                            <span></span>
                                            Por Iniciar
                                        </span>
                                    </td>

                                    <td className="priority medium">
                                        ↑
                                    </td>

                                </tr>


                                <tr>

                                    <td>
                                        <div className="plate">
                                            JKL-2345
                                        </div>

                                        <div className="vehicle">
                                            Chevrolet Silverado
                                        </div>
                                    </td>

                                    <td>
                                        Alineación y Balanceo
                                    </td>

                                    <td>
                                        <span className="status progress">
                                            <span></span>
                                            En Progreso
                                        </span>
                                    </td>

                                    <td className="priority normal">
                                        —
                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                </div>


                {/* PRÓXIMAS CITAS */}
                <div className="appointments-card">

                    <div className="section-header">

                        <h2>
                            <span className="section-icon">📅</span>
                            Próximas Citas
                        </h2>

                    </div>


                    <div className="appointments-list">

                        {/* CITA 1 */}
                        <div className="appointment">

                            <div className="appointment-time">

                                <span>HOY</span>

                                <strong>
                                    14:00
                                </strong>

                            </div>

                            <div className="appointment-info">

                                <h3>
                                    Juan Pérez
                                </h3>

                                <p>
                                    Revisión General • MNN-778
                                </p>

                            </div>

                            <button className="more-button">
                                ⋮
                            </button>

                        </div>


                        {/* CITA 2 */}
                        <div className="appointment">

                            <div className="appointment-time">

                                <span>HOY</span>

                                <strong>
                                    15:30
                                </strong>

                            </div>

                            <div className="appointment-info">

                                <h3>
                                    María Gómez
                                </h3>

                                <p>
                                    Cambio Batería • KJD-112
                                </p>

                            </div>

                            <button className="more-button">
                                ⋮
                            </button>

                        </div>


                        {/* CITA 3 */}
                        <div className="appointment tomorrow">

                            <div className="appointment-time">

                                <span>MAÑ</span>

                                <strong>
                                    09:00
                                </strong>

                            </div>

                            <div className="appointment-info">

                                <h3>
                                    Carlos Ruiz
                                </h3>

                                <p>
                                    Diagnóstico Eléctrico • TRP-900
                                </p>

                            </div>

                            <button className="more-button">
                                ⋮
                            </button>

                        </div>


                        {/* CITA 4 */}
                        <div className="appointment tomorrow">

                            <div className="appointment-time">

                                <span>MAÑ</span>

                                <strong>
                                    11:00
                                </strong>

                            </div>

                            <div className="appointment-info">

                                <h3>
                                    Empresa Logística SAC
                                </h3>

                                <p>
                                    Mantenimiento Flota • Varias
                                </p>

                            </div>

                            <button className="more-button">
                                ⋮
                            </button>

                        </div>

                    </div>


                    <div className="calendar-footer">

                        <button>
                            Ver Calendario Completo
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Dashboard;