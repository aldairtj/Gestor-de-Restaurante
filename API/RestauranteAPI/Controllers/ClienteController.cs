using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClienteController : ControllerBase
    {
        private readonly string _connectionString;

        public ClienteController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection");
        }

        // ============================================================
        // GET: api/cliente
        // ============================================================
        [HttpGet]
        public ActionResult<IEnumerable<Cliente>> GetClientes()
        {
            var clientes = new List<Cliente>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_CLIENTE, NOMBRE, TELEFONO FROM CLIENTE";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                clientes.Add(new Cliente
                {
                    ID_CLIENTE = reader.GetInt32(0),
                    NOMBRE = reader.GetString(1),
                    TELEFONO = reader.IsDBNull(2) ? "" : reader.GetString(2)
                });
            }

            return Ok(clientes);
        }

        // ============================================================
        // GET: api/cliente/5
        // ============================================================
        [HttpGet("{id}")]
        public ActionResult<Cliente> GetCliente(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_CLIENTE, NOMBRE, TELEFONO FROM CLIENTE WHERE ID_CLIENTE = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var cliente = new Cliente
                {
                    ID_CLIENTE = reader.GetInt32(0),
                    NOMBRE = reader.GetString(1),
                    TELEFONO = reader.IsDBNull(2) ? "" : reader.GetString(2)
                };

                return Ok(cliente);
            }

            return NotFound();
        }

        // ============================================================
        // POST: api/cliente
        // ============================================================
        [HttpPost]
        public ActionResult CrearCliente(Cliente cliente)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"INSERT INTO CLIENTE (NOMBRE, TELEFONO)
                             VALUES (@nombre, @telefono)
                             RETURNING ID_CLIENTE";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@nombre", cliente.NOMBRE);
            cmd.Parameters.AddWithValue("@telefono", cliente.TELEFONO);

            int id = Convert.ToInt32(cmd.ExecuteScalar());
            cliente.ID_CLIENTE = id;

            return CreatedAtAction(nameof(GetCliente), new { id = id }, cliente);
        }

        // ============================================================
        // PUT: api/cliente/5
        // ============================================================
        [HttpPut("{id}")]
        public ActionResult ActualizarCliente(int id, Cliente cliente)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"UPDATE CLIENTE
                             SET NOMBRE = @nombre, TELEFONO = @telefono
                             WHERE ID_CLIENTE = @id";

            using var cmd = new FbCommand(query, con);

            cmd.Parameters.AddWithValue("@nombre", cliente.NOMBRE);
            cmd.Parameters.AddWithValue("@telefono", cliente.TELEFONO);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        // ============================================================
        // DELETE: api/cliente/5
        // ============================================================
        [HttpDelete("{id}")]
        public ActionResult EliminarCliente(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM CLIENTE WHERE ID_CLIENTE = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }
}
