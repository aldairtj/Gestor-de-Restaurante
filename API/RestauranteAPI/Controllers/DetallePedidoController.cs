using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;
using Microsoft.Extensions.Logging;
using System.Data;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DetallePedidoController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly ILogger<DetallePedidoController> _logger;

        public DetallePedidoController(IConfiguration configuration, ILogger<DetallePedidoController> logger)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection");
            _logger = logger;
        }

        [HttpGet]
        public ActionResult<IEnumerable<DetallePedido>> GetDetallePedidos()
        {
            var detalles = new List<DetallePedido>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_DETALLE, ID_PEDIDO, ID_PLATO, CANTIDAD, PRECIO_UNITARIO FROM DETALLE_PEDIDO";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                detalles.Add(new DetallePedido
                {
                    ID_DETALLE = reader.GetInt32(0),
                    ID_PEDIDO = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                    ID_PLATO = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                    CANTIDAD = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    PRECIO_UNITARIO = reader.IsDBNull(4) ? null : reader.GetDecimal(4)
                });
            }

            return Ok(detalles);
        }

        [HttpGet("{id}")]
        public ActionResult<DetallePedido> GetDetallePedido(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_DETALLE, ID_PEDIDO, ID_PLATO, CANTIDAD, PRECIO_UNITARIO FROM DETALLE_PEDIDO WHERE ID_DETALLE = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var detalle = new DetallePedido
                {
                    ID_DETALLE = reader.GetInt32(0),
                    ID_PEDIDO = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                    ID_PLATO = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                    CANTIDAD = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    PRECIO_UNITARIO = reader.IsDBNull(4) ? null : reader.GetDecimal(4)
                };

                return Ok(detalle);
            }

            return NotFound(new { message = $"Detalle con ID {id} no encontrado" });
        }

        [HttpGet("pedido/{idPedido}")]
        public ActionResult<IEnumerable<DetallePedido>> GetDetallesPorPedido(int idPedido)
        {
            var detalles = new List<DetallePedido>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_DETALLE, ID_PEDIDO, ID_PLATO, CANTIDAD, PRECIO_UNITARIO FROM DETALLE_PEDIDO WHERE ID_PEDIDO = @idPedido";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idPedido", idPedido);

            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                detalles.Add(new DetallePedido
                {
                    ID_DETALLE = reader.GetInt32(0),
                    ID_PEDIDO = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                    ID_PLATO = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                    CANTIDAD = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    PRECIO_UNITARIO = reader.IsDBNull(4) ? null : reader.GetDecimal(4)
                });
            }

            return Ok(detalles);
        }

        [HttpPost]
        public ActionResult CrearDetallePedido(DetallePedido detalle)
        {
            try
            {
                using var con = new FbConnection(_connectionString);
                con.Open();

                string query = @"INSERT INTO DETALLE_PEDIDO (ID_PEDIDO, ID_PLATO, CANTIDAD, PRECIO_UNITARIO)
                                 VALUES (@idPedido, @idPlato, @cantidad, @precioUnitario)
                                 RETURNING ID_DETALLE";

                using var cmd = new FbCommand(query, con);
                cmd.Parameters.AddWithValue("@idPedido", detalle.ID_PEDIDO ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@idPlato", detalle.ID_PLATO ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@cantidad", detalle.CANTIDAD ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@precioUnitario", detalle.PRECIO_UNITARIO ?? (object)DBNull.Value);

                int id = Convert.ToInt32(cmd.ExecuteScalar());
                detalle.ID_DETALLE = id;

                return CreatedAtAction(nameof(GetDetallePedido), new { id = id }, detalle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creando detalle de pedido");
                return BadRequest(new { message = "Error creando detalle de pedido", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public ActionResult ActualizarDetallePedido(int id, DetallePedido detalle)
        {
            try
            {
                using var con = new FbConnection(_connectionString);
                con.Open();

                // Primero verificar si existe
                string checkQuery = "SELECT COUNT(*) FROM DETALLE_PEDIDO WHERE ID_DETALLE = @id";
                using var checkCmd = new FbCommand(checkQuery, con);
                checkCmd.Parameters.AddWithValue("@id", id);
                var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;

                if (!exists)
                {
                    return NotFound(new { message = $"Detalle con ID {id} no encontrado" });
                }

                string query = @"UPDATE DETALLE_PEDIDO
                                 SET ID_PEDIDO = @idPedido, 
                                     ID_PLATO = @idPlato, 
                                     CANTIDAD = @cantidad, 
                                     PRECIO_UNITARIO = @precioUnitario
                                 WHERE ID_DETALLE = @id";

                using var cmd = new FbCommand(query, con);
                cmd.Parameters.AddWithValue("@idPedido", detalle.ID_PEDIDO ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@idPlato", detalle.ID_PLATO ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@cantidad", detalle.CANTIDAD ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@precioUnitario", detalle.PRECIO_UNITARIO ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@id", id);

                int rows = cmd.ExecuteNonQuery();

                if (rows == 0)
                    return StatusCode(500, new { message = "Error actualizando detalle de pedido" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error actualizando detalle de pedido {id}");
                return BadRequest(new { message = "Error actualizando detalle de pedido", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public ActionResult EliminarDetallePedido(int id)
        {
            try
            {
                using var con = new FbConnection(_connectionString);
                con.Open();

                // 1. Primero obtener información del detalle para el mensaje de respuesta
                DetallePedido detalleInfo = null;
                string selectQuery = "SELECT ID_DETALLE, ID_PEDIDO, ID_PLATO, CANTIDAD FROM DETALLE_PEDIDO WHERE ID_DETALLE = @id";
                
                using (var selectCmd = new FbCommand(selectQuery, con))
                {
                    selectCmd.Parameters.AddWithValue("@id", id);
                    
                    using var reader = selectCmd.ExecuteReader();
                    if (reader.Read())
                    {
                        detalleInfo = new DetallePedido
                        {
                            ID_DETALLE = reader.GetInt32(0),
                            ID_PEDIDO = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                            ID_PLATO = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                            CANTIDAD = reader.IsDBNull(3) ? null : reader.GetInt32(3)
                        };
                    }
                }

                if (detalleInfo == null)
                {
                    return NotFound(new { message = $"Detalle con ID {id} no encontrado" });
                }

                // 2. Eliminar el detalle
                string deleteQuery = "DELETE FROM DETALLE_PEDIDO WHERE ID_DETALLE = @id";
                using var deleteCmd = new FbCommand(deleteQuery, con);
                deleteCmd.Parameters.AddWithValue("@id", id);
                
                int rowsAffected = deleteCmd.ExecuteNonQuery();

                if (rowsAffected == 0)
                {
                    return StatusCode(500, new { message = "No se pudo eliminar el detalle" });
                }

                // 3. Retornar respuesta exitosa
                return Ok(new 
                { 
                    message = $"Detalle #{id} eliminado exitosamente",
                    idDetalle = id,
                    idPedido = detalleInfo.ID_PEDIDO,
                    idPlato = detalleInfo.ID_PLATO,
                    cantidad = detalleInfo.CANTIDAD
                });
            }
            catch (FbException fbEx)
            {
                _logger.LogError(fbEx, $"Error Firebird eliminando detalle pedido {id}");
                
                // Verificar si es error de restricción de clave foránea
                if (fbEx.Message.Contains("foreign key") || fbEx.Message.Contains("FOREIGN KEY"))
                {
                    return BadRequest(new 
                    { 
                        message = $"No se puede eliminar el detalle #{id} porque está referenciado por otros registros.",
                        error = "Restricción de clave foránea"
                    });
                }
                
                return StatusCode(500, new 
                { 
                    message = $"Error de base de datos al eliminar el detalle #{id}",
                    error = fbEx.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error eliminando detalle pedido {id}");
                return StatusCode(500, new 
                { 
                    message = $"Error interno al eliminar el detalle #{id}",
                    error = ex.Message
                });
            }
        }
    }
}