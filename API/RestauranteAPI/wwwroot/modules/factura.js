// modules/factura.js - Para manejar la facturación
window.generarFactura = async function(pedidoId) {
    try {
        // 1. Obtener detalles del pedido
        const detalles = await app.fetchData(`detallepedido/pedido/${pedidoId}`);
        const total = detalles.reduce((sum, d) => sum + ((d.CANTIDAD || 0) * (d.PRECIO_UNITARIO || 0)), 0);
        
        // 2. Crear factura en la base de datos
        const facturaData = {
            ID_PEDIDO: pedidoId,
            TOTAL: total,
            FECHA_EMISION: new Date().toISOString()
        };
        
        const resultado = await app.fetchData('factura', 'POST', facturaData);
        
        if (!resultado || !resultado.ID_FACTURA) {
            throw new Error('No se pudo crear la factura');
        }
        
        const facturaId = resultado.ID_FACTURA;
        
        // 3. Marcar pedido como facturado (opcional)
        try {
            const pedido = await app.fetchData(`pedido/${pedidoId}`);
            const pedidoActualizado = {
                ...pedido,
                FACTURADO: true,
                ESTADO: 'Facturado'
            };
            await app.fetchData(`pedido/${pedidoId}`, 'PUT', pedidoActualizado);
        } catch (error) {
            console.warn('No se pudo actualizar estado del pedido:', error);
        }
        
        // 4. Redirigir a factura.html
        const url = `factura.html?pedidoId=${pedidoId}&facturaId=${facturaId}`;
        window.open(url, '_blank');
        
        return facturaId;
        
    } catch (error) {
        console.error('Error generando factura:', error);
        throw error;
    }
};

// Función para obtener datos de la factura
window.obtenerDatosFactura = async function(pedidoId, facturaId) {
    try {
        // Obtener datos del pedido
        const pedido = await app.fetchData(`pedido/${pedidoId}`);
        
        // Obtener detalles del pedido
        const detalles = await app.fetchData(`detallepedido/pedido/${pedidoId}`);
        
        // Obtener información de mesa y mesero
        let mesaInfo = {};
        let meseroInfo = {};
        
        try {
            if (pedido.ID_MESA) {
                mesaInfo = await app.fetchData(`mesa/${pedido.ID_MESA}`);
            }
            if (pedido.ID_MESERO) {
                meseroInfo = await app.fetchData(`mesero/${pedido.ID_MESERO}`);
            }
        } catch (error) {
            console.warn('Error obteniendo información adicional:', error);
        }
        
        // Calcular total
        const total = detalles.reduce((sum, d) => sum + ((d.CANTIDAD || 0) * (d.PRECIO_UNITARIO || 0)), 0);
        
        return {
            pedido,
            detalles,
            total,
            mesaInfo,
            meseroInfo,
            facturaId
        };
        
    } catch (error) {
        console.error('Error obteniendo datos de factura:', error);
        throw error;
    }
};