const escapar = (valor) =>
    String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const moneda = (valor) => `S/ ${Number(valor || 0).toFixed(2)}`;

// Abre la orden en una ventana imprimible; desde el diálogo se guarda como PDF.
// Devuelve false si el navegador bloqueó la ventana emergente.
export function imprimirOrdenCompra({ orden, proveedor, detalles }) {
    const ventana = window.open("", "_blank");
    if (!ventana) return false;

    const filas = detalles.length > 0
        ? detalles.map((d) => `
            <tr>
                <td>${escapar(d.codigo_referencia)}</td>
                <td>${escapar(d.descripcion)}</td>
                <td class="num">${Number(d.cantidad)}</td>
                <td class="num">${moneda(d.precio_unitario)}</td>
                <td class="num">${moneda(Number(d.cantidad) * Number(d.precio_unitario))}</td>
            </tr>`).join("")
        : `<tr><td colspan="5" class="vacio">Esta orden se registró sin detalle de ítems.</td></tr>`;

    ventana.document.write(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapar(orden.codigo_compra)}</title>
<style>
    body { margin: 32px; color: #1b2025; font: 13px/1.45 Arial, Helvetica, sans-serif; }
    header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #134455; }
    h1 { margin: 0; color: #134455; font-size: 20px; letter-spacing: 0.04em; }
    h2 { margin: 0; font-size: 16px; text-align: right; }
    .datos { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin: 16px 0; }
    .datos span { color: #636c77; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 8px; border-bottom: 2px solid #134455; font-size: 11px; text-align: left; text-transform: uppercase; }
    td { padding: 8px; border-bottom: 1px solid #dfe2e6; }
    .num { text-align: right; }
    .vacio { color: #636c77; text-align: center; }
    .totales { width: 260px; margin: 16px 0 0 auto; }
    .totales div { display: flex; justify-content: space-between; padding: 3px 0; }
    .totales .total { margin-top: 4px; padding-top: 6px; border-top: 2px solid #134455; font-size: 15px; font-weight: 700; }
    @media print { body { margin: 0; } }
</style>
</head>
<body>
    <header>
        <div><h1>VERAMOTORS S.A.C.</h1><div>Orden de Compra</div></div>
        <h2>${escapar(orden.codigo_compra)}</h2>
    </header>
    <div class="datos">
        <div><span>Proveedor:</span> ${escapar(proveedor?.razon_social || "No registrado")}</div>
        <div><span>Fecha de emisión:</span> ${escapar(new Date(orden.fecha_compra).toLocaleDateString("es-PE"))}</div>
        <div><span>RUC:</span> ${escapar(proveedor?.ruc || "No registrado")}</div>
        <div><span>Estado:</span> ${escapar(orden.estado)}</div>
    </div>
    <table>
        <thead>
            <tr><th>Código</th><th>Descripción</th><th class="num">Cant.</th><th class="num">Costo unit.</th><th class="num">Importe</th></tr>
        </thead>
        <tbody>${filas}</tbody>
    </table>
    <div class="totales">
        <div><span>Subtotal</span><span>${moneda(orden.subtotal)}</span></div>
        <div><span>IGV</span><span>${moneda(orden.impuestos)}</span></div>
        <div class="total"><span>Total</span><span>${moneda(orden.total)}</span></div>
    </div>
</body>
</html>`);
    ventana.document.close();
    ventana.focus();
    ventana.print();
    return true;
}
