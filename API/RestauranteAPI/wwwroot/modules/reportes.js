// Reportes Module
window.loadReportes = async function() {
    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card" onclick="generarReporteVentas()" style="cursor: pointer;">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3>Reporte de Ventas</h3>
                <p class="stat-label">Análisis de ventas por período</p>
            </div>
            
            <div class="stat-card" onclick="generarReporteInventario()" style="cursor: pointer;">
                <div class="stat-icon">
                    <i class="fas fa-boxes"></i>
                </div>
                <h3>Reporte de Inventario</h3>
                <p class="stat-label">Estado actual del inventario</p>
            </div>
            
            <div class="stat-card" onclick="generarReporteClientes()" style="cursor: pointer;">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h3>Reporte de Clientes</h3>
                <p class="stat-label">Clientes frecuentes y hábitos</p>
            </div>
            
            <div class="stat-card" onclick="generarReportePlatos()" style="cursor: pointer;">
                <div class="stat-icon">
                    <i class="fas fa-utensils"></i>
                </div>
                <h3>Reporte de Platos</h3>
                <p class="stat-label">Platos más vendidos</p>
            </div>
        </div>
        
        <div class="section-title">Generar Reporte Personalizado</div>
        
        <div class="restaurant-layout">
            <form id="formReportePersonalizado">
                <div class="grid-2">
                    <div class="form-group">
                        <label class="form-label" for="tipoReporte">Tipo de Reporte</label>
                        <select id="tipoReporte" class="form-control">
                            <option value="ventas">Ventas</option>
                            <option value="inventario">Inventario</option>
                            <option value="clientes">Clientes</option>
                            <option value="pedidos">Pedidos</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="periodoReporte">Período</label>
                        <select id="periodoReporte" class="form-control">
                            <option value="hoy">Hoy</option>
                            <option value="semana">Esta semana</option>
                            <option value="mes">Este mes</option>
                            <option value="personalizado">Personalizado</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid-2" id="fechasPersonalizadas" style="display: none;">
                    <div class="form-group">
                        <label class="form-label" for="fechaInicio">Fecha Inicio</label>
                        <input type="date" id="fechaInicio" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="fechaFin">Fecha Fin</label>
                        <input type="date" id="fechaFin" class="form-control">
                    </div>
                </div>
                
                <div class="form-group">
                    <button type="button" class="btn btn-primary" onclick="generarReportePersonalizado()">
                        <i class="fas fa-download"></i> Generar Reporte
                    </button>
                </div>
            </form>
        </div>
        
        <div class="section-title">Estadísticas Rápidas</div>
        
        <div id="estadisticasContainer" style="margin-top: 20px;">
            <!-- Statistics will be loaded here -->
        </div>
    `;
    
    // Setup event listeners
    document.getElementById('periodoReporte').addEventListener('change', function() {
        const fechasDiv = document.getElementById('fechasPersonalizadas');
        fechasDiv.style.display = this.value === 'personalizado' ? 'grid' : 'none';
    });
    
    // Load statistics
    await cargarEstadisticas();
};

async function cargarEstadisticas() {
    try {
        const [facturas, clientes, platos, pedidos] = await Promise.all([
            app.loadTableData('factura'),
            app.loadTableData('cliente'),
            app.loadTableData('plato'),
            app.loadTableData('pedido')
        ]);
        
        const hoy = new Date().toDateString();
        const ventasHoy = facturas.filter(f => 
            f.FECHA_FACTURA && new Date(f.FECHA_FACTURA).toDateString() === hoy
        );
        
        const totalVentasHoy = ventasHoy.reduce((sum, f) => sum + (f.TOTAL || 0), 0);
        const pedidosHoy = pedidos.filter(p => 
            p.FECHA_PEDIDO && new Date(p.FECHA_PEDIDO).toDateString() === hoy
        );
        
        const container = document.getElementById('estadisticasContainer');
        container.innerHTML = `
            <div class="grid-2">
                <div class="stat-card">
                    <h3>$${totalVentasHoy.toFixed(2)}</h3>
                    <p class="stat-label">Ventas de hoy</p>
                </div>
                
                <div class="stat-card">
                    <h3>${pedidosHoy.length}</h3>
                    <p class="stat-label">Pedidos de hoy</p>
                </div>
                
                <div class="stat-card">
                    <h3>${clientes.length}</h3>
                    <p class="stat-label">Clientes registrados</p>
                </div>
                
                <div class="stat-card">
                    <h3>${platos.length}</h3>
                    <p class="stat-label">Platos en el menú</p>
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById('estadisticasContainer').innerHTML = `
            <div class="loading">
                <p>Error cargando estadísticas: ${error.message}</p>
            </div>
        `;
    }
}

window.generarReporteVentas = async function() {
    try {
        const facturas = await app.fetchData('factura');
        
        if (facturas.length === 0) {
            app.showToast('No hay datos de ventas para reportar', 'warning');
            return;
        }
        
        const totalVentas = facturas.reduce((sum, f) => sum + (f.TOTAL || 0), 0);
        const promedioVenta = totalVentas / facturas.length;
        
        const reporte = `
            REPORTE DE VENTAS
            =================
            Fecha generación: ${new Date().toLocaleDateString('es-ES')}
            Período: Histórico completo
            
            RESUMEN:
            - Total facturas: ${facturas.length}
            - Total ventas: $${totalVentas.toFixed(2)}
            - Promedio por factura: $${promedioVenta.toFixed(2)}
            
            DETALLE POR MES:
            ${agruparVentasPorMes(facturas)}
            
            TOP 10 FACTURAS MÁS ALTAS:
            ${obtenerTopFacturas(facturas)}
        `;
        
        descargarReporte(reporte, 'reporte_ventas');
        app.showToast('Reporte de ventas generado');
    } catch (error) {
        app.showToast('Error generando reporte de ventas', 'error');
    }
};

window.generarReporteInventario = async function() {
    try {
        const ingredientes = await app.fetchData('ingrediente');
        
        if (ingredientes.length === 0) {
            app.showToast('No hay datos de inventario para reportar', 'warning');
            return;
        }
        
        const bajoStock = ingredientes.filter(i => (i.STOCK || 0) < 10);
        
        const reporte = `
            REPORTE DE INVENTARIO
            =====================
            Fecha generación: ${new Date().toLocaleDateString('es-ES')}
            
            RESUMEN:
            - Total ingredientes: ${ingredientes.length}
            - Ingredientes con bajo stock: ${bajoStock.length}
            
            LISTA COMPLETA DE INGREDIENTES:
            ${ingredientes.map(i => `
            ${i.NOMBRE} | Stock: ${i.STOCK || 0} ${i.UNIDAD_MEDIDA || ''} | ${(i.STOCK || 0) < 10 ? '⚠️ BAJO STOCK' : '✅ OK'}
            `).join('')}
            
            INGREDIENTES CON BAJO STOCK (${bajoStock.length}):
            ${bajoStock.map(i => `
            ⚠️ ${i.NOMBRE} - Solo quedan ${i.STOCK || 0} ${i.UNIDAD_MEDIDA || ''}
            `).join('')}
        `;
        
        descargarReporte(reporte, 'reporte_inventario');
        app.showToast('Reporte de inventario generado');
    } catch (error) {
        app.showToast('Error generando reporte de inventario', 'error');
    }
};

window.generarReporteClientes = async function() {
    try {
        const clientes = await app.fetchData('cliente');
        const reservas = await app.fetchData('reserva');
        
        if (clientes.length === 0) {
            app.showToast('No hay datos de clientes para reportar', 'warning');
            return;
        }
        
        const clientesConReservas = clientes.map(cliente => {
            const reservasCliente = reservas.filter(r => r.ID_CLIENTE === cliente.ID_CLIENTE);
            return {
                ...cliente,
                reservas: reservasCliente.length
            };
        }).sort((a, b) => b.reservas - a.reservas);
        
        const reporte = `
            REPORTE DE CLIENTES
            ===================
            Fecha generación: ${new Date().toLocaleDateString('es-ES')}
            
            RESUMEN:
            - Total clientes: ${clientes.length}
            - Clientes con reservas: ${clientesConReservas.filter(c => c.reservas > 0).length}
            
            TOP 10 CLIENTES MÁS FRECUENTES:
            ${clientesConReservas.slice(0, 10).map((c, i) => `
            ${i + 1}. ${c.NOMBRE} - ${c.TELEFONO || 'Sin teléfono'} | Reservas: ${c.reservas}
            `).join('')}
            
            LISTA COMPLETA DE CLIENTES:
            ${clientes.map(c => `
            ${c.NOMBRE} | ${c.TELEFONO || 'Sin teléfono'}
            `).join('')}
        `;
        
        descargarReporte(reporte, 'reporte_clientes');
        app.showToast('Reporte de clientes generado');
    } catch (error) {
        app.showToast('Error generando reporte de clientes', 'error');
    }
};

window.generarReportePlatos = async function() {
    try {
        const platos = await app.fetchData('plato');
        
        if (platos.length === 0) {
            app.showToast('No hay datos de platos para reportar', 'warning');
            return;
        }
        
        const platosOrdenados = [...platos].sort((a, b) => (b.PRECIO || 0) - (a.PRECIO || 0));
        
        const reporte = `
            REPORTE DE PLATOS
            =================
            Fecha generación: ${new Date().toLocaleDateString('es-ES')}
            
            RESUMEN:
            - Total platos: ${platos.length}
            - Rango de precios: $${Math.min(...platos.map(p => p.PRECIO || 0)).toFixed(2)} - $${Math.max(...platos.map(p => p.PRECIO || 0)).toFixed(2)}
            
            PLATOS MÁS CAROS:
            ${platosOrdenados.slice(0, 10).map((p, i) => `
            ${i + 1}. ${p.NOMBRE} - $${(p.PRECIO || 0).toFixed(2)}
            `).join('')}
            
            LISTA COMPLETA DE PLATOS:
            ${platos.map(p => `
            ${p.NOMBRE} | $${(p.PRECIO || 0).toFixed(2)}
            `).join('')}
        `;
        
        descargarReporte(reporte, 'reporte_platos');
        app.showToast('Reporte de platos generado');
    } catch (error) {
        app.showToast('Error generando reporte de platos', 'error');
    }
};

window.generarReportePersonalizado = async function() {
    const tipo = document.getElementById('tipoReporte').value;
    const periodo = document.getElementById('periodoReporte').value;
    
    app.showToast(`Generando reporte ${tipo} para ${periodo}...`, 'warning');
    
    // This is a simplified example. In a real implementation,
    // you would filter data based on the selected period
    setTimeout(() => {
        app.showToast('Reporte generado exitosamente');
    }, 1000);
};

function agruparVentasPorMes(facturas) {
    const ventasPorMes = {};
    
    facturas.forEach(factura => {
        if (factura.FECHA_FACTURA) {
            const fecha = new Date(factura.FECHA_FACTURA);
            const mes = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
            
            if (!ventasPorMes[mes]) {
                ventasPorMes[mes] = 0;
            }
            
            ventasPorMes[mes] += factura.TOTAL || 0;
        }
    });
    
    return Object.entries(ventasPorMes)
        .map(([mes, total]) => `- ${mes}: $${total.toFixed(2)}`)
        .join('\n');
}

function obtenerTopFacturas(facturas) {
    return facturas
        .sort((a, b) => (b.TOTAL || 0) - (a.TOTAL || 0))
        .slice(0, 10)
        .map((f, i) => 
            `${i + 1}. Factura #${f.ID_FACTURA} - $${(f.TOTAL || 0).toFixed(2)}`
        )
        .join('\n');
}

function descargarReporte(contenido, nombre) {
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}