using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlatoController : ControllerBase
    {
        private readonly string _connectionString;

        public PlatoController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection");
        }

        [HttpGet]
        public ActionResult<IEnumerable<Plato>> GetPlatos()
        {
            var platos = new List<Plato>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_PLATO, NOMBRE, PRECIO, ID_CATEGORIA FROM PLATO";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                platos.Add(new Plato
                {
                    ID_PLATO = reader.GetInt32(0),
                    NOMBRE = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    PRECIO = reader.IsDBNull(2) ? null : reader.GetDecimal(2),
                    ID_CATEGORIA = reader.IsDBNull(3) ? null : reader.GetInt32(3)
                });
            }

            return Ok(platos);
        }

        [HttpGet("{id}")]
        public ActionResult<Plato> GetPlato(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_PLATO, NOMBRE, PRECIO, ID_CATEGORIA FROM PLATO WHERE ID_PLATO = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var plato = new Plato
                {
                    ID_PLATO = reader.GetInt32(0),
                    NOMBRE = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    PRECIO = reader.IsDBNull(2) ? null : reader.GetDecimal(2),
                    ID_CATEGORIA = reader.IsDBNull(3) ? null : reader.GetInt32(3)
                };

                return Ok(plato);
            }

            return NotFound();
        }

        [HttpPost]
        public ActionResult CrearPlato(Plato plato)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"INSERT INTO PLATO (NOMBRE, PRECIO, ID_CATEGORIA)
                             VALUES (@nombre, @precio, @idCategoria)
                             RETURNING ID_PLATO";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@nombre", plato.NOMBRE ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@precio", plato.PRECIO ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@idCategoria", plato.ID_CATEGORIA ?? (object)DBNull.Value);

            int id = Convert.ToInt32(cmd.ExecuteScalar());
            plato.ID_PLATO = id;

            return CreatedAtAction(nameof(GetPlato), new { id = id }, plato);
        }

        [HttpPut("{id}")]
        public ActionResult ActualizarPlato(int id, Plato plato)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"UPDATE PLATO
                             SET NOMBRE = @nombre, 
                                 PRECIO = @precio, 
                                 ID_CATEGORIA = @idCategoria
                             WHERE ID_PLATO = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@nombre", plato.NOMBRE ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@precio", plato.PRECIO ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@idCategoria", plato.ID_CATEGORIA ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult EliminarPlato(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM PLATO WHERE ID_PLATO = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }
}