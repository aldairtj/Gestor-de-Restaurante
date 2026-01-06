// Platos Module
// Platos Module
window.loadPlatos = async function() {
    if (window.permisosManager && window.permisosManager.isMesero()) {
        // Cargar versión simplificada para meseros
        return;
    }
    
    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div class="table-header">
            <h3>Gestión de Platos</h3>
            <button class="btn btn-primary" onclick="abrirModalPlato()">
                <i class="fas fa-plus"></i> Nuevo Plato
            </button>
        </div>
        
        <div class="table-container">
            <table id="platosTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Precio</th>
                        <th>Categoría</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Data will be loaded here -->
                </tbody>
            </table>
        </div>
        
        <!-- Modal para Plato -->
        <div class="modal" id="modalPlato">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalPlatoTitle">Nuevo Plato</h3>
                    <button class="btn btn-icon" onclick="cerrarModalPlato()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formPlato">
                        <input type="hidden" id="platoId" value="0">
                        
                        <div class="form-group">
                            <label class="form-label" for="nombrePlato">Nombre *</label>
                            <input type="text" id="nombrePlato" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="precioPlato">Precio ($) *</label>
                            <input type="number" id="precioPlato" class="form-control" required min="0" step="0.01">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="categoriaPlato">Categoría</label>
                            <select id="categoriaPlato" class="form-control"></select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalPlato()">Cancelar</button>
                    <button class="btn btn-primary" onclick="guardarPlato()">Guardar</button>
                </div>
            </div>
        </div>
        
        <!-- Modal para Ingredientes del Plato -->
        <div class="modal" id="modalIngredientes">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 id="modalIngredientesTitle">Ingredientes del Plato</h3>
                    <button class="btn btn-icon" onclick="cerrarModalIngredientes()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <select id="selectIngrediente" class="form-control" style="flex: 1;">
                                <option value="">Seleccionar ingrediente...</option>
                            </select>
                            <input type="number" id="cantidadIngrediente" class="form-control" placeholder="Cantidad" style="width: 120px;" min="0" step="0.01">
                            <button class="btn btn-primary" onclick="agregarIngrediente()">
                                <i class="fas fa-plus"></i> Agregar
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                        <table id="ingredientesTable">
                            <thead>
                                <tr>
                                    <th>Ingrediente</th>
                                    <th>Cantidad</th>
                                    <th>Unidad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="ingredientesTableBody">
                                <!-- Ingredientes se cargarán aquí -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalIngredientes()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    await cargarPlatos();
    await cargarCategoriasSelect();
};

// Variables globales para gestionar ingredientes
let currentPlatoId = 0;
let currentPlatoNombre = '';
let ingredientesDisponibles = [];
let ingredientesPlato = [];

async function cargarPlatos() {
    try {
        const platos = await app.fetchData('plato');
        const categorias = await app.loadTableData('categoria');
        
        const tbody = document.querySelector('#platosTable tbody');
        
        if (platos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        No hay platos registrados
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = platos.map(plato => {
            const categoria = categorias.find(c => c.ID_CATEGORIA === plato.ID_CATEGORIA);
            
            return `
                <tr>
                    <td>${plato.ID_PLATO}</td>
                    <td>${plato.NOMBRE || 'N/A'}</td>
                    <td>$${plato.PRECIO ? plato.PRECIO.toFixed(2) : '0.00'}</td>
                    <td>${categoria ? categoria.NOMBRE : 'Sin categoría'}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="editarPlato(${plato.ID_PLATO})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="verIngredientes(${plato.ID_PLATO}, '${plato.NOMBRE || ''}')" title="Ver Ingredientes">
                            <i class="fas fa-list"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarPlato(${plato.ID_PLATO})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        const tbody = document.querySelector('#platosTable tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--error);">
                    Error cargando platos: ${error.message}
                </td>
            </tr>
        `;
    }
}

async function cargarCategoriasSelect() {
    try {
        const categorias = await app.fetchData('categoria');
        const select = document.getElementById('categoriaPlato');
        
        select.innerHTML = '<option value="">Sin categoría</option>';
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.ID_CATEGORIA;
            option.textContent = categoria.NOMBRE;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

window.abrirModalPlato = function(platoId = 0) {
    const modal = document.getElementById('modalPlato');
    const title = document.getElementById('modalPlatoTitle');
    const form = document.getElementById('formPlato');
    
    if (platoId > 0) {
        title.textContent = 'Editar Plato';
        cargarDatosPlato(platoId);
    } else {
        title.textContent = 'Nuevo Plato';
        form.reset();
        document.getElementById('platoId').value = '0';
    }
    
    modal.style.display = 'flex';
};

window.cerrarModalPlato = function() {
    document.getElementById('modalPlato').style.display = 'none';
};

async function cargarDatosPlato(id) {
    try {
        const plato = await app.fetchData(`plato/${id}`);
        
        document.getElementById('platoId').value = plato.ID_PLATO;
        document.getElementById('nombrePlato').value = plato.NOMBRE || '';
        document.getElementById('precioPlato').value = plato.PRECIO || '';
        document.getElementById('categoriaPlato').value = plato.ID_CATEGORIA || '';
    } catch (error) {
        app.showToast('Error cargando datos del plato', 'error');
    }
}

window.guardarPlato = async function() {
    const form = document.getElementById('formPlato');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const platoData = {
        ID_PLATO: parseInt(document.getElementById('platoId').value) || 0,
        NOMBRE: document.getElementById('nombrePlato').value,
        PRECIO: parseFloat(document.getElementById('precioPlato').value),
        ID_CATEGORIA: document.getElementById('categoriaPlato').value ? 
                     parseInt(document.getElementById('categoriaPlato').value) : null
    };
    
    try {
        if (platoData.ID_PLATO > 0) {
            // Update
            await app.fetchData(`plato/${platoData.ID_PLATO}`, 'PUT', platoData);
            app.showToast('Plato actualizado correctamente');
        } else {
            // Create
            await app.fetchData('plato', 'POST', platoData);
            app.showToast('Plato creado correctamente');
        }
        
        cerrarModalPlato();
        await cargarPlatos();
    } catch (error) {
        app.showToast('Error guardando el plato', 'error');
    }
};

window.editarPlato = function(id) {
    abrirModalPlato(id);
};

window.verIngredientes = async function(id, nombre) {
    currentPlatoId = id;
    currentPlatoNombre = nombre;
    
    // Cargar ingredientes disponibles
    await cargarIngredientesDisponibles();
    
    // Cargar ingredientes del plato
    await cargarIngredientesPlato();
    
    // Mostrar modal
    const modal = document.getElementById('modalIngredientes');
    const title = document.getElementById('modalIngredientesTitle');
    title.textContent = `Ingredientes: ${nombre}`;
    
    modal.style.display = 'flex';
};

async function cargarIngredientesDisponibles() {
    try {
        ingredientesDisponibles = await app.fetchData('ingrediente');
        const select = document.getElementById('selectIngrediente');
        
        // Filtrar ingredientes que ya están en el plato
        const ingredientesYaAgregados = ingredientesPlato.map(ip => ip.ID_INGREDIENTE);
        const ingredientesFiltrados = ingredientesDisponibles.filter(
            ing => !ingredientesYaAgregados.includes(ing.ID_INGREDIENTE)
        );
        
        select.innerHTML = '<option value="">Seleccionar ingrediente...</option>';
        ingredientesFiltrados.forEach(ingrediente => {
            const option = document.createElement('option');
            option.value = ingrediente.ID_INGREDIENTE;
            option.textContent = `${ingrediente.NOMBRE} (${ingrediente.UNIDAD_MEDIDA})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando ingredientes:', error);
        app.showToast('Error cargando ingredientes disponibles', 'error');
    }
}

async function cargarIngredientesPlato() {
    try {
        // Usar la ruta específica del controlador
        const response = await app.fetchData(`platoingrediente/plato/${currentPlatoId}`);
        ingredientesPlato = response;
        
        // También necesitamos los detalles de cada ingrediente
        const detallesIngredientes = await Promise.all(
            ingredientesPlato.map(async (pi) => {
                const ingrediente = await app.fetchData(`ingrediente/${pi.ID_INGREDIENTE}`);
                return {
                    ...pi,
                    NOMBRE: ingrediente.NOMBRE,
                    UNIDAD_MEDIDA: ingrediente.UNIDAD_MEDIDA
                };
            })
        );
        
        mostrarIngredientesPlato(detallesIngredientes);
    } catch (error) {
        console.error('Error cargando ingredientes del plato:', error);
        ingredientesPlato = [];
        mostrarIngredientesPlato([]);
    }
}

function mostrarIngredientesPlato(ingredientesDetallados) {
    const tbody = document.getElementById('ingredientesTableBody');
    
    if (ingredientesDetallados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px;">
                    No hay ingredientes agregados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = ingredientesDetallados.map(item => `
        <tr>
            <td>${item.NOMBRE || 'N/A'}</td>
            <td>${item.CANTIDAD || '0'}</td>
            <td>${item.UNIDAD_MEDIDA || ''}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="eliminarIngredientePlato(${item.ID_INGREDIENTE})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function agregarIngrediente() {
    const select = document.getElementById('selectIngrediente');
    const cantidadInput = document.getElementById('cantidadIngrediente');
    
    const ingredienteId = parseInt(select.value);
    const cantidad = parseFloat(cantidadInput.value);
    
    if (!ingredienteId || isNaN(cantidad) || cantidad <= 0) {
        app.showToast('Seleccione un ingrediente y especifique una cantidad válida', 'warning');
        return;
    }
    
    try {
        const platoIngrediente = {
            ID_PLATO: currentPlatoId,
            ID_INGREDIENTE: ingredienteId,
            CANTIDAD: cantidad
        };
        
        // Usar el endpoint del controlador PlatoIngrediente
        await app.fetchData('platoingrediente', 'POST', platoIngrediente);
        
        // Actualizar listas
        await cargarIngredientesDisponibles();
        await cargarIngredientesPlato();
        
        // Limpiar inputs
        select.value = '';
        cantidadInput.value = '';
        
        app.showToast('Ingrediente agregado correctamente');
    } catch (error) {
        app.showToast('Error agregando el ingrediente', 'error');
        console.error('Error:', error);
    }
}

async function eliminarIngredientePlato(ingredienteId) {
    if (!confirm('¿Está seguro de eliminar este ingrediente del plato?')) {
        return;
    }
    
    try {
        // Usar el endpoint DELETE específico del controlador PlatoIngrediente
        await app.fetchData(`platoingrediente/${currentPlatoId}/${ingredienteId}`, 'DELETE');
        
        // Actualizar listas
        await cargarIngredientesDisponibles();
        await cargarIngredientesPlato();
        
        app.showToast('Ingrediente eliminado correctamente');
    } catch (error) {
        app.showToast('Error eliminando el ingrediente', 'error');
        console.error('Error:', error);
    }
}

window.cerrarModalIngredientes = function() {
    document.getElementById('modalIngredientes').style.display = 'none';
    currentPlatoId = 0;
    currentPlatoNombre = '';
    ingredientesPlato = [];
};

window.guardarPlato = async function() {
    const form = document.getElementById('formPlato');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const platoData = {
        ID_PLATO: parseInt(document.getElementById('platoId').value) || 0,
        NOMBRE: document.getElementById('nombrePlato').value,
        PRECIO: parseFloat(document.getElementById('precioPlato').value),
        ID_CATEGORIA: document.getElementById('categoriaPlato').value ? 
                     parseInt(document.getElementById('categoriaPlato').value) : null
    };
    
    try {
        if (platoData.ID_PLATO > 0) {
            // Update
            await app.fetchData(`plato/${platoData.ID_PLATO}`, 'PUT', platoData);
            app.showToast('Plato actualizado correctamente');
        } else {
            // Create
            await app.fetchData('plato', 'POST', platoData);
            app.showToast('Plato creado correctamente');
        }
        
        cerrarModalPlato();
        await cargarPlatos();
    } catch (error) {
        app.showToast('Error guardando el plato', 'error');
    }
};

window.editarPlato = function(id) {
    abrirModalPlato(id);
};

window.eliminarPlato = async function(id) {
    if (!confirm('¿Está seguro de eliminar este plato?')) {
        return;
    }
    
    try {
        // Primero, eliminar los ingredientes asociados
        try {
            const ingredientes = await app.fetchData(`platoingrediente/plato/${id}`);
            for (const ingrediente of ingredientes) {
                await app.fetchData(`platoingrediente/${id}/${ingrediente.ID_INGREDIENTE}`, 'DELETE');
            }
        } catch (error) {
            console.warn('No se pudieron eliminar los ingredientes asociados:', error);
        }
        
        // Luego eliminar el plato
        await app.fetchData(`plato/${id}`, 'DELETE');
        app.showToast('Plato eliminado correctamente');
        await cargarPlatos();
    } catch (error) {
        app.showToast('Error eliminando el plato', 'error');
    }
};