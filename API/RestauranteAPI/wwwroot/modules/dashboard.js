// Dashboard Module - Versión corregida
(function() {
// Dashboard Module
    window.loadDashboard = async function() {
        if (window.permisosManager && window.permisosManager.isMesero()) {
            // Cargar versión simplificada para meseros
            return;
        }

        const content = document.getElementById('contentArea');
        
        // Cargar datos
        const [mesas, reservas, pedidos, clientes] = await Promise.all([
            app.loadTableData('mesa'),
            app.loadTableData('reserva'),
            app.loadTableData('pedido'),
            app.loadTableData('cliente')
        ]);
        
        // Almacenar datos de mesas globalmente para usar en funciones
        window.mesasData = mesas;
        
        const pedidosHoy = pedidos.filter(p => {
            const hoy = new Date().toDateString();
            return p.FECHA_PEDIDO && new Date(p.FECHA_PEDIDO).toDateString() === hoy;
        }).length;
        
        const totalVentas = await calcularVentas();
        
        // Agregar estilos CSS directamente
        const styles = document.createElement('style');
        styles.textContent = `
            /* Estilos para el dashboard */
            .dashboard-column {
                display: flex;
                flex-direction: column;
                gap: 20px;
                height: 100%;
            }
            
            .dashboard-tabs {
                background: var(--surface);
                border-radius: 12px;
                border: 1px solid var(--surface-high);
                overflow: hidden;
            }
            
            .tab-buttons {
                display: flex;
                background: var(--surface-high);
                border-bottom: 1px solid var(--surface);
            }
            
            .tab-btn {
                flex: 1;
                padding: 15px 20px;
                background: transparent;
                border: none;
                color: var(--text-secondary);
                font-family: inherit;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .tab-btn:hover {
                background: var(--surface);
                color: var(--primary);
            }
            
            .tab-btn.active {
                background: var(--surface);
                color: var(--primary);
                border-bottom: 2px solid var(--primary);
            }
            
            .tab-content {
                display: none;
                padding: 20px;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .layout-controls {
                display: flex;
                align-items: center;
                gap: 15px;
                flex-wrap: wrap;
            }
            
            .legend {
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 0.85rem;
                color: var(--text-secondary);
            }
            
            .legend-color {
                width: 12px;
                height: 12px;
                border-radius: 2px;
            }
            
            .legend-color.available {
                background: var(--success);
            }
            
            .legend-color.occupied {
                background: var(--error);
            }
            
            .legend-color.reserved {
                background: var(--warning);
            }
            
            .restaurant-layout-editable {
                background: var(--surface);
                border-radius: 12px;
                border: 1px solid var(--surface-high);
                padding: 20px;
                height: 600px;
                position: relative;
                overflow: hidden;
            }
            
            .layout-canvas {
                width: 100%;
                height: 100%;
                position: relative;
            }
            
            .layout-background {
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, var(--background) 25%, transparent 25%),
                            linear-gradient(-45deg, var(--background) 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, var(--background) 75%),
                            linear-gradient(-45deg, transparent 75%, var(--background) 75%);
                background-size: 20px 20px;
                background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                border-radius: 8px;
                position: relative;
                overflow: hidden;
            }
            
            .restaurant-grid {
                width: 100%;
                height: 100%;
                position: relative;
            }
            
            .mesa-draggable {
                position: absolute;
                width: 80px;
                height: 80px;
                cursor: move;
                transition: all 0.2s ease;
                z-index: 10;
            }
            
            .mesa-draggable:hover {
                transform: scale(1.05);
                z-index: 20;
            }
            
            .mesa-draggable.selected {
                outline: 3px solid var(--primary);
                outline-offset: 2px;
                z-index: 30;
            }
            
            .mesa-draggable.dragging {
                z-index: 100;
                opacity: 0.9;
                transform: scale(1.1);
            }
            
            .mesa-content {
                width: 100%;
                height: 100%;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .mesa-draggable.available .mesa-content {
                background: var(--success);
            }
            
            .mesa-draggable.occupied .mesa-content {
                background: var(--error);
            }
            
            .mesa-draggable.reserved .mesa-content {
                background: var(--warning);
            }
            
            .mesa-number {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--text-primary);
            }
            
            .mesa-capacity {
                font-size: 0.8rem;
                color: var(--text-primary);
                opacity: 0.9;
            }
            
            .mesa-status-icon {
                position: absolute;
                top: 5px;
                right: 5px;
                font-size: 0.8rem;
                color: var(--text-primary);
                opacity: 0.8;
            }
            
            .mesa-drag-handle {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.3);
                color: var(--text-primary);
                text-align: center;
                padding: 2px;
                font-size: 0.7rem;
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
                cursor: move;
                opacity: 0;
                transition: opacity 0.2s;
            }
            
            .mesa-draggable:hover .mesa-drag-handle {
                opacity: 1;
            }
            
            .mesa-detalles-container {
                background: var(--surface);
                border-radius: 12px;
                border: 1px solid var(--surface-high);
                padding: 20px;
                min-height: 300px;
            }
            
            .placeholder-message {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--text-secondary);
                text-align: center;
                padding: 40px;
            }
            
            .placeholder-message i {
                font-size: 3rem;
                margin-bottom: 15px;
                color: var(--primary);
                opacity: 0.5;
            }
            
            .mesa-detalles-card {
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .mesa-detalles-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--surface-high);
            }
            
            .mesa-detalles-header h3 {
                color: var(--primary);
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0;
            }
            
            .mesa-detalles-body {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid var(--surface-high);
            }
            
            .detail-label {
                color: var(--text-secondary);
                font-size: 0.9rem;
            }
            
            .detail-value {
                color: var(--text-primary);
                font-weight: 500;
            }
            
            .mesa-reservas,
            .mesa-pedidos {
                margin-top: 15px;
                padding: 15px;
                background: var(--surface-high);
                border-radius: 8px;
            }
            
            .mesa-reservas h4,
            .mesa-pedidos h4 {
                color: var(--primary);
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 1rem;
                margin-top: 0;
            }
            
            .reserva-item,
            .plato-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .reserva-item:last-child,
            .plato-item:last-child {
                border-bottom: none;
            }
            
            .reserva-time,
            .reserva-cliente {
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            
            .pedido-info {
                margin-top: 10px;
            }
            
            .pedido-id {
                color: var(--primary);
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .pedido-detalles {
                max-height: 200px;
                overflow-y: auto;
            }
            
            .mesa-acciones {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 20px;
            }
            
            .btn-block {
                width: 100%;
                text-align: center;
            }
            
            .status-warning {
                background: rgba(255, 152, 0, 0.2);
                color: var(--warning);
                border: 1px solid var(--warning);
            }
            
            .empty-state {
                text-align: center;
                padding: 40px;
                color: var(--text-secondary);
            }
            
            .empty-state i {
                font-size: 3rem;
                margin-bottom: 15px;
                color: var(--primary);
                opacity: 0.5;
            }
            
            .empty-state.error i {
                color: var(--error);
            }
            
            .empty-state p {
                margin: 0;
            }
            
            .btn-sm {
                padding: 6px 12px;
                font-size: 0.85rem;
            }
            
            @media (max-width: 1200px) {
                .grid-2 {
                    grid-template-columns: 1fr;
                }
                
                .restaurant-layout-editable {
                    height: 500px;
                }
            }
            
            @media (max-width: 768px) {
                .section-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .layout-controls {
                    width: 100%;
                    justify-content: space-between;
                }
                
                .mesa-draggable {
                    width: 70px;
                    height: 70px;
                }
                
                .mesa-number {
                    font-size: 1.3rem;
                }
            }
        `;
        document.head.appendChild(styles);
        
        content.innerHTML = `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chair"></i>
                    </div>
                    <h3 class="stat-value">${mesas.length}</h3>
                    <p class="stat-label">Mesas Registradas</p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <h3 class="stat-value">${reservas.length}</h3>
                    <p class="stat-label">Reservas Activas</p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <h3 class="stat-value">${pedidosHoy}</h3>
                    <p class="stat-label">Pedidos Hoy</p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3 class="stat-value">${clientes.length}</h3>
                    <p class="stat-label">Clientes</p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <h3 class="stat-value">${await countPlatos()}</h3>
                    <p class="stat-label">Platos Disponibles</p>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <h3 class="stat-value">$${totalVentas}</h3>
                    <p class="stat-label">Ventas Totales</p>
                </div>
            </div>
            
            <div class="grid-2">
                <div class="dashboard-column">
                    <div class="dashboard-tabs">
                        <div class="tab-buttons">
                            <button class="tab-btn active" onclick="mostrarTabDashboard('pedidos-activos')">
                                <i class="fas fa-clipboard-list"></i> Pedidos Activos
                            </button>
                            <button class="tab-btn" onclick="mostrarTabDashboard('platos-disponibles')">
                                <i class="fas fa-utensils"></i> Platos Disponibles
                            </button>
                        </div>
                        
                        <div class="tab-content active" id="pedidos-activos">
                            <h3 class="section-title">Pedidos en Curso</h3>
                            <div class="data-table">
                                ${await renderPedidosActivos()}
                            </div>
                        </div>
                        
                        <div class="tab-content" id="platos-disponibles">
                            <h3 class="section-title">Menú Disponible</h3>
                            <div class="data-table">
                                ${await renderPlatosDisponibles()}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mesa-detalles-container" id="mesaDetallesContainer">
                        <div class="placeholder-message">
                            <i class="fas fa-mouse-pointer"></i>
                            <p>Selecciona una mesa para ver sus detalles</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="section-header">
                        <h3 class="section-title">Restaurante - Disposición de Mesas</h3>
                        <div class="layout-controls">
                            <button class="btn btn-secondary btn-sm" onclick="guardarUbicacionesMesas()" id="guardarUbicacionesBtn">
                                <i class="fas fa-save"></i> Guardar Ubicaciones
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="restaurarUbicacionesMesas()">
                                <i class="fas fa-undo"></i> Restaurar
                            </button>
                            <div class="legend">
                                <div class="legend-item">
                                    <div class="legend-color available"></div>
                                    <span>Disponible</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color occupied"></div>
                                    <span>Ocupado</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color reserved"></div>
                                    <span>Reservado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="restaurant-layout-editable">
                        <div class="layout-canvas" id="layoutCanvas">
                            ${await renderLayoutEditable()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Inicializar funcionalidad de arrastre después de cargar el layout
        setTimeout(() => {
            inicializarArrastreMesas();
            cargarUbicacionesGuardadas();
        }, 100);
    };

    async function calcularVentas() {
        try {
            const facturas = await app.loadTableData('factura');
            return facturas.reduce((sum, f) => sum + (f.TOTAL || 0), 0).toFixed(2);
        } catch {
            return '0.00';
        }
    }

    async function countPlatos() {
        try {
            const platos = await app.loadTableData('plato');
            return platos.length;
        } catch {
            return 0;
        }
    }

    async function renderPedidosActivos() {
        try {
            const pedidos = await app.loadTableData('pedido');
            const hoy = new Date().toDateString();
            
            const pedidosActivos = pedidos.filter(p => {
                const fechaPedido = p.FECHA_PEDIDO ? new Date(p.FECHA_PEDIDO).toDateString() : '';
                return fechaPedido === hoy;
            }).slice(-10).reverse(); // Últimos 10 pedidos de hoy
            
            if (pedidosActivos.length === 0) {
                return `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No hay pedidos activos hoy</p>
                    </div>
                `;
            }
            
            // Obtener detalles de mesas y meseros
            const [mesas, meseros] = await Promise.all([
                app.loadTableData('mesa'),
                app.loadTableData('mesero')
            ]);
            
            return `
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Mesa</th>
                            <th>Mesero</th>
                            <th>Hora</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidosActivos.map(p => {
                            const mesa = mesas.find(m => m.ID_MESA === p.ID_MESA);
                            const mesero = meseros.find(m => m.ID_MESERO === p.ID_MESERO);
                            const hora = p.HORA_PEDIDO || '';
                            
                            return `
                                <tr>
                                    <td><strong>#${p.ID_PEDIDO}</strong></td>
                                    <td>${mesa ? `Mesa ${mesa.NUMERO}` : 'N/A'}</td>
                                    <td>${mesero ? mesero.NOMBRE?.split(' ')[0] || mesero.NOMBRE : 'N/A'}</td>
                                    <td>${hora.substring(0, 5)}</td>
                                    <td>
                                        <span class="status-badge status-active">Activo</span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Error renderizando pedidos activos:', error);
            return `
                <div class="empty-state error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error cargando pedidos</p>
                </div>
            `;
        }
    }

    async function renderPlatosDisponibles() {
        try {
            const [platos, categorias] = await Promise.all([
                app.loadTableData('plato'),
                app.loadTableData('categoria')
            ]);
            
            if (platos.length === 0) {
                return `
                    <div class="empty-state">
                        <i class="fas fa-utensils"></i>
                        <p>No hay platos disponibles</p>
                    </div>
                `;
            }
            
            return `
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${platos.slice(-15).map(p => {
                            const categoria = categorias.find(c => c.ID_CATEGORIA === p.ID_CATEGORIA);
                            return `
                                <tr>
                                    <td>${p.NOMBRE || 'Sin nombre'}</td>
                                    <td>${categoria ? categoria.NOMBRE : 'General'}</td>
                                    <td><strong>$${(p.PRECIO || 0).toFixed(2)}</strong></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Error renderizando platos:', error);
            return `
                <div class="empty-state error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error cargando platos</p>
                </div>
            `;
        }
    }

    async function renderLayoutEditable() {
        try {
            const [mesas, reservas, pedidos, facturas] = await Promise.all([
                app.loadTableData('mesa'),
                app.loadTableData('reserva'),
                app.loadTableData('pedido'),
                app.loadTableData('factura') // AGREGAR FACTURAS
            ]);
            
            const hoy = new Date().toDateString();
            
            // Determinar estado de cada mesa
            const mesasConEstado = mesas.map(mesa => {
                let estado = 'available'; // disponible por defecto
                let tooltip = `Mesa ${mesa.NUMERO} - ${mesa.CAPACIDAD} pers.`;
                
                // Buscar pedidos activos de hoy para esta mesa
                const pedidosMesaHoy = pedidos.filter(p => {
                    const fechaPedido = p.FECHA_PEDIDO ? new Date(p.FECHA_PEDIDO).toDateString() : '';
                    return p.ID_MESA === mesa.ID_MESA && fechaPedido === hoy;
                });
                
                // Verificar si algún pedido NO está facturado
                let tienePedidoNoFacturado = false;
                
                pedidosMesaHoy.forEach(pedido => {
                    // Buscar si este pedido tiene factura
                    const tieneFactura = facturas.some(f => f.ID_PEDIDO === pedido.ID_PEDIDO);
                    
                    // Si el pedido NO está facturado, la mesa está ocupada
                    if (!tieneFactura) {
                        tienePedidoNoFacturado = true;
                    }
                });
                
                if (tienePedidoNoFacturado) {
                    estado = 'occupied';
                    tooltip += ' - OCUPADA (pedido sin facturar)';
                } else if (pedidosMesaHoy.length > 0) {
                    // Si tiene pedidos pero todos están facturados
                    estado = 'available';
                    tooltip += ' - DISPONIBLE (pedidos facturados)';
                }
                
                // Verificar si tiene reserva hoy
                const tieneReserva = reservas.some(r => {
                    const fechaReserva = r.FECHA_RESERVA ? new Date(r.FECHA_RESERVA).toDateString() : '';
                    return r.ID_MESA === mesa.ID_MESA && fechaReserva === hoy;
                });
                
                if (tieneReserva && !tienePedidoNoFacturado) {
                    estado = 'reserved';
                    tooltip += ' - RESERVADA';
                }
                
                return {
                    ...mesa,
                    estado,
                    tooltip
                };
            });
            
            // Resto del código se mantiene igual...
            let html = `
                <div class="layout-background">
                    <div class="restaurant-grid" id="restaurantGrid">
            `;
            
            // Renderizar mesas como elementos arrastrables
            mesasConEstado.forEach(mesa => {
                const posX = mesa.POS_X || 50;
                const posY = mesa.POS_Y || 50;
                
                html += `
                    <div class="mesa-draggable ${mesa.estado}" 
                        id="mesa-${mesa.ID_MESA}"
                        data-mesa-id="${mesa.ID_MESA}"
                        data-mesa-numero="${mesa.NUMERO}"
                        data-mesa-capacidad="${mesa.CAPACIDAD}"
                        style="left: ${posX}px; top: ${posY}px;"
                        title="${mesa.tooltip}"
                        onclick="mostrarDetallesMesa(${mesa.ID_MESA}, event)">
                        <div class="mesa-content">
                            <div class="mesa-number">${mesa.NUMERO}</div>
                            <div class="mesa-capacity">${mesa.CAPACIDAD} <i class="fas fa-user"></i></div>
                            <div class="mesa-status-icon">
                                ${mesa.estado === 'occupied' ? '<i class="fas fa-users"></i>' : 
                                mesa.estado === 'reserved' ? '<i class="fas fa-calendar-alt"></i>' : 
                                '<i class="fas fa-check"></i>'}
                            </div>
                        </div>
                        <div class="mesa-drag-handle">
                            <i class="fas fa-arrows-alt"></i>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
            
            return html;
            
        } catch (error) {
            console.error('Error renderizando layout:', error);
            return `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error cargando disposición de mesas</p>
                </div>
            `;
        }
    }

    // Funciones para manejar pestañas
    window.mostrarTabDashboard = function(tabId) {
        // Ocultar todos los tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remover clase active de todos los botones
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar tab seleccionado
        document.getElementById(tabId).classList.add('active');
        
        // Activar botón correspondiente
        event.target.classList.add('active');
    };

    // Inicializar funcionalidad de arrastre
    function inicializarArrastreMesas() {
        const mesas = document.querySelectorAll('.mesa-draggable');
        
        mesas.forEach(mesa => {
            const handle = mesa.querySelector('.mesa-drag-handle');
            
            // Hacer la mesa arrastrable por el handle
            makeDraggable(mesa, handle);
        });
    }

    function makeDraggable(element, handle) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        // Evento para iniciar arrastre
        handle.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDragTouch);
        
        function startDrag(e) {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            
            startX = e.clientX;
            startY = e.clientY;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            
            element.classList.add('dragging');
        }
        
        function startDragTouch(e) {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;
            
            document.addEventListener('touchmove', dragTouch);
            document.addEventListener('touchend', stopDrag);
            
            element.classList.add('dragging');
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            const newX = initialX + dx;
            const newY = initialY + dy;
            
            // Limitar dentro del contenedor
            const container = document.getElementById('restaurantGrid');
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            const maxX = containerRect.width - elementRect.width;
            const maxY = containerRect.height - elementRect.height;
            
            element.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
            element.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        }
        
        function dragTouch(e) {
            if (!isDragging) return;
            
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            const newX = initialX + dx;
            const newY = initialY + dy;
            
            // Limitar dentro del contenedor
            const container = document.getElementById('restaurantGrid');
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            const maxX = containerRect.width - elementRect.width;
            const maxY = containerRect.height - elementRect.height;
            
            element.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
            element.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        }
        
        function stopDrag() {
            isDragging = false;
            element.classList.remove('dragging');
            
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', dragTouch);
            document.removeEventListener('touchend', stopDrag);
            
            // Guardar posición temporalmente
            guardarPosicionTemporal(element);
        }
    }

    function guardarPosicionTemporal(element) {
        const mesaId = element.dataset.mesaId;
        const posX = parseInt(element.style.left);
        const posY = parseInt(element.style.top);
        
        // Guardar en localStorage temporalmente
        const posicionesTemporales = JSON.parse(localStorage.getItem('mesasPosicionesTemp') || '{}');
        posicionesTemporales[mesaId] = { posX, posY };
        localStorage.setItem('mesasPosicionesTemp', JSON.stringify(posicionesTemporales));
        
        // Activar botón de guardar
        const guardarBtn = document.getElementById('guardarUbicacionesBtn');
        if (guardarBtn) {
            guardarBtn.classList.add('btn-primary');
            guardarBtn.classList.remove('btn-secondary');
        }
    }

    window.guardarUbicacionesMesas = async function() {
        const posicionesTemporales = JSON.parse(localStorage.getItem('mesasPosicionesTemp') || '{}');
        
        if (Object.keys(posicionesTemporales).length === 0) {
            app.showToast('No hay cambios para guardar', 'warning');
            return;
        }
        
        try {
            const btn = document.getElementById('guardarUbicacionesBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            btn.disabled = true;
            
            // Actualizar cada mesa
            for (const [mesaId, posicion] of Object.entries(posicionesTemporales)) {
                const mesa = await app.fetchData(`mesa/${mesaId}`);
                
                if (mesa) {
                    const datosActualizados = {
                        ...mesa,
                        POS_X: posicion.posX,
                        POS_Y: posicion.posY
                    };
                    
                    await app.fetchData(`mesa/${mesaId}`, 'PUT', datosActualizados);
                }
            }
            
            // Limpiar posiciones temporales
            localStorage.removeItem('mesasPosicionesTemp');
            
            // Restaurar botón
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar Ubicaciones';
            btn.disabled = false;
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            
            app.showToast('Ubicaciones de mesas guardadas correctamente', 'success');
            
        } catch (error) {
            console.error('Error guardando ubicaciones:', error);
            app.showToast('Error al guardar ubicaciones', 'error');
            
            // Restaurar botón
            const btn = document.getElementById('guardarUbicacionesBtn');
            btn.innerHTML = '<i class="fas fa-save"></i> Guardar Ubicaciones';
            btn.disabled = false;
        }
    };

    window.restaurarUbicacionesMesas = function() {
        if (confirm('¿Restaurar ubicaciones originales de las mesas?')) {
            localStorage.removeItem('mesasPosicionesTemp');
            cargarUbicacionesGuardadas();
            app.showToast('Ubicaciones restauradas', 'info');
        }
    };

    function cargarUbicacionesGuardadas() {
        const mesas = document.querySelectorAll('.mesa-draggable');
        
        mesas.forEach(mesa => {
            const mesaId = mesa.dataset.mesaId;
            const mesaData = window.mesasData?.find(m => m.ID_MESA == mesaId);
            
            if (mesaData && mesaData.POS_X && mesaData.POS_Y) {
                mesa.style.left = `${mesaData.POS_X}px`;
                mesa.style.top = `${mesaData.POS_Y}px`;
            } else {
                // Posición por defecto
                mesa.style.left = '50px';
                mesa.style.top = '50px';
            }
        });
        
        // Restaurar botón de guardar
        const btn = document.getElementById('guardarUbicacionesBtn');
        if (btn) {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        }
    }

    window.mostrarDetallesMesa = async function(mesaId, event) {
        // Evitar que el clic active el arrastre
        if (event) event.stopPropagation();
        
        try {
            // Obtener datos de la mesa
            const mesa = await app.fetchData(`mesa/${mesaId}`);
            const [reservas, pedidos, facturas] = await Promise.all([
                app.loadTableData('reserva'),
                app.loadTableData('pedido'),
                app.loadTableData('factura') // AGREGAR
            ]);
            
            const hoy = new Date().toDateString();
            
            // Buscar reservas para hoy
            const reservasHoy = reservas.filter(r => {
                const fechaReserva = r.FECHA_RESERVA ? new Date(r.FECHA_RESERVA).toDateString() : '';
                return r.ID_MESA == mesaId && fechaReserva === hoy;
            });
            
            // Buscar pedidos de hoy para esta mesa
            const pedidosHoy = pedidos.filter(p => {
                const fechaPedido = p.FECHA_PEDIDO ? new Date(p.FECHA_PEDIDO).toDateString() : '';
                return p.ID_MESA == mesaId && fechaPedido === hoy;
            });
            
            // Determinar estado CORREGIDO
            let estado = 'Disponible';
            let estadoClass = 'status-active';
            
            // Verificar si hay pedidos NO facturados
            let tienePedidosActivos = false;
            let pedidoActivo = null;
            
            for (const pedido of pedidosHoy) {
                const tieneFactura = facturas.some(f => f.ID_PEDIDO == pedido.ID_PEDIDO);
                
                if (!tieneFactura) {
                    tienePedidosActivos = true;
                    pedidoActivo = pedido;
                    break;
                }
            }
            
            if (tienePedidosActivos) {
                estado = 'Ocupada';
                estadoClass = 'status-inactive';
            } else if (reservasHoy.length > 0) {
                estado = 'Reservada';
                estadoClass = 'status-warning';
            } else if (pedidosHoy.length > 0) {
                // Tiene pedidos pero todos están facturados
                estado = 'Disponible';
                estadoClass = 'status-active';
            }
            
            // Obtener detalles del pedido activo si existe
            let detallesPedido = null;
            if (pedidoActivo) {
                try {
                    detallesPedido = await app.fetchData(`detallepedido/pedido/${pedidoActivo.ID_PEDIDO}`);
                } catch {
                    detallesPedido = [];
                }
            }
            
            // Renderizar detalles (resto del código se mantiene igual)...
            const container = document.getElementById('mesaDetallesContainer');
            container.innerHTML = `
                <div class="mesa-detalles-card">
                    <div class="mesa-detalles-header">
                        <h3>
                            <i class="fas fa-chair"></i>
                            Mesa ${mesa.NUMERO}
                        </h3>
                        <span class="status-badge ${estadoClass}">${estado}</span>
                    </div>
                    
                    <div class="mesa-detalles-body">
                        <div class="detail-row">
                            <span class="detail-label">Capacidad:</span>
                            <span class="detail-value">${mesa.CAPACIDAD} personas</span>
                        </div>
                        
                        <div class="detail-row">
                            <span class="detail-label">Ubicación:</span>
                            <span class="detail-value">X: ${mesa.POS_X || 50}, Y: ${mesa.POS_Y || 50}</span>
                        </div>
                        
                        <!-- Mostrar información sobre pedidos -->
                        ${pedidosHoy.length > 0 ? `
                            <div class="detail-row">
                                <span class="detail-label">Pedidos hoy:</span>
                                <span class="detail-value">
                                    ${pedidosHoy.length} (${pedidosHoy.filter(p => 
                                        facturas.some(f => f.ID_PEDIDO == p.ID_PEDIDO)).length} facturados)
                                </span>
                            </div>
                        ` : ''}
                        
                        ${reservasHoy.length > 0 ? `
                            <div class="mesa-reservas">
                                <h4><i class="fas fa-calendar-alt"></i> Reservas Hoy</h4>
                                ${reservasHoy.map(r => `
                                    <div class="reserva-item">
                                        <div class="reserva-time">
                                            <i class="fas fa-clock"></i> ${r.HORA_RESERVA || 'N/A'}
                                        </div>
                                        <div class="reserva-cliente">
                                            Cliente: ${r.ID_CLIENTE || 'N/A'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${pedidoActivo ? `
                            <div class="mesa-pedidos">
                                <h4><i class="fas fa-clipboard-list"></i> Pedido Activo</h4>
                                <div class="pedido-info">
                                    <div class="pedido-id">Pedido #${pedidoActivo.ID_PEDIDO}</div>
                                    ${pedidoActivo.ESTADO ? `<div><strong>Estado:</strong> ${pedidoActivo.ESTADO}</div>` : ''}
                                    ${detallesPedido && detallesPedido.length > 0 ? `
                                        <div class="pedido-detalles">
                                            <strong>Platos:</strong>
                                            ${detallesPedido.map(d => `
                                                <div class="plato-item">
                                                    <span>Plato ${d.ID_PLATO}</span>
                                                    <span>${d.CANTIDAD} x $${(d.PRECIO_UNITARIO || 0).toFixed(2)}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Mostrar pedidos ya facturados -->
                        ${pedidosHoy.filter(p => facturas.some(f => f.ID_PEDIDO == p.ID_PEDIDO)).length > 0 ? `
                            <div class="mesa-pedidos">
                                <h4><i class="fas fa-receipt"></i> Pedidos Facturados Hoy</h4>
                                ${pedidosHoy.filter(p => facturas.some(f => f.ID_PEDIDO == p.ID_PEDIDO)).map(p => `
                                    <div class="reserva-item">
                                        <span>Pedido #${p.ID_PEDIDO}</span>
                                        <span class="status-badge status-active">Facturado</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${estado === 'Disponible' ? `
                            <div class="mesa-acciones">
                                <button class="btn btn-primary btn-block" onclick="crearPedidoMesa(${mesaId})">
                                    <i class="fas fa-plus"></i> Crear Pedido
                                </button>
                                <button class="btn btn-secondary btn-block" onclick="crearReservaMesa(${mesaId})">
                                    <i class="fas fa-calendar-plus"></i> Reservar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            // Resaltar mesa seleccionada
            document.querySelectorAll('.mesa-draggable').forEach(m => {
                m.classList.remove('selected');
            });
            const mesaElement = document.getElementById(`mesa-${mesaId}`);
            if (mesaElement) {
                mesaElement.classList.add('selected');
            }
            
        } catch (error) {
            console.error('Error cargando detalles de mesa:', error);
            const container = document.getElementById('mesaDetallesContainer');
            container.innerHTML = `
                <div class="mesa-detalles-card error">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error cargando detalles</p>
                    </div>
                </div>
            `;
        }
    };

    // Función para actualizar estado de mesas automáticamente
    window.actualizarEstadoMesas = async function() {
        try {
            console.log('Actualizando estado de mesas...');
            
            // Recargar datos
            const [mesas, pedidos, facturas] = await Promise.all([
                app.loadTableData('mesa'),
                app.loadTableData('pedido'),
                app.loadTableData('factura')
            ]);
            
            const hoy = new Date().toDateString();
            
            // Actualizar visualmente cada mesa en el dashboard
            mesas.forEach(async mesa => {
                const pedidosMesaHoy = pedidos.filter(p => {
                    const fechaPedido = p.FECHA_PEDIDO ? new Date(p.FECHA_PEDIDO).toDateString() : '';
                    return p.ID_MESA === mesa.ID_MESA && fechaPedido === hoy;
                });
                
                // Verificar si algún pedido NO está facturado
                let tienePedidoNoFacturado = false;
                
                pedidosMesaHoy.forEach(pedido => {
                    const tieneFactura = facturas.some(f => f.ID_PEDIDO === pedido.ID_PEDIDO);
                    if (!tieneFactura) {
                        tienePedidoNoFacturado = true;
                    }
                });
                
                // Actualizar elemento visual de la mesa
                const mesaElement = document.getElementById(`mesa-${mesa.ID_MESA}`);
                if (mesaElement) {
                    const nuevaClase = tienePedidoNoFacturado ? 'occupied' : 'available';
                    const claseAnterior = mesaElement.className.split(' ').find(c => 
                        c === 'available' || c === 'occupied' || c === 'reserved');
                    
                    if (claseAnterior !== nuevaClase) {
                        mesaElement.classList.remove(claseAnterior);
                        mesaElement.classList.add(nuevaClase);
                        
                        // Actualizar icono de estado
                        const iconElement = mesaElement.querySelector('.mesa-status-icon');
                        if (iconElement) {
                            iconElement.innerHTML = tienePedidoNoFacturado ? 
                                '<i class="fas fa-users"></i>' : 
                                '<i class="fas fa-check"></i>';
                        }
                        
                        console.log(`Mesa ${mesa.NUMERO} actualizada a: ${nuevaClase}`);
                    }
                }
            });
            
            console.log('Estado de mesas actualizado');
            
        } catch (error) {
            console.error('Error actualizando estado de mesas:', error);
        }
    };

    window.crearPedidoMesa = async function(mesaId) {
        try {
            console.log(`Verificando estado de mesa #${mesaId} antes de crear pedido...`);
            
            // Verificar si la mesa está ocupada
            const pedidos = await app.fetchData('pedido');
            const hoy = new Date().toDateString();
            
            const pedidosMesaHoy = pedidos.filter(p => {
                if (p.ID_MESA != mesaId) return false;
                const fechaPedido = p.FECHA_PEDIDO ? new Date(p.FECHA_PEDIDO).toDateString() : '';
                return fechaPedido === hoy;
            });
            
            if (pedidosMesaHoy.length > 0) {
                // Verificar facturas
                let facturas = [];
                try {
                    facturas = await app.fetchData('factura');
                } catch (error) {
                    console.warn('Error obteniendo facturas:', error);
                }
                
                const tienePedidosNoFacturados = pedidosMesaHoy.some(p => 
                    !facturas.some(f => f.ID_PEDIDO == p.ID_PEDIDO)
                );
                
                if (tienePedidosNoFacturados) {
                    // Mostrar alerta
                    if (confirm(`⚠️ La Mesa #${mesaId} ya tiene pedidos activos.\n\n¿Deseas ver los detalles de los pedidos existentes?`)) {
                        // Navegar a pedidos y mostrar modal
                        app.navigateTo('pedidos');
                        setTimeout(() => {
                            if (typeof mostrarModalMesaOcupada === 'function') {
                                mostrarModalMesaOcupada(mesaId, []);
                            }
                        }, 1000);
                    }
                    return;
                }
            }
            
            // Si la mesa está disponible, proceder
            app.navigateTo('pedidos');
            
            setTimeout(() => {
                if (typeof mostrarFormularioPedido === 'function') {
                    mostrarFormularioPedido();
                    
                    setTimeout(() => {
                        const selectMesa = document.getElementById('selectMesa');
                        if (selectMesa) {
                            selectMesa.value = mesaId;
                            app.showToast(`Mesa #${mesaId} seleccionada`, 'info');
                        }
                    }, 500);
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error verificando mesa:', error);
            app.showToast('Error al verificar estado de la mesa', 'error');
        }
    };

    window.crearReservaMesa = function(mesaId) {
        app.navigateTo('reservas');
        
        setTimeout(() => {
            if (typeof abrirModalReserva === 'function') {
                abrirModalReserva();
                
                // Preseleccionar la mesa en el formulario
                setTimeout(() => {
                    const selectMesaReserva = document.getElementById('mesaReserva');
                    if (selectMesaReserva) {
                        selectMesaReserva.value = mesaId;
                    }
                }, 500);
            }
        }, 1000);
    };

    window.verDetalleMesa = function(idMesa) {
        mostrarDetallesMesa(idMesa);
    };
})();