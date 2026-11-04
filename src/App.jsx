import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider } from "./context/RoleContext";

import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard/Dashboard";
import Citas from "./pages/Citas/Citas";
import Kanban from "./pages/Kanban/Kanban";
import Clientes from "./pages/Clientes/Clientes";
import Inventario from "./pages/Inventario/Inventario";
import OrdenesServicio from "./pages/OrdenesServicio/OrdenesServicio";
import Facturacion from "./pages/Facturacion/Facturacion";
import Cotizaciones from "./pages/Cotizaciones/Cotizaciones";
import Reportes from "./pages/Reportes/Reportes";
import Metricas from "./pages/Metricas/Metricas";
import Proveedores from "./pages/Proveedores/Proveedores";
import Compras from "./pages/Compras/Compras";
import Bancos from "./pages/Bancos/Bancos";
import Configuracion from "./pages/Configuracion/Configuracion";
import Asistencia from "./pages/Asistencia/Asistencia";
import Login from "./pages/Login/Login";
import AprobacionCliente from "./pages/AprobacionCliente/AprobacionCliente";

function App() {
  return (
    <RoleProvider>
      <BrowserRouter>

        <Routes>

          {/* =========================================
                        LOGIN
                    ========================================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          {/* Pública: el cliente responde desde el enlace firmado */}
          <Route
            path="/aprobacion-cliente/:token"
            element={<AprobacionCliente />}
          />


          {/* =========================================
                        RUTAS PROTEGIDAS
                    ========================================= */}

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/citas" element={<Citas />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/ordenes-servicio" element={<OrdenesServicio />} />
            <Route path="/facturacion" element={<Facturacion />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/metricas" element={<Metricas />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/bancos" element={<Bancos />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/asistencia" element={<Asistencia />} />
          </Route>


          {/* =========================================
                        RUTA INICIAL
                    ========================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />


          {/* =========================================
                        RUTA NO EXISTENTE
                    ========================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>
    </RoleProvider>
  );
}

export default App;