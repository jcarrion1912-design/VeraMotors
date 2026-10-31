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


          {/* =========================================
                        RUTAS PROTEGIDAS
                    ========================================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/citas"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Citas />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/kanban"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Kanban />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Clientes />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Inventario />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ordenes-servicio"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <OrdenesServicio />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/facturacion"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Facturacion />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cotizaciones"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Cotizaciones />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Reportes />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/metricas"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Metricas />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/proveedores"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Proveedores />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/compras"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Compras />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/bancos"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Bancos />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/configuracion"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Configuracion />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/asistencia"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Asistencia />
                </MainLayout>
              </ProtectedRoute>
            }
          />


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