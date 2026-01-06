// Inventario Module
window.loadInventario = async function() {
    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div class="table-header">
            <h3>Gestión de Inventario</h3>
            <button class="btn btn-primary" onclick="abrirModalIngrediente()">
                <i class="fas fa-plus"></i> Nuevo Ingrediente
            </button>
        </div>
        
        <div class="table-container">
            <table id="inventarioTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Stock</th>
                        <th>Unidad</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Data will be loaded here -->
                </tbody>
            </table>
        </div>
        
        <div class="modal" id="modalIngrediente">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalIngredienteTitle">Nuevo Ingrediente</h3>
                    <button class="btn btn-icon" onclick="cerrarModalIngrediente()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formIngrediente">
                        <input type="hidden" id="ingredienteId" value="0">
                        
                        <div class="form-group">
                            <label class="form-label" for="nombreIngrediente">Nombre *</label>
                            <input type="text" id="nombreIngrediente" class="form-control" required>
                        </div>
                        
                        <div class="grid-2">
                            <div class="form-group">
                                <label class="form-label" for="stockIngrediente">Stock *</label>
                                <input type="number" id="stockIngrediente" class="form-control" required min="0" step="0.01">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="unidadIngrediente">Unidad de Medida</label>
                                <select id="unidadIngrediente" class="form-control">
                                    <option value="kg">Kilogramos (kg)</option>
                                    <option value="g">Gramos (g)</option>
                                    <option value="l">Litros (l)</option>
                                    <option value="ml">Mililitros (ml)</option>
                                    <option value="unidades">Unidades</option>
                                    <option value="paquetes">Paquetes</option>
                                    <option value="cajas">Cajas</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalIngrediente()">Cancelar</button>
                    <button class="btn btn-primary" onclick="guardarIngrediente()">Guardar</button>
                </div>
            </div>
        </div>
    `;
    
    await cargarInventario();
};

async function cargarInventario() {
    try {
        const ingredientes = await app.fetchData('ingrediente');
        
        const tbody = document.querySelector('#inventarioTable tbody');
        
        if (ingredientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        No hay ingredientes en inventario
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = ingredientes.map(ingrediente => {
            const bajoStock = ingrediente.STOCK < 10;
            const estado = bajoStock ? 'Bajo Stock' : 'Disponible';
            const estadoClass = bajoStock ? 'status-inactive' : 'status-active';
            
            return `
                <tr>
                    <td>${ingrediente.ID_INGREDIENTE}</td>
                    <td>${ingrediente.NOMBRE || 'N/A'}</td>
                    <td>${ingrediente.STOCK || 0}</td>
                    <td>${ingrediente.UNIDAD_MEDIDA || 'N/A'}</td>
                    <td><span class="status-badge ${estadoClass}">${estado}</span></td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="editarIngrediente(${ingrediente.ID_INGREDIENTE})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="ajustarStock(${ingrediente.ID_INGREDIENTE})">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="eliminarIngrediente(${ingrediente.ID_INGREDIENTE})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        const tbody = document.querySelector('#inventarioTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--error);">
                    Error cargando inventario: ${error.message}
                </td>
            </tr>
        `;
    }
}

window.abrirModalIngrediente = function(ingredienteId = 0) {
    const modal = document.getElementById('modalIngrediente');
    const title = document.getElementById('modalIngredienteTitle');
    const form = document.getElementById('formIngrediente');
    
    if (ingredienteId > 0) {
        title.textContent = 'Editar Ingrediente';
        cargarDatosIngrediente(ingredienteId);
    } else {
        title.textContent = 'Nuevo Ingrediente';
        form.reset();
        document.getElementById('ingredienteId').value = '0';
        document.getElementById('unidadIngrediente').value = 'kg';
    }
    
    modal.style.display = 'flex';
};

window.cerrarModalIngrediente = function() {
    document.getElementById('modalIngrediente').style.display = 'none';
};

async function cargarDatosIngrediente(id) {
    try {
        const ingrediente = await app.fetchData(`ingrediente/${id}`);
        
        document.getElementById('ingredienteId').value = ingrediente.ID_INGREDIENTE;
        document.getElementById('nombreIngrediente').value = ingrediente.NOMBRE || '';
        document.getElementById('stockIngrediente').value = ingrediente.STOCK || 0;
        document.getElementById('unidadIngrediente').value = ingrediente.UNIDAD_MEDIDA || 'kg';
    } catch (error) {
        app.showToast('Error cargando datos del ingrediente', 'error');
    }
}

window.guardarIngrediente = async function() {
    const form = document.getElementById('formIngrediente');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const ingredienteData = {
        ID_INGREDIENTE: parseInt(document.getElementById('ingredienteId').value) || 0,
        NOMBRE: document.getElementById('nombreIngrediente').value,
        STOCK: parseFloat(document.getElementById('stockIngrediente').value),
        UNIDAD_MEDIDA: document.getElementById('unidadIngrediente').value
    };
    
    try {
        if (ingredienteData.ID_INGREDIENTE > 0) {
            // Update
            await app.fetchData(`ingrediente/${ingredienteData.ID_INGREDIENTE}`, 'PUT', ingredienteData);
            app.showToast('Ingrediente actualizado correctamente');
        } else {
            // Create
            await app.fetchData('ingrediente', 'POST', ingredienteData);
            app.showToast('Ingrediente creado correctamente');
        }
        
        cerrarModalIngrediente();
        await cargarInventario();
    } catch (error) {
        app.showToast('Error guardando el ingrediente', 'error');
    }
};

window.editarIngrediente = function(id) {
    abrirModalIngrediente(id);
};

window.ajustarStock = async function(id) {
    const ajuste = prompt('Ingrese la cantidad a agregar (positivo) o quitar (negativo):', '0');
    
    if (ajuste === null) return;
    
    const cantidad = parseFloat(ajuste);
    if (isNaN(cantidad)) {
        app.showToast('Cantidad inválida', 'error');
        return;
    }
    
    try {
        const ingrediente = await app.fetchData(`ingrediente/${id}`);
        const nuevoStock = (ingrediente.STOCK || 0) + cantidad;
        
        if (nuevoStock < 0) {
            app.showToast('No hay suficiente stock para realizar esta operación', 'error');
            return;
        }
        
        ingrediente.STOCK = nuevoStock;
        await app.fetchData(`ingrediente/${id}`, 'PUT', ingrediente);
        
        app.showToast(`Stock actualizado a ${nuevoStock}`);
        await cargarInventario();
    } catch (error) {
        app.showToast('Error ajustando el stock', 'error');
    }
};

window.eliminarIngrediente = async function(id) {
    if (!confirm('¿Está seguro de eliminar este ingrediente?')) {
        return;
    }
    
    try {
        await app.fetchData(`ingrediente/${id}`, 'DELETE');
        app.showToast('Ingrediente eliminado correctamente');
        await cargarInventario();
    } catch (error) {
        app.showToast('Error eliminando el ingrediente', 'error');
    }
};