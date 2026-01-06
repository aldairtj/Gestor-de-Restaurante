// Facturas Module
window.loadFacturas = async function() {
    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div class="table-header">
            <h3>Gestión de Facturas</h3>
            <button class="btn btn-primary" onclick="generarReporte()">
                <i class="fas fa-download"></i> Exportar Reporte
            </button>
        </div>
        
        <div class="table-container">
            <table id="facturasTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Pedido</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Data will be loaded here -->
                </tbody>
            </table>
        </div>
    `;
    
    await cargarFacturas();
};

async function cargarFacturas() {
    try {
        const facturas = await app.fetchData('factura');
        const pedidos = await app.loadTableData('pedido');
        
        const tbody = document.querySelector('#facturasTable tbody');
        
        if (facturas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        No hay facturas registradas
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort by date descending
        facturas.sort((a, b) => new Date(b.FECHA_FACTURA) - new Date(a.FECHA_FACTURA));
        
        tbody.innerHTML = facturas.map(factura => {
            const pedido = pedidos.find(p => p.ID_PEDIDO === factura.ID_PEDIDO);
            
            return `
                <tr>
                    <td>#${factura.ID_FACTURA}</td>
                    <td>${pedido ? `Pedido #${pedido.ID_PEDIDO}` : 'N/A'}</td>
                    <td>${factura.FECHA_FACTURA ? new Date(factura.FECHA_FACTURA).toLocaleDateString('es-ES') : 'N/A'}</td>
                    <td>$${factura.TOTAL ? factura.TOTAL.toFixed(2) : '0.00'}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="verFactura(${factura.ID_FACTURA})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="eliminarFactura(${factura.ID_FACTURA})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        const tbody = document.querySelector('#facturasTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--error);">
                    Error cargando facturas: ${error.message}
                </td>
            </tr>
        `;
    }
}

window.verFactura = async function(id) {
    try {
        const factura = await app.fetchData(`factura/${id}`);
        const pedido = factura.ID_PEDIDO ? await app.fetchData(`pedido/${factura.ID_PEDIDO}`) : null;
        const detalles = factura.ID_PEDIDO ? await app.fetchData(`detallepedido/pedido/${factura.ID_PEDIDO}`) : [];
        
        let contenido = `
            <h3>Factura #${factura.ID_FACTURA}</h3>
            <p><strong>Fecha:</strong> ${new Date(factura.FECHA_FACTURA).toLocaleDateString('es-ES')}</p>
            ${pedido ? `<p><strong>Pedido:</strong> #${pedido.ID_PEDIDO}</p>` : ''}
            <hr>
            <h4>Detalles:</h4>
        `;
        
        if (detalles.length === 0) {
            contenido += '<p>No hay detalles disponibles</p>';
        } else {
            contenido += `
                <table style="width: 100%; margin: 15px 0;">
                    <thead>
                        <tr>
                            <th>Plato</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detalles.map(d => `
                            <tr>
                                <td>Plato #${d.ID_PLATO}</td>
                                <td>${d.CANTIDAD || 0}</td>
                                <td>$${d.PRECIO_UNITARIO ? d.PRECIO_UNITARIO.toFixed(2) : '0.00'}</td>
                                <td>$${((d.CANTIDAD || 0) * (d.PRECIO_UNITARIO || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        contenido += `
            <hr>
            <p style="text-align: right; font-size: 1.2rem;">
                <strong>TOTAL:</strong> $${factura.TOTAL ? factura.TOTAL.toFixed(2) : '0.00'}
            </p>
        `;
        
        // Create modal for invoice view
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>Factura #${factura.ID_FACTURA}</h3>
                    <button class="btn btn-icon" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${contenido}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Cerrar
                    </button>
                    <button class="btn btn-primary" onclick="imprimirFactura(${id})">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    } catch (error) {
        app.showToast('Error cargando la factura', 'error');
    }
};

window.imprimirFactura = function(id) {
    // In a real implementation, this would open a print dialog
    app.showToast('Funcionalidad de impresión en desarrollo', 'warning');
};

window.eliminarFactura = async function(id) {
    if (!confirm('¿Está seguro de eliminar esta factura?')) {
        return;
    }
    
    try {
        await app.fetchData(`factura/${id}`, 'DELETE');
        app.showToast('Factura eliminada correctamente');
        await cargarFacturas();
    } catch (error) {
        app.showToast('Error eliminando la factura', 'error');
    }
};

window.generarReporte = async function() {
    try {
        const facturas = await app.fetchData('factura');
        
        if (facturas.length === 0) {
            app.showToast('No hay facturas para generar reporte', 'warning');
            return;
        }
        
        // Calculate totals
        const totalVentas = facturas.reduce((sum, f) => sum + (f.TOTAL || 0), 0);
        const promedioVenta = totalVentas / facturas.length;
        
        // Create report content
        const reportContent = `
            REPORTE DE FACTURAS
            ===================
            Fecha de generación: ${new Date().toLocaleDateString('es-ES')}
            
            RESUMEN:
            - Total facturas: ${facturas.length}
            - Total ventas: $${totalVentas.toFixed(2)}
            - Promedio por factura: $${promedioVenta.toFixed(2)}
            
            DETALLE DE FACTURAS:
            ${facturas.map(f => `
            Factura #${f.ID_FACTURA} | Fecha: ${new Date(f.FECHA_FACTURA).toLocaleDateString('es-ES')} | Total: $${f.TOTAL ? f.TOTAL.toFixed(2) : '0.00'}
            `).join('')}
        `;
        
        // Create download link
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_facturas_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        app.showToast('Reporte generado exitosamente');
    } catch (error) {
        app.showToast('Error generando reporte', 'error');
    }
};