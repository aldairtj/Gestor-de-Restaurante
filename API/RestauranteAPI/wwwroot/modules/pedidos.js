// Pedidos Module - Versión completamente funcional y corregida
window.loadPedidos = async function() {
    if (window.permisosManager && window.permisosManager.isMesero()) {
        // Cargar versión simplificada para meseros
        return;
    }

    console.log('Cargando módulo de pedidos...');
    
    const content = document.getElementById('contentArea');
    if (!content) return;
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <h1>Gestión de Pedidos</h1>
            
            <div style="margin: 20px 0; display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="mostrarFormularioPedido()">
                    <i class="fas fa-plus"></i> Nuevo Pedido
                </button>
                <button class="btn btn-secondary" onclick="cargarListaPedidos()">
                    <i class="fas fa-sync"></i> Refrescar
                </button>
            </div>
            
            <!-- Formulario para crear pedido -->
            <div id="formularioPedido" style="display: none; margin: 30px 0; padding: 25px; background: var(--surface); border-radius: 10px; border: 1px solid var(--surface-high);">
                <h3 style="margin-bottom: 20px; color: var(--primary);">
                    <i class="fas fa-clipboard-list"></i> Nuevo Pedido
                </h3>
                
                <div id="formPedidoContenido">
                    <!-- Se cargará dinámicamente -->
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando formulario...</p>
                    </div>
                </div>
            </div>
            
            <!-- Lista de pedidos -->
            <div id="pedidosList" style="margin-top: 20px;">
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando pedidos...</p>
                </div>
            </div>
        </div>
    `;
    
    await cargarListaPedidos();
};

// Mostrar/ocultar formulario
window.mostrarFormularioPedido = async function() {
    const formulario = document.getElementById('formularioPedido');
    const contenido = document.getElementById('formPedidoContenido');
    
    if (formulario.style.display === 'none') {
        formulario.style.display = 'block';
        await cargarFormularioPedido();
    } else {
        formulario.style.display = 'none';
    }
};

// Cargar formulario con datos dinámicos
async function cargarFormularioPedido() {
    try {
        const contenido = document.getElementById('formPedidoContenido');
        
        // Obtener mesas y meseros disponibles
        const [mesas, meseros] = await Promise.all([
            app.fetchData('mesa'),
            app.fetchData('mesero')
        ]);

        let mesasOcupadas = [];
            try {
                const pedidos = await app.fetchData('pedido');
                const hoy = new Date().toDateString();
                
                const pedidosHoy = pedidos.filter(p => {
                    const fechaPedido = p.FECHA_PEDIDO ? new Date(p.FECHA_PEDIDO).toDateString() : '';
                    return fechaPedido === hoy;
                });
                
                // Verificar cuáles pedidos tienen factura
                const facturas = await app.fetchData('factura');
                
                pedidosHoy.forEach(pedido => {
                    const tieneFactura = facturas.some(f => f.ID_PEDIDO == pedido.ID_PEDIDO);
                    if (!tieneFactura && pedido.ID_MESA) {
                        mesasOcupadas.push(pedido.ID_MESA);
                    }
                });
                
                console.log('Mesas ocupadas hoy:', mesasOcupadas);
            } catch (error) {
                console.warn('Error verificando mesas ocupadas:', error);
            }
        
        // Filtrar meseros activos
        const meserosActivos = meseros.filter(m => m.ACTIVO === true || m.ACTIVO === undefined || m.ACTIVO === 1);
        
        contenido.innerHTML = `
            <form id="formNuevoPedido" onsubmit="event.preventDefault(); crearPedidoDesdeFormulario();">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">
                            <i class="fas fa-chair"></i> Mesa *
                        </label>
                        <select id="selectMesa" required style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--surface-high); background: var(--background); color: var(--text-primary);">
                            <option value="">Seleccione una mesa</option>
                            ${mesas.map(mesa => {
                                const estaOcupada = mesasOcupadas.includes(mesa.ID_MESA);
                                const estadoTexto = estaOcupada ? ' (OCUPADA)' : ' (DISPONIBLE)';
                                const colorEstilo = estaOcupada ? 'color: var(--error); font-weight: bold;' : 'color: var(--success);';
                                
                                return `
                                    <option value="${mesa.ID_MESA}" ${estaOcupada ? 'disabled' : ''} style="${colorEstilo}">
                                        Mesa ${mesa.NUMERO || mesa.ID_MESA} - ${mesa.CAPACIDAD || '?'} pers.${estadoTexto}
                                    </option>
                                `;
                            }).join('')}
                        </select>
                        <div style="margin-top: 5px; font-size: 0.85rem; color: var(--text-secondary);">
                            <i class="fas fa-info-circle"></i> Las mesas marcadas como OCUPADA tienen pedidos activos
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">
                            <i class="fas fa-user-tie"></i> Mesero *
                        </label>
                        <select id="selectMesero" required style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--surface-high); background: var(--background); color: var(--text-primary);">
                            <option value="">Seleccione un mesero</option>
                            ${meserosActivos.map(mesero => `
                                <option value="${mesero.ID_MESERO}">
                                    ${mesero.NOMBRE || 'Sin nombre'} - ${mesero.TURNO || 'Sin turno'}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <!-- Sección para agregar platos al pedido -->
                <div style="margin-bottom: 25px; padding: 15px; background: var(--surface-high); border-radius: 8px;">
                    <h4 style="margin-bottom: 15px; color: var(--primary);">
                        <i class="fas fa-utensils"></i> Agregar Platos al Pedido
                    </h4>
                    
                    <div id="listaPlatosPedido">
                        <!-- Los platos se agregarán dinámicamente aquí -->
                        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                            <i class="fas fa-info-circle"></i>
                            <p>Agregue platos al pedido</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button type="button" class="btn btn-secondary" onclick="agregarPlatoAlPedido()" style="flex: 1;">
                            <i class="fas fa-plus"></i> Agregar Plato
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="limpiarPlatosPedido()">
                            <i class="fas fa-trash"></i> Limpiar
                        </button>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 25px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        <i class="fas fa-check"></i> Crear Pedido
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="mostrarFormularioPedido()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
                
                <div id="mensajeError" style="display: none; margin-top: 15px; padding: 10px; background: var(--error-bg); color: var(--error); border-radius: 5px;"></div>
            </form>
        `;
        
        // Cargar platos para el selector
        await cargarSelectorPlatos();
        
    } catch (error) {
        console.error('Error cargando formulario:', error);
        const contenido = document.getElementById('formPedidoContenido');
        contenido.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--error);">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error al cargar formulario</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="cargarFormularioPedido()">Reintentar</button>
            </div>
        `;
    }
}

// Variable para almacenar platos del pedido
let platosDelPedido = [];
let platosDisponibles = [];

// Cargar selector de platos
async function cargarSelectorPlatos() {
    try {
        platosDisponibles = await app.fetchData('plato');
        
        // Crear modal para seleccionar plato
        const modalPlatos = document.createElement('div');
        modalPlatos.id = 'modalSeleccionPlato';
        modalPlatos.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        `;
        
        modalPlatos.innerHTML = `
            <div style="background: var(--surface); border-radius: 10px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div style="padding: 20px; border-bottom: 1px solid var(--surface-high); display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="color: var(--primary);">
                        <i class="fas fa-utensils"></i> Seleccionar Plato
                    </h3>
                    <button class="btn btn-icon" onclick="cerrarModalSeleccionPlato()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 20px;" id="listaPlatosDisponibles">
                    <!-- Los platos se cargarán aquí -->
                </div>
            </div>
        `;
        
        if (!document.getElementById('modalSeleccionPlato')) {
            document.body.appendChild(modalPlatos);
        }
        
    } catch (error) {
        console.error('Error cargando platos:', error);
        app.showToast('Error cargando lista de platos', 'error');
    }
}

// Cerrar modal de selección de plato
window.cerrarModalSeleccionPlato = function() {
    const modal = document.getElementById('modalSeleccionPlato');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Mostrar modal para seleccionar plato
window.mostrarSeleccionPlato = function() {
    const modal = document.getElementById('modalSeleccionPlato');
    const lista = document.getElementById('listaPlatosDisponibles');
    
    if (!platosDisponibles || platosDisponibles.length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No hay platos disponibles</p>
                <button class="btn btn-primary" onclick="cargarSelectorPlatos()">Recargar platos</button>
            </div>
        `;
    } else {
        lista.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
                ${platosDisponibles.map(plato => `
                    <div style="background: var(--surface-high); padding: 15px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.3s;"
                         onclick="seleccionarPlato(${plato.ID_PLATO})"
                         onmouseover="this.style.borderColor='var(--primary)'"
                         onmouseout="this.style.borderColor='transparent'">
                        <h4 style="color: var(--primary); margin-bottom: 5px;">${plato.NOMBRE || 'Sin nombre'}</h4>
                        <p style="color: var(--text-secondary); margin-bottom: 10px;">$${(plato.PRECIO || 0).toFixed(2)}</p>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); seleccionarPlato(${plato.ID_PLATO})">
                            <i class="fas fa-plus"></i> Seleccionar
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    modal.style.display = 'flex';
};

// Seleccionar un plato
window.seleccionarPlato = function(idPlato) {
    const plato = platosDisponibles.find(p => p.ID_PLATO === idPlato);
    if (!plato) {
        app.showToast('Plato no encontrado', 'error');
        return;
    }
    
    // Cerrar modal
    cerrarModalSeleccionPlato();
    
    // Abrir modal para cantidad
    const modalCantidad = document.createElement('div');
    modalCantidad.id = 'modalCantidadPlato';
    modalCantidad.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 1001;
        align-items: center;
        justify-content: center;
    `;
    
    modalCantidad.innerHTML = `
        <div style="background: var(--surface); border-radius: 10px; width: 90%; max-width: 400px; padding: 25px;">
            <h3 style="color: var(--primary); margin-bottom: 20px;">
                <i class="fas fa-utensils"></i> ${plato.NOMBRE || 'Plato'}
            </h3>
            
            <div style="margin-bottom: 25px;">
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    Precio: $${(plato.PRECIO || 0).toFixed(2)}
                </p>
                <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">
                    Cantidad:
                </label>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <button class="btn btn-secondary" onclick="cambiarCantidad(-1)" style="padding: 10px 15px;">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" id="inputCantidadPlato" value="1" min="1" max="99" 
                           style="width: 80px; text-align: center; padding: 10px; border-radius: 6px; border: 1px solid var(--surface-high); background: var(--background); color: var(--text-primary);">
                    <button class="btn btn-secondary" onclick="cambiarCantidad(1)" style="padding: 10px 15px;">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" style="flex: 1;" onclick="agregarPlatoSeleccionado(${plato.ID_PLATO})">
                    <i class="fas fa-check"></i> Agregar
                </button>
                <button class="btn btn-secondary" onclick="cerrarModalCantidadPlato()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalCantidadPlato');
    if (modalAnterior) modalAnterior.remove();
    
    document.body.appendChild(modalCantidad);
    
    // Función para cambiar cantidad
    window.cambiarCantidad = function(cambio) {
        const input = document.getElementById('inputCantidadPlato');
        let valor = parseInt(input.value) || 1;
        valor = Math.max(1, Math.min(99, valor + cambio));
        input.value = valor;
    };
};

// Cerrar modal de cantidad de plato
window.cerrarModalCantidadPlato = function() {
    const modal = document.getElementById('modalCantidadPlato');
    if (modal) {
        modal.remove();
    }
};

// Agregar plato seleccionado al pedido
window.agregarPlatoSeleccionado = function(idPlato) {
    const cantidad = parseInt(document.getElementById('inputCantidadPlato').value) || 1;
    const plato = platosDisponibles.find(p => p.ID_PLATO === idPlato);
    
    if (!plato) {
        app.showToast('Plato no encontrado', 'error');
        return;
    }
    
    // Verificar si el plato ya está en el pedido
    const platoExistente = platosDelPedido.find(p => p.ID_PLATO === idPlato);
    
    if (platoExistente) {
        // Actualizar cantidad
        platoExistente.CANTIDAD += cantidad;
    } else {
        // Agregar nuevo plato
        platosDelPedido.push({
            ID_PLATO: idPlato,
            NOMBRE: plato.NOMBRE,
            PRECIO: plato.PRECIO || 0,
            CANTIDAD: cantidad
        });
    }
    
    // Cerrar modal
    cerrarModalCantidadPlato();
    
    // Actualizar lista de platos
    actualizarListaPlatosPedido();
    
    app.showToast(`${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de ${plato.NOMBRE} agregada(s)`, 'success');
};

// Actualizar lista visual de platos en el pedido
function actualizarListaPlatosPedido() {
    const lista = document.getElementById('listaPlatosPedido');
    
    if (platosDelPedido.length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-info-circle"></i>
                <p>Agregue platos al pedido</p>
            </div>
        `;
        return;
    }
    
    // Calcular total
    const total = platosDelPedido.reduce((sum, plato) => sum + (plato.PRECIO * plato.CANTIDAD), 0);
    
    lista.innerHTML = `
        <div style="margin-bottom: 15px;">
            ${platosDelPedido.map((plato, index) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--background); border-radius: 6px; margin-bottom: 10px;">
                    <div>
                        <strong style="color: var(--primary);">${plato.NOMBRE}</strong>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            ${plato.CANTIDAD} x $${plato.PRECIO.toFixed(2)} = $${(plato.PRECIO * plato.CANTIDAD).toFixed(2)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button class="btn btn-sm btn-secondary" onclick="modificarCantidadPlato(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <span style="min-width: 30px; text-align: center;">${plato.CANTIDAD}</span>
                        <button class="btn btn-sm btn-secondary" onclick="modificarCantidadPlato(${index}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="eliminarPlatoPedido(${index})" style="color: var(--error);">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="border-top: 1px solid var(--surface-high); padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem;">
                <span>Total del Pedido:</span>
                <span style="color: var(--primary);">$${total.toFixed(2)}</span>
            </div>
        </div>
    `;
}

// Modificar cantidad de un plato
window.modificarCantidadPlato = function(index, cambio) {
    if (index >= 0 && index < platosDelPedido.length) {
        const nuevaCantidad = platosDelPedido[index].CANTIDAD + cambio;
        
        if (nuevaCantidad <= 0) {
            eliminarPlatoPedido(index);
        } else if (nuevaCantidad <= 99) {
            platosDelPedido[index].CANTIDAD = nuevaCantidad;
            actualizarListaPlatosPedido();
        }
    }
};

// Eliminar plato del pedido
window.eliminarPlatoPedido = function(index) {
    if (index >= 0 && index < platosDelPedido.length) {
        const platoEliminado = platosDelPedido.splice(index, 1)[0];
        actualizarListaPlatosPedido();
        app.showToast(`${platoEliminado.NOMBRE} eliminado del pedido`, 'warning');
    }
};

// Agregar plato al pedido (abre modal)
window.agregarPlatoAlPedido = function() {
    if (platosDisponibles.length === 0) {
        app.showToast('No hay platos disponibles', 'error');
        return;
    }
    mostrarSeleccionPlato();
};

// Limpiar todos los platos del pedido
window.limpiarPlatosPedido = function() {
    if (platosDelPedido.length === 0) return;
    
    if (confirm(`¿Está seguro de eliminar todos los platos del pedido? (${platosDelPedido.length} platos)`)) {
        platosDelPedido = [];
        actualizarListaPlatosPedido();
        app.showToast('Platos eliminados del pedido', 'warning');
    }
};

// Crear pedido desde formulario - CON VALIDACIÓN DE MESA OCUPADA
async function crearPedidoDesdeFormulario() {
    try {
        // Obtener elementos
        const mesaSelect = document.getElementById('selectMesa');
        const meseroSelect = document.getElementById('selectMesero');
        const errorDiv = document.getElementById('mensajeError');
        
        if (!mesaSelect || !meseroSelect) {
            app.showToast('Error: Formulario no cargado correctamente', 'error');
            return;
        }
        
        // Obtener valores
        const mesaId = mesaSelect.value;
        const meseroId = meseroSelect.value;
        
        // Validaciones básicas
        if (!mesaId || !meseroId) {
            app.showToast('Seleccione una mesa y un mesero', 'error');
            return;
        }
        
        if (platosDelPedido.length === 0) {
            app.showToast('Agregue al menos un plato al pedido', 'error');
            return;
        }
        
        // ============================================
        // NUEVA VALIDACIÓN: VERIFICAR SI LA MESA ESTÁ OCUPADA
        // ============================================
        console.log(`🔍 Verificando estado de la mesa #${mesaId}...`);
        
        // Obtener pedidos del día
        const pedidos = await app.fetchData('pedido');
        const hoy = new Date().toDateString();
        
        // Buscar pedidos activos en esta mesa
        const pedidosMesaHoy = pedidos.filter(p => {
            if (p.ID_MESA != mesaId) return false;
            
            const fechaPedido = p.FECHA_PEDIDO ? new Date(p.FECHA_PEDIDO).toDateString() : '';
            return fechaPedido === hoy;
        });
        
        console.log(`Pedidos encontrados en mesa #${mesaId}:`, pedidosMesaHoy);
        
        if (pedidosMesaHoy.length > 0) {
            // Verificar si algún pedido NO está facturado
            let tienePedidosActivos = false;
            let detallesPedidosActivos = [];
            
            for (const pedido of pedidosMesaHoy) {
                // Obtener facturas para verificar si este pedido está facturado
                let facturas = [];
                try {
                    facturas = await app.fetchData('factura');
                } catch (error) {
                    console.warn('Error obteniendo facturas:', error);
                }
                
                const tieneFactura = facturas.some(f => f.ID_PEDIDO == pedido.ID_PEDIDO);
                
                if (!tieneFactura) {
                    tienePedidosActivos = true;
                    
                    // Obtener detalles del pedido para mostrar información
                    try {
                        const detalles = await app.fetchData(`detallepedido/pedido/${pedido.ID_PEDIDO}`);
                        const total = detalles.reduce((sum, d) => sum + ((d.CANTIDAD || 0) * (d.PRECIO_UNITARIO || 0)), 0);
                        
                        detallesPedidosActivos.push({
                            id: pedido.ID_PEDIDO,
                            estado: pedido.ESTADO || 'Pendiente',
                            total: total.toFixed(2),
                            detalles: detalles
                        });
                    } catch (error) {
                        detallesPedidosActivos.push({
                            id: pedido.ID_PEDIDO,
                            estado: pedido.ESTADO || 'Pendiente',
                            total: 'N/A',
                            detalles: []
                        });
                    }
                }
            }
            
            if (tienePedidosActivos) {
                // Mostrar modal con detalles de los pedidos activos
                mostrarModalMesaOcupada(mesaId, detallesPedidosActivos);
                return;
            }
        }
        // ============================================
        // FIN DE NUEVA VALIDACIÓN
        // ============================================
        
        // Limpiar mensaje de error
        if (errorDiv) errorDiv.style.display = 'none';
        
        // MOSTRAR LOADING
        const submitBtn = document.querySelector('#formNuevoPedido button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        submitBtn.disabled = true;
        
        // Resto del código se mantiene igual...
        const pedidoData = {
            ID_MESA: parseInt(mesaId),
            ID_MESERO: parseInt(meseroId),
            ESTADO: 'Pendiente'  // Estado inicial, no facturado
        };
        
        console.log('Enviando pedido al servidor:', pedidoData);
        const resultado = await app.fetchData('pedido', 'POST', pedidoData);
        
        if (!resultado || !resultado.ID_PEDIDO) {
            throw new Error(`No se pudo crear el pedido. Respuesta: ${JSON.stringify(resultado)}`);
        }
        
        const pedidoId = resultado.ID_PEDIDO;
        console.log('✅ Pedido creado con ID:', pedidoId);
        
        // **AGREGAR DETALLES DEL PEDIDO (PLATOS)**
        let detallesCreados = 0;
        for (const plato of platosDelPedido) {
            try {
                const detalleData = {
                    ID_PEDIDO: pedidoId,
                    ID_PLATO: plato.ID_PLATO,
                    CANTIDAD: plato.CANTIDAD,
                    PRECIO_UNITARIO: plato.PRECIO
                };
                
                console.log(`Creando detalle ${detallesCreados + 1}:`, detalleData);
                await app.fetchData('detallepedido', 'POST', detalleData);
                detallesCreados++;
                
            } catch (detalleError) {
                console.warn(`Error creando detalle para plato ${plato.ID_PLATO}:`, detalleError);
            }
        }

        console.log(`✅ ${detallesCreados} detalles creados para pedido #${pedidoId}`);

        // **NO CREAR FACTURA AUTOMÁTICAMENTE - SOLO CALCULAR TOTAL PARA MOSTRAR**
        const total = platosDelPedido.reduce((sum, plato) => sum + (plato.PRECIO * plato.CANTIDAD), 0);

        // **MOSTRAR MENSAJE DE ÉXITO (SIN MENCIONAR FACTURA)**
        app.showToast(`✅ Pedido #${pedidoId} creado exitosamente! Total: $${total.toFixed(2)}`, 'success');
        app.showToast('💡 El pedido está en estado "Pendiente". Puedes facturarlo después.', 'info');

        // **RESET FORMULARIO**
        platosDelPedido = [];

        // Resetear selects
        mesaSelect.value = '';
        meseroSelect.value = '';

        // Actualizar lista visual
        actualizarListaPlatosPedido();

        // **ACTUALIZAR LISTA DE PEDIDOS**
        await cargarListaPedidos();

        // **OCULTAR FORMULARIO DESPUÉS DE 2 SEGUNDOS**
        setTimeout(() => {
            document.getElementById('formularioPedido').style.display = 'none';
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error completo al crear pedido:', error);
        
        // Restaurar botón
        const submitBtn = document.querySelector('#formNuevoPedido button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Crear Pedido';
            submitBtn.disabled = false;
        }
        
        // Mostrar error específico
        let mensajeError = error.message || 'Error desconocido';
        
        if (mensajeError.includes('400')) {
            mensajeError = 'Error 400: Datos inválidos enviados al servidor. Verifique que los IDs existan.';
        } else if (mensajeError.includes('404')) {
            mensajeError = 'Error 404: No se encontró el recurso. Verifique la conexión con el servidor.';
        } else if (mensajeError.includes('500')) {
            mensajeError = 'Error 500: Error interno del servidor. Contacte al administrador.';
        }
        
        app.showToast(`Error: ${mensajeError}`, 'error');
        
        // Mostrar en div de error
        const errorDiv = document.getElementById('mensajeError');
        if (errorDiv) {
            errorDiv.textContent = mensajeError;
            errorDiv.style.display = 'block';
        }
    }
}

// Función para mostrar modal cuando la mesa está ocupada
function mostrarModalMesaOcupada(mesaId, pedidosActivos) {
    // Crear modal
    const modalId = 'modal-mesa-ocupada';
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById(modalId);
    if (modalAnterior) modalAnterior.remove();
    
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    // Crear contenido del modal
    let contenidoPedidos = '';
    
    if (pedidosActivos.length === 0) {
        contenidoPedidos = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-exclamation-circle"></i>
                <p>La mesa tiene pedidos activos pero no se pudieron obtener detalles.</p>
            </div>
        `;
    } else {
        contenidoPedidos = `
            <div style="max-height: 300px; overflow-y: auto; margin: 15px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--surface-high);">
                            <th style="padding: 10px; text-align: left;">Pedido ID</th>
                            <th style="padding: 10px; text-align: left;">Estado</th>
                            <th style="padding: 10px; text-align: left;">Total</th>
                            <th style="padding: 10px; text-align: left;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidosActivos.map(pedido => `
                            <tr style="border-bottom: 1px solid var(--surface-high);">
                                <td style="padding: 10px;">
                                    <strong>#${pedido.id}</strong>
                                </td>
                                <td style="padding: 10px;">
                                    <span class="status-badge ${pedido.estado === 'Atendido' ? 'status-attended' : 'status-inactive'}">
                                        ${pedido.estado}
                                    </span>
                                </td>
                                <td style="padding: 10px;">
                                    <strong>$${pedido.total}</strong>
                                </td>
                                <td style="padding: 10px;">
                                    <button class="btn btn-sm btn-secondary" onclick="verDetallesPedido(${pedido.id})">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${pedido.estado === 'Atendido' ? `
                                    <button class="btn btn-sm btn-success" onclick="generarFacturaYRedirigir(${pedido.id}); cerrarModalMesaOcupada()">
                                        <i class="fas fa-file-invoice-dollar"></i> Facturar
                                    </button>
                                    ` : ''}
                                    ${pedido.estado === 'Pendiente' ? `
                                    <button class="btn btn-sm btn-primary" onclick="marcarComoAtendido(${pedido.id}); cerrarModalMesaOcupada()">
                                        <i class="fas fa-check-circle"></i> Atender
                                    </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div style="background: var(--surface); border-radius: 10px; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div style="padding: 20px; border-bottom: 1px solid var(--surface-high); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="color: var(--error); margin: 0;">
                    <i class="fas fa-exclamation-triangle"></i> Mesa Ocupada
                </h3>
                <button class="btn btn-icon" onclick="cerrarModalMesaOcupada()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(244, 67, 54, 0.1); border-radius: 8px; border: 1px solid var(--error);">
                    <h4 style="color: var(--error); margin-bottom: 10px;">
                        <i class="fas fa-ban"></i> No se puede crear nuevo pedido
                    </h4>
                    <p style="color: var(--text-primary);">
                        La <strong>Mesa #${mesaId}</strong> ya tiene pedidos activos que no han sido facturados.
                        Debes facturar o atender los pedidos existentes antes de crear uno nuevo.
                    </p>
                </div>
                
                <h4 style="color: var(--text-secondary); margin-bottom: 15px;">
                    <i class="fas fa-clipboard-list"></i> Pedidos Activos en esta Mesa:
                </h4>
                
                ${contenidoPedidos}
                
                <div style="margin-top: 25px; padding: 15px; background: var(--surface-high); border-radius: 8px;">
                    <h4 style="color: var(--text-secondary); margin-bottom: 10px;">
                        <i class="fas fa-lightbulb"></i> Solución:
                    </h4>
                    <ul style="color: var(--text-primary); padding-left: 20px; margin: 0;">
                        <li>Si el pedido está <strong>"Pendiente"</strong>, márcalo como <strong>"Atendido"</strong></li>
                        <li>Si el pedido está <strong>"Atendido"</strong>, <strong>factúralo</strong> para liberar la mesa</li>
                        <li>O selecciona otra mesa disponible</li>
                    </ul>
                </div>
            </div>
            
            <div style="padding: 20px; border-top: 1px solid var(--surface-high); display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="cerrarModalMesaOcupada()">
                    Cerrar
                </button>
                <button class="btn btn-primary" onclick="verMesasDisponibles()">
                    <i class="fas fa-chair"></i> Ver Mesas Disponibles
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Función para cerrar el modal
window.cerrarModalMesaOcupada = function() {
    const modal = document.getElementById('modal-mesa-ocupada');
    if (modal) {
        modal.remove();
    }
};

// Función para ver mesas disponibles
window.verMesasDisponibles = function() {
    cerrarModalMesaOcupada();
    
    // Navegar al dashboard para ver mesas disponibles
    app.navigateTo('dashboard');
    
    // Mostrar mensaje informativo
    setTimeout(() => {
        app.showToast('👆 Selecciona una mesa disponible del plano', 'info');
    }, 500);
};

// Cargar lista de pedidos - CORRECCIÓN EN RENDERIZADO DE ESTADO
async function cargarListaPedidos() {
    try {
        console.log('Cargando lista de pedidos...');
        const pedidos = await app.fetchData('pedido');
        const listContainer = document.getElementById('pedidosList');
        
        if (!pedidos || pedidos.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; background: var(--surface); border-radius: 10px;">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; color: var(--primary); margin-bottom: 20px;"></i>
                    <h3>No hay pedidos registrados</h3>
                    <p>Comienza creando tu primer pedido</p>
                    <button class="btn btn-primary" onclick="mostrarFormularioPedido()">
                        <i class="fas fa-plus"></i> Crear Primer Pedido
                    </button>
                </div>
            `;
            return;
        }
        
        // Obtener detalles adicionales para cada pedido
        const pedidosConDetalles = await Promise.all(
            pedidos.map(async (pedido) => {
                try {
                    // Obtener detalles del pedido
                    const detalles = await app.fetchData(`detallepedido/pedido/${pedido.ID_PEDIDO}`);
                    const total = detalles.reduce((sum, detalle) => 
                        sum + ((detalle.CANTIDAD || 0) * (detalle.PRECIO_UNITARIO || 0)), 0);
                    
                    // Intentar obtener factura
                    let factura = null;
                    try {
                        // Buscar factura por ID de pedido
                        const facturas = await app.fetchData('factura');
                        factura = facturas.find(f => f.ID_PEDIDO == pedido.ID_PEDIDO);
                    } catch {
                        // Si no hay factura, continuar
                    }
                    
                    return {
                        ...pedido,
                        detalles,
                        total,
                        tieneFactura: !!factura,
                        ESTADO: pedido.ESTADO || 'Pendiente'  // Estado por defecto
                    };
                } catch (error) {
                    console.warn(`Error obteniendo detalles del pedido ${pedido.ID_PEDIDO}:`, error);
                    return { 
                        ...pedido, 
                        detalles: [], 
                        total: 0, 
                        tieneFactura: false,
                        ESTADO: pedido.ESTADO || 'Pendiente'
                    };
                }
            })
        );
        
        // Ordenar por ID descendente (más recientes primero)
        pedidosConDetalles.sort((a, b) => b.ID_PEDIDO - a.ID_PEDIDO);
        
        let html = `
            <div style="background: var(--surface); border-radius: 10px; overflow: hidden; border: 1px solid var(--surface-high);">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead>
                            <tr style="background: var(--surface-high);">
                                <th style="padding: 15px; text-align: left;">ID</th>
                                <th style="padding: 15px; text-align: left;">Mesa</th>
                                <th style="padding: 15px; text-align: left;">Mesero</th>
                                <th style="padding: 15px; text-align: left;">Fecha</th>
                                <th style="padding: 15px; text-align: left;">Total</th>
                                <th style="padding: 15px; text-align: left;">Estado</th>
                                <th style="padding: 15px; text-align: left;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        pedidosConDetalles.forEach(pedido => {
            const fecha = pedido.FECHA_PEDIDO ? new Date(pedido.FECHA_PEDIDO).toLocaleDateString() : 'N/A';
            const hora = pedido.HORA_PEDIDO || '';
            
            // **CORRECCIÓN: Determinar estado visual basado PRIMERO en pedido.ESTADO**
            let estadoVisual = '';
            let estadoClass = '';
            
            // 1. Si tiene factura, siempre es "Facturado"
            if (pedido.tieneFactura) {
                estadoVisual = 'Facturado';
                estadoClass = 'status-active';
            } 
            // 2. Si no tiene factura, mostrar el estado REAL del pedido
            else {
                estadoVisual = pedido.ESTADO || 'Pendiente';
                
                // Asignar clase CSS según estado
                if (pedido.ESTADO === 'Atendido') {
                    estadoClass = 'status-attended';
                } else {
                    estadoClass = 'status-inactive';
                }
            }
            
            html += `
                <tr style="border-bottom: 1px solid var(--surface-high);">
                    <td style="padding: 15px;">
                        <strong>#${pedido.ID_PEDIDO}</strong>
                    </td>
                    <td style="padding: 15px;">${pedido.ID_MESA || 'N/A'}</td>
                    <td style="padding: 15px;">${pedido.ID_MESERO || 'N/A'}</td>
                    <td style="padding: 15px;">
                        <div>${fecha}</div>
                        <small style="color: var(--text-secondary);">${hora}</small>
                    </td>
                    <td style="padding: 15px;">
                        <strong style="color: var(--primary);">$${pedido.total.toFixed(2)}</strong>
                    </td>
                    <td style="padding: 15px;">
                        <span class="status-badge ${estadoClass}">${estadoVisual}</span>
                    </td>
                    <td style="padding: 15px;">
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button class="btn btn-sm btn-secondary" onclick="verDetallesPedido(${pedido.ID_PEDIDO})" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            
                            <!-- Botón para cambiar estado a Atendido (solo si está Pendiente) -->
                            ${(!pedido.tieneFactura && pedido.ESTADO === 'Pendiente') ? `
                            <button class="btn btn-sm btn-primary" onclick="marcarComoAtendido(${pedido.ID_PEDIDO})" title="Marcar como atendido">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            ` : ''}
                            
                            <!-- Botón para facturar (solo si está Atendido y no tiene factura) -->
                            ${(!pedido.tieneFactura && pedido.ESTADO === 'Atendido') ? `
                            <button class="btn btn-sm btn-success" onclick="generarFacturaYRedirigir(${pedido.ID_PEDIDO})" title="Generar factura">
                                <i class="fas fa-file-invoice-dollar"></i>
                            </button>
                            ` : ''}
                            
                            <!-- Botón para ver factura (si ya tiene factura) -->
                            ${pedido.tieneFactura ? `
                            <button class="btn btn-sm btn-success" onclick="verFactura(${pedido.ID_PEDIDO})" title="Ver factura">
                                <i class="fas fa-receipt"></i>
                            </button>
                            ` : ''}
                            
                            <button class="btn btn-sm btn-danger" onclick="eliminarPedidoConfirm(${pedido.ID_PEDIDO})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
            <div style="margin-top: 15px; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <i class="fas fa-clipboard-list"></i> Total: ${pedidosConDetalles.length} pedido(s)
                </div>
                <div style="font-weight: bold; color: var(--primary);">
                    <i class="fas fa-money-bill-wave"></i> Ventas totales: $${pedidosConDetalles.reduce((sum, p) => sum + p.total, 0).toFixed(2)}
                </div>
            </div>
        `;
        
        listContainer.innerHTML = html;
        
        // Agregar estilos CSS si no existen
        if (!document.querySelector('#pedidosStyles')) {
            const styles = document.createElement('style');
            styles.id = 'pedidosStyles';
            styles.textContent = `
                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .status-active {
                    background: rgba(76, 175, 80, 0.2);
                    color: #4CAF50;
                    border: 1px solid #4CAF50;
                }
                .status-attended {
                    background: rgba(33, 150, 243, 0.2);
                    color: #2196F3;
                    border: 1px solid #2196F3;
                }
                .status-inactive {
                    background: rgba(255, 152, 0, 0.2);
                    color: #FF9800;
                    border: 1px solid #FF9800;
                }
                .btn-sm {
                    padding: 5px 10px;
                    font-size: 0.85rem;
                }
                .btn-icon {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 4px;
                }
                .btn-icon:hover {
                    background: var(--surface-high);
                }
            `;
            document.head.appendChild(styles);
        }
        
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        const listContainer = document.getElementById('pedidosList');
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--error);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Error al cargar pedidos</h3>
                <p>${error.message}</p>
                <p><small>Error en: ${error.stack?.split('\n')[1] || 'Desconocido'}</small></p>
                <button class="btn btn-primary" onclick="cargarListaPedidos()">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// Función para depurar el estado de un pedido
window.depurarEstadoPedido = async function(pedidoId) {
    try {
        console.log('=== DEPURANDO ESTADO PEDIDO ===');
        
        // 1. Obtener pedido
        const pedido = await app.fetchData(`pedido/${pedidoId}`);
        console.log('Pedido desde API:', pedido);
        console.log('ESTADO actual:', pedido.ESTADO);
        
        // 2. Verificar factura
        const facturas = await app.fetchData('factura');
        const factura = facturas.find(f => f.ID_PEDIDO == pedidoId);
        console.log('¿Tiene factura?', !!factura);
        
        // 3. Mostrar alerta con info
        alert(`Pedido #${pedidoId}\nEstado: ${pedido.ESTADO}\nTiene factura: ${!!factura}`);
        
    } catch (error) {
        console.error('Error en depuración:', error);
    }
};

// Ver detalles de un pedido (CORREGIDA - CERRAR FUNCIONA)
window.verDetallesPedido = async function(id) {
    try {
        const pedido = await app.fetchData(`pedido/${id}`);
        const detalles = await app.fetchData(`detallepedido/pedido/${id}`);
        
        let detallesHtml = '';
        let total = 0;
        
        if (detalles.length === 0) {
            detallesHtml = '<p style="color: var(--text-secondary); font-style: italic;">No hay detalles para este pedido</p>';
        } else {
            total = detalles.reduce((sum, d) => sum + ((d.CANTIDAD || 0) * (d.PRECIO_UNITARIO || 0)), 0);
            
            detallesHtml = `
                <div style="max-height: 300px; overflow-y: auto; margin: 15px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--surface-high);">
                                <th style="padding: 10px; text-align: left;">ID Plato</th>
                                <th style="padding: 10px; text-align: left;">Cantidad</th>
                                <th style="padding: 10px; text-align: left;">Precio Unit.</th>
                                <th style="padding: 10px; text-align: left;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detalles.map(d => `
                                <tr style="border-bottom: 1px solid var(--surface-high);">
                                    <td style="padding: 10px;">${d.ID_PLATO}</td>
                                    <td style="padding: 10px;">${d.CANTIDAD || 0}</td>
                                    <td style="padding: 10px;">$${(d.PRECIO_UNITARIO || 0).toFixed(2)}</td>
                                    <td style="padding: 10px;">$${((d.CANTIDAD || 0) * (d.PRECIO_UNITARIO || 0)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Crear modal para mostrar detalles
        const modalId = `modal-detalles-pedido-${id}`;
        
        // Remover modal anterior si existe
        const modalAnterior = document.getElementById(modalId);
        if (modalAnterior) modalAnterior.remove();
        
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: var(--surface); border-radius: 10px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div style="padding: 20px; border-bottom: 1px solid var(--surface-high); display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="color: var(--primary); margin: 0;">
                        <i class="fas fa-clipboard-list"></i> Detalles del Pedido #${id}
                    </h3>
                    <button class="btn btn-icon" onclick="document.getElementById('${modalId}').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                        <div>
                            <h4 style="color: var(--text-secondary); margin-bottom: 10px;">Información del Pedido</h4>
                            <p><strong>Mesa ID:</strong> ${pedido.ID_MESA || 'N/A'}</p>
                            <p><strong>Mesero ID:</strong> ${pedido.ID_MESERO || 'N/A'}</p>
                            <p><strong>Fecha:</strong> ${pedido.FECHA_PEDIDO ? new Date(pedido.FECHA_PEDIDO).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Hora:</strong> ${pedido.HORA_PEDIDO || 'N/A'}</p>
                            <p><strong>Estado:</strong> ${pedido.ESTADO || 'Pendiente'}</p>
                        </div>
                        <div style="background: var(--surface-high); padding: 15px; border-radius: 8px;">
                            <h4 style="color: var(--text-secondary); margin-bottom: 10px;">Resumen</h4>
                            <p><strong>Total de platos:</strong> ${detalles.length}</p>
                            <p><strong>Total del pedido:</strong></p>
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">
                                $${total.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    <h4 style="color: var(--text-secondary); margin-bottom: 15px;">Platos del Pedido</h4>
                    ${detallesHtml}
                </div>
                
                <div style="padding: 20px; border-top: 1px solid var(--surface-high); text-align: right;">
                    <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error cargando detalles del pedido:', error);
        app.showToast('Error al cargar detalles del pedido', 'error');
    }
};

// Crear factura para un pedido (función deprecada - usar generarFacturaYRedirigir)
window.crearFactura = async function(pedidoId) {
    if (!confirm(`¿Crear factura para el pedido #${pedidoId}?`)) {
        return;
    }
    
    try {
        // Obtener detalles del pedido para calcular total
        const detalles = await app.fetchData(`detallepedido/pedido/${pedidoId}`);
        const total = detalles.reduce((sum, d) => sum + ((d.CANTIDAD || 0) * (d.PRECIO_UNITARIO || 0)), 0);
        
        const facturaData = {
            ID_PEDIDO: pedidoId,
            TOTAL: total
        };
        
        const resultado = await app.fetchData('factura', 'POST', facturaData);
        
        app.showToast(`✅ Factura creada para pedido #${pedidoId}`, 'success');
        await cargarListaPedidos();
        
    } catch (error) {
        console.error('Error creando factura:', error);
        app.showToast('Error al crear factura: ' + error.message, 'error');
    }
};

// Eliminar pedido con confirmación (CORREGIDA)
window.eliminarPedidoConfirm = async function(id) {
    if (!confirm(`¿Está seguro de eliminar el pedido #${id}?\n\nEsta acción eliminará:\n• Los detalles del pedido\n• La factura asociada\n• El pedido principal\n\n⚠️ Esta acción no se puede deshacer.`)) {
        return;
    }
    
    // Mostrar loading
    app.showToast('Eliminando pedido...', 'info');
    
    try {
        console.log(`Iniciando eliminación del pedido #${id}`);
        
        // **NUEVA ESTRATEGIA: ELIMINAR CON CASCADA O VERIFICAR ANTES**
        
        // 1. Verificar si hay detalles primero
        let tieneDetalles = false;
        try {
            const detalles = await app.fetchData(`detallepedido/pedido/${id}`);
            tieneDetalles = detalles && detalles.length > 0;
            console.log(`El pedido #${id} tiene ${detalles?.length || 0} detalles`);
        } catch (error) {
            console.warn(`Error verificando detalles del pedido #${id}:`, error);
        }
        
        // 2. Si hay detalles, intentar eliminarlos primero
        if (tieneDetalles) {
            console.log(`Intentando eliminar detalles del pedido #${id}`);
            try {
                // Obtener todos los detalles
                const detalles = await app.fetchData(`detallepedido/pedido/${id}`);
                
                // Eliminar cada detalle
                for (const detalle of detalles) {
                    if (detalle && detalle.ID_DETALLE_PEDIDO) {
                        try {
                            console.log(`Eliminando detalle ID: ${detalle.ID_DETALLE_PEDIDO}`);
                            await app.fetchData(`detallepedido/${detalle.ID_DETALLE_PEDIDO}`, 'DELETE');
                            console.log(`✅ Detalle ${detalle.ID_DETALLE_PEDIDO} eliminado`);
                        } catch (detalleError) {
                            console.warn(`Error eliminando detalle ${detalle.ID_DETALLE_PEDIDO}:`, detalleError);
                            throw new Error(`No se pudo eliminar el detalle ${detalle.ID_DETALLE_PEDIDO}`);
                        }
                    }
                }
                console.log(`✅ Todos los detalles del pedido #${id} eliminados`);
            } catch (error) {
                console.error(`Error eliminando detalles del pedido #${id}:`, error);
                throw new Error(`No se pudieron eliminar los detalles del pedido: ${error.message}`);
            }
        }
        
        // 3. Esperar un momento para asegurar que la BD procesó las eliminaciones
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 4. Verificar si hay factura
        let tieneFactura = false;
        let facturaId = null;
        try {
            // Intentar obtener factura directamente por pedido ID
            const facturas = await app.fetchData('factura');
            const factura = facturas.find(f => f.ID_PEDIDO == id);
            
            if (factura && factura.ID_FACTURA) {
                tieneFactura = true;
                facturaId = factura.ID_FACTURA;
                console.log(`El pedido #${id} tiene factura ID: ${facturaId}`);
            }
        } catch (error) {
            console.warn(`Error verificando factura del pedido #${id}:`, error);
        }
        
        // 5. Eliminar factura si existe
        if (tieneFactura && facturaId) {
            try {
                console.log(`Eliminando factura ID: ${facturaId}`);
                await app.fetchData(`factura/${facturaId}`, 'DELETE');
                console.log(`✅ Factura ${facturaId} eliminada`);
            } catch (facturaError) {
                console.warn(`Error eliminando factura ${facturaId}:`, facturaError);
                // No es crítico, continuar con la eliminación del pedido
            }
        }
        
        // 6. Esperar otro momento
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 7. FINALMENTE, eliminar pedido principal
        console.log(`Eliminando pedido principal ID: ${id}`);
        const resultado = await app.fetchData(`pedido/${id}`, 'DELETE');
        console.log(`✅ Pedido #${id} eliminado:`, resultado);
        
        // 8. Mensaje de éxito
        app.showToast(`✅ Pedido #${id} eliminado correctamente`, 'success');
        
        // 9. Refrescar lista después de un breve delay
        setTimeout(() => {
            cargarListaPedidos();
        }, 500);
        
    } catch (error) {
        console.error('Error completo eliminando pedido:', error);
        
        let mensajeError = error.message;
        let mensajeUsuario = '';
        
        // Analizar el error específico
        if (mensajeError.includes('FK_DET_PED') || mensajeError.includes('foreign key constraint')) {
            mensajeUsuario = `❌ No se puede eliminar el pedido #${id} porque todavía tiene detalles asociados. 
            Primero debe eliminar manualmente todos los detalles del pedido.`;
        } else if (mensajeError.includes('500')) {
            mensajeUsuario = `❌ Error del servidor al eliminar el pedido #${id}. 
            El pedido podría tener dependencias que impiden su eliminación.`;
        } else if (mensajeError.includes('404')) {
            mensajeUsuario = `El pedido #${id} no fue encontrado o ya fue eliminado.`;
        } else {
            mensajeUsuario = `❌ Error al eliminar el pedido #${id}: ${mensajeError}`;
        }
        
        app.showToast(mensajeUsuario, 'error');
        
        // Mostrar error detallado en consola
        console.error('Detalles del error:', {
            mensaje: error.message,
            stack: error.stack,
            pedidoId: id
        });
    }
};

// ============================================
// FUNCIONES CORREGIDAS PARA MANEJO DE ESTADOS
// ============================================

// Función CORREGIDA para marcar un pedido como "Atendido"
// Función CORREGIDA para marcar un pedido como "Atendido"
// ============================================
// FUNCIÓN COMPLETAMENTE CORREGIDA PARA MARCAR COMO ATENDIDO
// ============================================

window.marcarComoAtendido = async function(pedidoId) {
    if (!confirm(`¿Marcar el pedido #${pedidoId} como "Atendido"?`)) {
        return;
    }
    
    try {
        console.log(`Intentando marcar pedido #${pedidoId} como "Atendido"...`);
        
        // Obtener el pedido actual
        const pedido = await app.fetchData(`pedido/${pedidoId}`);
        console.log('Pedido actual:', pedido);
        
        // **VERIFICAR SI TIENE EL CAMPO ESTADO**
        console.log('¿Tiene campo ESTADO?', 'ESTADO' in pedido);
        console.log('Valor actual de ESTADO:', pedido.ESTADO);
        
        // Crear datos actualizados - IMPORTANTE: Incluir TODOS los campos
        const datosActualizados = {
            ID_PEDIDO: pedido.ID_PEDIDO,
            ID_MESA: pedido.ID_MESA,
            ID_MESERO: pedido.ID_MESERO,
            FECHA_PEDIDO: pedido.FECHA_PEDIDO,
            HORA_PEDIDO: pedido.HORA_PEDIDO,
            ESTADO: 'Atendido'  // Solo cambiamos este campo
        };
        
        console.log('Datos a enviar (todos los campos):', datosActualizados);
        
        // Intentar actualizar con PUT
        const resultado = await app.fetchData(`pedido/${pedidoId}`, 'PUT', datosActualizados);
        console.log('Resultado de la actualización:', resultado);
        
        // Verificar si se actualizó correctamente
        if (resultado && resultado.ESTADO === 'Atendido') {
            app.showToast(`✅ Pedido #${pedidoId} marcado como "Atendido"`, 'success');
        } else {
            // Si no hay respuesta clara, verificar manualmente
            setTimeout(async () => {
                const pedidoVerificado = await app.fetchData(`pedido/${pedidoId}`);
                console.log('Pedido verificado después de actualizar:', pedidoVerificado);
                
                if (pedidoVerificado.ESTADO === 'Atendido') {
                    app.showToast(`✅ Pedido #${pedidoId} marcado como "Atendido"`, 'success');
                } else {
                    app.showToast(`⚠️ Estado no se actualizó visiblemente. Revisar consola.`, 'warning');
                }
            }, 500);
        }
        
        // Refrescar la lista
        setTimeout(() => {
            cargarListaPedidos();
        }, 800);
        
    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
        
        let mensajeError = error.message;
        if (mensajeError.includes('500')) {
            mensajeError = 'Error del servidor. Verifica que el modelo Pedido.cs tenga el campo ESTADO.';
        }
        
        app.showToast(`Error: ${mensajeError}`, 'error');
    }
};

// Función para generar factura y redirigir a factura.html
window.generarFacturaYRedirigir = async function(pedidoId) {
    try {
        // Verificar primero si el pedido existe
        const pedido = await app.fetchData(`pedido/${pedidoId}`);
        
        if (!pedido || pedido.ESTADO !== 'Atendido') {
            app.showToast('⚠️ El pedido debe estar en estado "Atendido" para facturar.', 'warning');
            return;
        }
        
        if (!confirm(`¿Generar factura para el pedido #${pedidoId}?\n\nTotal: $${pedido.total || '0.00'}`)) {
            return;
        }
        
        // Obtener detalles del pedido para calcular total
        const detalles = await app.fetchData(`detallepedido/pedido/${pedidoId}`);
        const total = detalles.reduce((sum, d) => sum + ((d.CANTIDAD || 0) * (d.PRECIO_UNITARIO || 0)), 0);
        
        // Crear la factura
        const facturaData = {
            ID_PEDIDO: pedidoId,
            TOTAL: total
        };
        
        console.log('Creando factura con datos:', facturaData);
        const resultado = await app.fetchData('factura', 'POST', facturaData);
        
        if (!resultado || !resultado.ID_FACTURA) {
            throw new Error('No se pudo crear la factura - respuesta del servidor inválida');
        }
        
        const facturaId = resultado.ID_FACTURA;
        
        app.showToast(`✅ Factura creada exitosamente (ID: ${facturaId})`, 'success');

        // Actualizar estado de mesas en el dashboard
        setTimeout(() => {
            // Si estamos en el dashboard, recargarlo
            if (window.currentSection === 'dashboard') {
                window.loadDashboard();
            }
        }, 1500);
        
        // Redirigir a factura.html con los parámetros
        const url = `factura.html?pedidoId=${pedidoId}&facturaId=${facturaId}`;
        window.open(url, '_blank');
        
        // Actualizar la lista después de un breve delay
        setTimeout(() => {
            cargarListaPedidos();
        }, 1000);
        
    } catch (error) {
        console.error('Error generando factura:', error);
        
        let mensajeError = error.message;
        if (mensajeError.includes('Duplicate entry') || mensajeError.includes('duplicate')) {
            mensajeError = '⚠️ Este pedido ya tiene una factura asociada.';
        }
        
        app.showToast(`Error al generar factura: ${mensajeError}`, 'error');
    }
};

// Función para ver factura existente
window.verFactura = async function(pedidoId) {
    try {
        // Buscar la factura asociada al pedido
        const facturas = await app.fetchData('factura');
        const factura = facturas.find(f => f.ID_PEDIDO == pedidoId);
        
        if (!factura || !factura.ID_FACTURA) {
            throw new Error('No se encontró factura para este pedido');
        }
        
        const url = `factura.html?pedidoId=${pedidoId}&facturaId=${factura.ID_FACTURA}`;
        window.open(url, '_blank');
        
    } catch (error) {
        console.error('Error abriendo factura:', error);
        app.showToast('Error al abrir factura: ' + error.message, 'error');
    }
};

// Función de respaldo para eliminación segura (opcional)
window.eliminarPedidoSeguro = async function(id) {
    try {
        // Verificar si tiene detalles
        const detalles = await app.fetchData(`detallepedido/pedido/${id}`);
        
        if (detalles && detalles.length > 0) {
            const mensaje = `El pedido #${id} tiene ${detalles.length} detalles asociados.\n\n¿Desea eliminar todos los detalles primero?`;
            
            if (confirm(mensaje)) {
                // Mostrar opción para eliminar detalles manualmente
                const detalleHtml = detalles.map(d => 
                    `- Plato ID: ${d.ID_PLATO}, Cantidad: ${d.CANTIDAD}, Subtotal: $${(d.CANTIDAD * d.PRECIO_UNITARIO).toFixed(2)}`
                ).join('\n');
                
                alert(`Detalles del pedido #${id}:\n\n${detalleHtml}\n\nDebe eliminar estos detalles manualmente antes de eliminar el pedido.`);
                return;
            } else {
                return;
            }
        }
        
        // Si no hay detalles, proceder con eliminación normal
        await eliminarPedidoConfirm(id);
        
    } catch (error) {
        console.error('Error en eliminación segura:', error);
        app.showToast(`Error verificando detalles del pedido #${id}`, 'error');
    }
};