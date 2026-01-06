using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PedidoController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly ILogger<PedidoController> _logger;

        public PedidoController(IConfiguration configuration, ILogger<PedidoController> logger)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection") ?? 
                throw new ArgumentNullException(nameof(configuration));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        public ActionResult<IEnumerable<Pedido>> GetPedidos()
        {
            try
            {
                var pedidos = new List<Pedido>();

                using var con = new FbConnection(_connectionString);
                con.Open();

                // AGREGAR ESTADO A LA CONSULTA
                string query = "SELECT ID_PEDIDO, ID_MESA, ID_MESERO, FECHA_PEDIDO, HORA_PEDIDO, ESTADO FROM PEDIDO ORDER BY ID_PEDIDO DESC";

                using var cmd = new FbCommand(query, con);
                using var reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    pedidos.Add(new Pedido
                    {
                        ID_PEDIDO = reader.GetInt32(0),
                        ID_MESA = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                        ID_MESERO = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                        FECHA_PEDIDO = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                        HORA_PEDIDO = reader.IsDBNull(4) ? null : TimeSpan.TryParse(reader.GetString(4), out var hora) ? hora : null,
                        ESTADO = reader.IsDBNull(5) ? "Pendiente" : reader.GetString(5) // NUEVO: Obtener estado
                    });
                }

                return Ok(pedidos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo pedidos");
                return StatusCode(500, new { error = "Error obteniendo pedidos", message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public ActionResult<Pedido> GetPedido(int id)
        {
            try
            {
                using var con = new FbConnection(_connectionString);
                con.Open();

                // AGREGAR ESTADO A LA CONSULTA
                string query = "SELECT ID_PEDIDO, ID_MESA, ID_MESERO, FECHA_PEDIDO, HORA_PEDIDO, ESTADO FROM PEDIDO WHERE ID_PEDIDO = @id";

                using var cmd = new FbCommand(query, con);
                cmd.Parameters.AddWithValue("@id", id);

                using var reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    var pedido = new Pedido
                    {
                        ID_PEDIDO = reader.GetInt32(0),
                        ID_MESA = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                        ID_MESERO = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                        FECHA_PEDIDO = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                        HORA_PEDIDO = reader.IsDBNull(4) ? null : TimeSpan.TryParse(reader.GetString(4), out var hora) ? hora : null,
                        ESTADO = reader.IsDBNull(5) ? "Pendiente" : reader.GetString(5) // NUEVO: Obtener estado
                    };

                    return Ok(pedido);
                }

                return NotFound(new { message = $"Pedido con ID {id} no encontrado" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error obteniendo pedido {id}");
                return StatusCode(500, new { error = "Error obteniendo pedido", message = ex.Message });
            }
        }

        [HttpPost]
        public ActionResult CrearPedido([FromBody] Pedido pedido)
        {
            try
            {
                _logger.LogInformation($"=== INTENTANDO CREAR PEDIDO ===");
                _logger.LogInformation($"Datos recibidos: ID_MESA={pedido?.ID_MESA}, ID_MESERO={pedido?.ID_MESERO}, ESTADO={pedido?.ESTADO}");
                
                if (pedido == null)
                {
                    return BadRequest(new { error = "El pedido no puede ser nulo" });
                }

                using var con = new FbConnection(_connectionString);
                con.Open();

                // ============================================
                // NUEVA VALIDACIÓN: VERIFICAR SI LA MESA TIENE PEDIDOS ACTIVOS
                // ============================================
                if (pedido.ID_MESA.HasValue)
                {
                    string hoy = DateTime.Now.ToString("yyyy-MM-dd");
                    
                    string checkPedidosActivosQuery = @"
                        SELECT COUNT(*) FROM PEDIDO p 
                        LEFT JOIN FACTURA f ON p.ID_PEDIDO = f.ID_PEDIDO
                        WHERE p.ID_MESA = @idMesa 
                        AND CAST(p.FECHA_PEDIDO AS DATE) = CAST(@hoy AS DATE)
                        AND f.ID_FACTURA IS NULL";
                    
                    using var checkPedidosCmd = new FbCommand(checkPedidosActivosQuery, con);
                    checkPedidosCmd.Parameters.AddWithValue("@idMesa", pedido.ID_MESA.Value);
                    checkPedidosCmd.Parameters.AddWithValue("@hoy", hoy);
                    
                    int pedidosActivos = Convert.ToInt32(checkPedidosCmd.ExecuteScalar());
                    
                    if (pedidosActivos > 0)
                    {
                        _logger.LogWarning($"Mesa {pedido.ID_MESA.Value} tiene {pedidosActivos} pedidos activos sin facturar");
                        return BadRequest(new { 
                            error = $"La mesa {pedido.ID_MESA.Value} ya tiene pedidos activos", 
                            message = "Debes facturar los pedidos existentes antes de crear uno nuevo",
                            mesaId = pedido.ID_MESA.Value
                        });
                    }
                }

                // OBTENER LOS IDs REALES DE LA BASE DE DATOS
                int mesaId;
                int meseroId;

                // Si no se proporciona ID_MESA, obtener la primera mesa disponible
                if (!pedido.ID_MESA.HasValue || pedido.ID_MESA.Value <= 0)
                {
                    var getMesaCmd = new FbCommand("SELECT FIRST 1 ID_MESA FROM MESA ORDER BY ID_MESA", con);
                    var result = getMesaCmd.ExecuteScalar();
                    if (result == null || result == DBNull.Value)
                    {
                        return BadRequest(new { error = "No hay mesas disponibles en la base de datos" });
                    }
                    mesaId = Convert.ToInt32(result);
                    _logger.LogInformation($"Usando primera mesa disponible: ID={mesaId}");
                }
                else
                {
                    mesaId = pedido.ID_MESA.Value;
                }

                // Verificar que la mesa existe
                var checkMesa = new FbCommand("SELECT COUNT(*) FROM MESA WHERE ID_MESA = @id", con);
                checkMesa.Parameters.AddWithValue("@id", mesaId);
                if (Convert.ToInt32(checkMesa.ExecuteScalar()) == 0)
                {
                    return BadRequest(new { error = $"La mesa con ID {mesaId} no existe" });
                }

                // Si no se proporciona ID_MESERO, obtener el primer mesero disponible
                if (!pedido.ID_MESERO.HasValue || pedido.ID_MESERO.Value <= 0)
                {
                    var getMeseroCmd = new FbCommand("SELECT FIRST 1 ID_MESERO FROM MESERO ORDER BY ID_MESERO", con);
                    var result = getMeseroCmd.ExecuteScalar();
                    if (result == null || result == DBNull.Value)
                    {
                        return BadRequest(new { error = "No hay meseros disponibles en la base de datos" });
                    }
                    meseroId = Convert.ToInt32(result);
                    _logger.LogInformation($"Usando primer mesero disponible: ID={meseroId}");
                }
                else
                {
                    meseroId = pedido.ID_MESERO.Value;
                }

                // Verificar que el mesero existe
                var checkMesero = new FbCommand("SELECT COUNT(*) FROM MESERO WHERE ID_MESERO = @id", con);
                checkMesero.Parameters.AddWithValue("@id", meseroId);
                if (Convert.ToInt32(checkMesero.ExecuteScalar()) == 0)
                {
                    return BadRequest(new { error = $"El mesero con ID {meseroId} no existe" });
                }

                _logger.LogInformation($"Usando: Mesa ID={mesaId}, Mesero ID={meseroId}");

                // PREPARAR FECHA, HORA Y ESTADO
                DateTime fecha = pedido.FECHA_PEDIDO ?? DateTime.Now.Date;
                TimeSpan hora = pedido.HORA_PEDIDO ?? DateTime.Now.TimeOfDay;
                string estado = !string.IsNullOrWhiteSpace(pedido.ESTADO) ? pedido.ESTADO : "Pendiente";
                
                // INSERTAR PEDIDO (AGREGAR ESTADO)
                string query = @"INSERT INTO PEDIDO (ID_MESA, ID_MESERO, FECHA_PEDIDO, HORA_PEDIDO, ESTADO)
                                VALUES (@idMesa, @idMesero, @fechaPedido, @horaPedido, @estado)
                                RETURNING ID_PEDIDO";

                using var cmd = new FbCommand(query, con);
                cmd.Parameters.AddWithValue("@idMesa", mesaId);
                cmd.Parameters.AddWithValue("@idMesero", meseroId);
                cmd.Parameters.AddWithValue("@fechaPedido", fecha);
                cmd.Parameters.AddWithValue("@horaPedido", hora.ToString(@"hh\:mm\:ss"));
                cmd.Parameters.AddWithValue("@estado", estado);

                int idNuevo = Convert.ToInt32(cmd.ExecuteScalar());
                _logger.LogInformation($"✅ Pedido creado con ID: {idNuevo}, Estado: {estado}");

                // OBTENER EL PEDIDO RECIÉN CREADO (INCLUYENDO ESTADO)
                var getQuery = "SELECT ID_PEDIDO, ID_MESA, ID_MESERO, FECHA_PEDIDO, HORA_PEDIDO, ESTADO FROM PEDIDO WHERE ID_PEDIDO = @id";
                using var getCmd = new FbCommand(getQuery, con);
                getCmd.Parameters.AddWithValue("@id", idNuevo);
                
                using var reader = getCmd.ExecuteReader();
                if (reader.Read())
                {
                    var pedidoCreado = new Pedido
                    {
                        ID_PEDIDO = reader.GetInt32(0),
                        ID_MESA = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                        ID_MESERO = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                        FECHA_PEDIDO = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                        HORA_PEDIDO = reader.IsDBNull(4) ? null : TimeSpan.TryParse(reader.GetString(4), out var horaLeida) ? horaLeida : null,
                        ESTADO = reader.IsDBNull(5) ? "Pendiente" : reader.GetString(5) // NUEVO
                    };
                    
                    // Devuelve el pedido creado
                    return CreatedAtAction(nameof(GetPedido), new { id = idNuevo }, pedidoCreado);
                }
                else
                {
                    return StatusCode(500, new { error = "Pedido creado pero no se pudo recuperar" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"=== ERROR CREANDO PEDIDO ===");
                
                return StatusCode(500, new { 
                    error = "Error interno del servidor",
                    message = ex.Message,
                    type = ex.GetType().Name
                });
            }
        }

        [HttpPut("{id}")]
        public ActionResult ActualizarPedido(int id, [FromBody] Pedido pedido)
        {
            try
            {
                _logger.LogInformation($"=== ACTUALIZANDO PEDIDO {id} ===");
                _logger.LogInformation($"Datos recibidos: Estado={pedido?.ESTADO}");
                
                if (pedido == null)
                    return BadRequest(new { error = "El pedido no puede ser nulo" });

                using var con = new FbConnection(_connectionString);
                con.Open();

                // Primero verificar si existe
                string checkQuery = "SELECT COUNT(*) FROM PEDIDO WHERE ID_PEDIDO = @id";
                using var checkCmd = new FbCommand(checkQuery, con);
                checkCmd.Parameters.AddWithValue("@id", id);
                var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;

                if (!exists)
                {
                    return NotFound(new { message = $"Pedido con ID {id} no encontrado" });
                }

                // Obtener el pedido actual para mantener los valores no proporcionados
                var pedidoActual = GetPedidoFromDb(con, id);
                
                // ACTUALIZAR PEDIDO CON ESTADO
                string query = @"UPDATE PEDIDO
                                 SET ID_MESA = @idMesa, 
                                     ID_MESERO = @idMesero, 
                                     FECHA_PEDIDO = @fechaPedido, 
                                     HORA_PEDIDO = @horaPedido,
                                     ESTADO = @estado
                                 WHERE ID_PEDIDO = @id";

                using var cmd = new FbCommand(query, con);
                
                // Usar valores del pedido recibido o mantener los actuales
                cmd.Parameters.AddWithValue("@idMesa", pedido.ID_MESA ?? pedidoActual.ID_MESA ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@idMesero", pedido.ID_MESERO ?? pedidoActual.ID_MESERO ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@fechaPedido", pedido.FECHA_PEDIDO ?? pedidoActual.FECHA_PEDIDO ?? (object)DBNull.Value);
                
                if (pedido.HORA_PEDIDO.HasValue)
                    cmd.Parameters.AddWithValue("@horaPedido", pedido.HORA_PEDIDO.Value.ToString(@"hh\:mm\:ss"));
                else if (pedidoActual.HORA_PEDIDO.HasValue)
                    cmd.Parameters.AddWithValue("@horaPedido", pedidoActual.HORA_PEDIDO.Value.ToString(@"hh\:mm\:ss"));
                else
                    cmd.Parameters.AddWithValue("@horaPedido", DBNull.Value);
                
                // Estado: usar el proporcionado o mantener el actual
                string estado = !string.IsNullOrWhiteSpace(pedido.ESTADO) ? pedido.ESTADO : pedidoActual.ESTADO ?? "Pendiente";
                cmd.Parameters.AddWithValue("@estado", estado);
                
                cmd.Parameters.AddWithValue("@id", id);

                int rows = cmd.ExecuteNonQuery();

                if (rows == 0)
                    return StatusCode(500, new { error = "No se pudo actualizar el pedido" });

                _logger.LogInformation($"✅ Pedido {id} actualizado. Nuevo estado: {estado}");
                
                // Obtener y devolver el pedido actualizado
                var pedidoActualizado = GetPedidoFromDb(con, id);
                return Ok(pedidoActualizado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error actualizando pedido {id}");
                return StatusCode(500, new { error = "Error actualizando pedido", message = ex.Message });
            }
        }

        // Método auxiliar para obtener pedido desde la BD
        private Pedido GetPedidoFromDb(FbConnection con, int id)
        {
            string query = "SELECT ID_PEDIDO, ID_MESA, ID_MESERO, FECHA_PEDIDO, HORA_PEDIDO, ESTADO FROM PEDIDO WHERE ID_PEDIDO = @id";
            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);
            
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                return new Pedido
                {
                    ID_PEDIDO = reader.GetInt32(0),
                    ID_MESA = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                    ID_MESERO = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                    FECHA_PEDIDO = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                    HORA_PEDIDO = reader.IsDBNull(4) ? null : TimeSpan.TryParse(reader.GetString(4), out var hora) ? hora : null,
                    ESTADO = reader.IsDBNull(5) ? "Pendiente" : reader.GetString(5)
                };
            }
            return null;
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarPedido(int id)
        {
            FbConnection con = null;
            FbTransaction transaction = null;
            
            try
            {
                con = new FbConnection(_connectionString);
                await con.OpenAsync();
                transaction = await con.BeginTransactionAsync();

                // 1. Verificar si el pedido existe
                string checkQuery = "SELECT COUNT(*) FROM PEDIDO WHERE ID_PEDIDO = @id";
                using var checkCmd = new FbCommand(checkQuery, con, transaction);
                checkCmd.Parameters.AddWithValue("@id", id);
                
                var exists = Convert.ToInt32(await checkCmd.ExecuteScalarAsync()) > 0;
                if (!exists)
                {
                    return NotFound(new { message = $"Pedido con ID {id} no encontrado" });
                }

                // 2. Obtener información para el mensaje de respuesta
                int detallesEliminados = 0;
                bool facturaEliminada = false;

                // 3. Verificar y eliminar factura si existe
                string facturaQuery = "SELECT ID_FACTURA FROM FACTURA WHERE ID_PEDIDO = @id";
                using var facturaCmd = new FbCommand(facturaQuery, con, transaction);
                facturaCmd.Parameters.AddWithValue("@id", id);
                
                var facturaIdObj = await facturaCmd.ExecuteScalarAsync();
                if (facturaIdObj != null && facturaIdObj != DBNull.Value)
                {
                    int facturaId = Convert.ToInt32(facturaIdObj);
                    
                    string deleteFacturaQuery = "DELETE FROM FACTURA WHERE ID_FACTURA = @facturaId";
                    using var deleteFacturaCmd = new FbCommand(deleteFacturaQuery, con, transaction);
                    deleteFacturaCmd.Parameters.AddWithValue("@facturaId", facturaId);
                    
                    await deleteFacturaCmd.ExecuteNonQueryAsync();
                    facturaEliminada = true;
                    _logger.LogInformation($"Factura {facturaId} eliminada para pedido {id}");
                }

                // 4. Eliminar detalles del pedido
                string deleteDetallesQuery = "DELETE FROM DETALLE_PEDIDO WHERE ID_PEDIDO = @id";
                using var deleteDetallesCmd = new FbCommand(deleteDetallesQuery, con, transaction);
                deleteDetallesCmd.Parameters.AddWithValue("@id", id);
                
                detallesEliminados = await deleteDetallesCmd.ExecuteNonQueryAsync();
                _logger.LogInformation($"{detallesEliminados} detalles eliminados para pedido {id}");

                // 5. Finalmente eliminar el pedido
                string deletePedidoQuery = "DELETE FROM PEDIDO WHERE ID_PEDIDO = @id";
                using var deletePedidoCmd = new FbCommand(deletePedidoQuery, con, transaction);
                deletePedidoCmd.Parameters.AddWithValue("@id", id);
                
                int pedidoEliminado = await deletePedidoCmd.ExecuteNonQueryAsync();

                if (pedidoEliminado == 0)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { message = "No se pudo eliminar el pedido" });
                }

                // 6. Confirmar la transacción
                await transaction.CommitAsync();
                _logger.LogInformation($"Pedido {id} eliminado exitosamente");

                return Ok(new 
                { 
                    message = $"Pedido #{id} eliminado exitosamente",
                    detallesEliminados = detallesEliminados,
                    facturaEliminada = facturaEliminada
                });
            }
            catch (FbException fbEx)
            {
                if (transaction != null)
                    await transaction.RollbackAsync();
                    
                _logger.LogError(fbEx, $"Error Firebird eliminando pedido {id}");
                
                if (fbEx.Message.Contains("foreign key") || fbEx.Message.Contains("FOREIGN KEY"))
                {
                    return BadRequest(new 
                    { 
                        message = $"No se puede eliminar el pedido #{id} porque tiene registros relacionados en otras tablas.",
                        error = "Restricción de clave foránea",
                        suggestion = "Elimine primero todos los detalles y facturas asociadas."
                    });
                }
                
                return StatusCode(500, new 
                { 
                    message = $"Error de base de datos al eliminar el pedido #{id}",
                    error = fbEx.Message
                });
            }
            catch (Exception ex)
            {
                if (transaction != null)
                    await transaction.RollbackAsync();
                    
                _logger.LogError(ex, $"Error eliminando pedido {id}");
                return StatusCode(500, new 
                { 
                    message = $"Error interno al eliminar el pedido #{id}",
                    error = ex.Message
                });
            }
            finally
            {
                if (transaction != null)
                    await transaction.DisposeAsync();
                    
                if (con != null)
                    await con.CloseAsync();
            }
        }
    }
}