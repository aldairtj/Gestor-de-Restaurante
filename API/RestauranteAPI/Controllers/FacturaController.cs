using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FacturaController : ControllerBase
    {
        private readonly string _connectionString;

        public FacturaController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection");
        }

        [HttpGet]
        public ActionResult<IEnumerable<Factura>> GetFacturas()
        {
            var facturas = new List<Factura>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_FACTURA, ID_PEDIDO, FECHA_FACTURA, TOTAL FROM FACTURA";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                facturas.Add(new Factura
                {
                    ID_FACTURA = reader.GetInt32(0),
                    ID_PEDIDO = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                    FECHA_FACTURA = reader.IsDBNull(2) ? null : reader.GetDateTime(2),
                    TOTAL = reader.IsDBNull(3) ? null : reader.GetDecimal(3)
                });
            }

            return Ok(facturas);
        }

        [HttpGet("{id}")]
        public ActionResult<Factura> GetFactura(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_FACTURA, ID_PEDIDO, FECHA_FACTURA, TOTAL FROM FACTURA WHERE ID_FACTURA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var factura = new Factura
                {
                    ID_FACTURA = reader.GetInt32(0),
                    ID_PEDIDO = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                    FECHA_FACTURA = reader.IsDBNull(2) ? null : reader.GetDateTime(2),
                    TOTAL = reader.IsDBNull(3) ? null : reader.GetDecimal(3)
                };

                return Ok(factura);
            }

            return NotFound();
        }

        [HttpGet("pedido/{idPedido}")]
        public ActionResult<Factura> GetFacturaPorPedido(int idPedido)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_FACTURA, ID_PEDIDO, FECHA_FACTURA, TOTAL FROM FACTURA WHERE ID_PEDIDO = @idPedido";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idPedido", idPedido);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var factura = new Factura
                {
                    ID_FACTURA = reader.GetInt32(0),
                    ID_PEDIDO = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                    FECHA_FACTURA = reader.IsDBNull(2) ? null : reader.GetDateTime(2),
                    TOTAL = reader.IsDBNull(3) ? null : reader.GetDecimal(3)
                };

                return Ok(factura);
            }

            return NotFound();
        }

        [HttpPost]
        public ActionResult CrearFactura(Factura factura)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"INSERT INTO FACTURA (ID_PEDIDO, FECHA_FACTURA, TOTAL)
                             VALUES (@idPedido, @fechaFactura, @total)
                             RETURNING ID_FACTURA";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idPedido", factura.ID_PEDIDO ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@fechaFactura", factura.FECHA_FACTURA ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@total", factura.TOTAL ?? (object)DBNull.Value);

            int id = Convert.ToInt32(cmd.ExecuteScalar());
            factura.ID_FACTURA = id;

            return CreatedAtAction(nameof(GetFactura), new { id = id }, factura);
        }

        [HttpPut("{id}")]
        public ActionResult ActualizarFactura(int id, Factura factura)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"UPDATE FACTURA
                             SET ID_PEDIDO = @idPedido, 
                                 FECHA_FACTURA = @fechaFactura, 
                                 TOTAL = @total
                             WHERE ID_FACTURA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idPedido", factura.ID_PEDIDO ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@fechaFactura", factura.FECHA_FACTURA ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@total", factura.TOTAL ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult EliminarFactura(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM FACTURA WHERE ID_FACTURA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }
}