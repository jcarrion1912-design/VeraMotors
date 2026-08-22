import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard/Dashboard";
import Citas from "./pages/Citas/Citas";
import Kanban from "./pages/Kanban/Kanban";
import Clientes from "./pages/Clientes/Clientes";
import Inventario from "./pages/Inventario/Inventario";
import OrdenesServicio from "./pages/OrdenesServicio/OrdenesServicio";
import Facturacion from "./pages/Facturacion/Facturacion";
import Reportes from "./pages/Reportes/Reportes";
import Metricas from "./pages/Metricas/Metricas";
import Proveedores from "./pages/Proveedores/Proveedores";
import Compras from "./pages/Compras/Compras";
import Bancos from "./pages/Bancos/Bancos";
import Configuracion from "./pages/Configuracion/Configuracion";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/dashboard"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />

        <Route
          path="/citas"
          element={
            <MainLayout>
              <Citas />
            </MainLayout>
          }
        />

        <Route
          path="/kanban"
          element={
            <MainLayout>
              <Kanban />
            </MainLayout>
          }
        />

        <Route
          path="/clientes"
          element={
            <MainLayout>
              <Clientes />
            </MainLayout>
          }
        />

        <Route
          path="/inventario"
          element={
            <MainLayout>
              <Inventario />
            </MainLayout>
          }
        />

        <Route
          path="/ordenes-servicio"
          element={
            <MainLayout>
              <OrdenesServicio />
            </MainLayout>
          }
        />

        <Route
          path="/facturacion"
          element={
            <MainLayout>
              <Facturacion />
            </MainLayout>
          }
        />

        <Route
          path="/reportes"
          element={
            <MainLayout>
              <Reportes />
            </MainLayout>
          }
        />

        <Route
          path="/metricas"
          element={
            <MainLayout>
              <Metricas />
            </MainLayout>
          }
        />

        <Route
          path="/proveedores"
          element={
            <MainLayout>
              <Proveedores />
            </MainLayout>
          }
        />

        <Route
          path="/compras"
          element={
            <MainLayout>
              <Compras />
            </MainLayout>
          }
        />

        <Route
          path="/bancos"
          element={
            <MainLayout>
              <Bancos />
            </MainLayout>
          }
        />

        <Route
          path="/configuracion"
          element={
            <MainLayout>
              <Configuracion />
            </MainLayout>
          }
        />

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;