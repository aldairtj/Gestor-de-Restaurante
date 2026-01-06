using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlatoIngredienteController : ControllerBase
    {
        private readonly string _connectionString;

        public PlatoIngredienteController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection");
        }

        [HttpGet]
        public ActionResult<IEnumerable<PlatoIngrediente>> GetPlatoIngredientes()
        {
            var platoIngredientes = new List<PlatoIngrediente>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_PLATO, ID_INGREDIENTE, CANTIDAD FROM PLATO_INGREDIENTE";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                platoIngredientes.Add(new PlatoIngrediente
                {
                    ID_PLATO = reader.GetInt32(0),
                    ID_INGREDIENTE = reader.GetInt32(1),
                    CANTIDAD = reader.IsDBNull(2) ? null : reader.GetDecimal(2)
                });
            }

            return Ok(platoIngredientes);
        }

        [HttpGet("plato/{idPlato}")]
        public ActionResult<IEnumerable<PlatoIngrediente>> GetIngredientesPorPlato(int idPlato)
        {
            var platoIngredientes = new List<PlatoIngrediente>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_PLATO, ID_INGREDIENTE, CANTIDAD FROM PLATO_INGREDIENTE WHERE ID_PLATO = @idPlato";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idPlato", idPlato);

            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                platoIngredientes.Add(new PlatoIngrediente
                {
                    ID_PLATO = reader.GetInt32(0),
                    ID_INGREDIENTE = reader.GetInt32(1),
                    CANTIDAD = reader.IsDBNull(2) ? null : reader.GetDecimal(2)
                });
            }

            return Ok(platoIngredientes);
        }

        [HttpGet("ingrediente/{idIngrediente}")]
        public ActionResult<IEnumerable<PlatoIngrediente>> GetPlatosPorIngrediente(int idIngrediente)
        {
            var platoIngredientes = new List<PlatoIngrediente>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_PLATO, ID_INGREDIENTE, CANTIDAD FROM PLATO_INGREDIENTE WHERE ID_INGREDIENTE = @idIngrediente";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idIngrediente", idIngrediente);

            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                platoIngredientes.Add(new PlatoIngrediente
                {
                    ID_PLATO = reader.GetInt32(0),
                    ID_INGREDIENTE = reader.GetInt32(1),
                    CANTIDAD = reader.IsDBNull(2) ? null : reader.GetDecimal(2)
                });
            }

            return Ok(platoIngredientes);
        }

        [HttpPost]
        public ActionResult CrearPlatoIngrediente(PlatoIngrediente platoIngrediente)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"INSERT INTO PLATO_INGREDIENTE (ID_PLATO, ID_INGREDIENTE, CANTIDAD)
                             VALUES (@idPlato, @idIngrediente, @cantidad)";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idPlato", platoIngrediente.ID_PLATO);
            cmd.Parameters.AddWithValue("@idIngrediente", platoIngrediente.ID_INGREDIENTE);
            cmd.Parameters.AddWithValue("@cantidad", platoIngrediente.CANTIDAD ?? (object)DBNull.Value);

            cmd.ExecuteNonQuery();

            return CreatedAtAction(nameof(GetPlatoIngredientes), platoIngrediente);
        }

        [HttpPut]
        public ActionResult ActualizarPlatoIngrediente(PlatoIngrediente platoIngrediente)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"UPDATE PLATO_INGREDIENTE
                             SET CANTIDAD = @cantidad
                             WHERE ID_PLATO = @idPlato AND ID_INGREDIENTE = @idIngrediente";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idPlato", platoIngrediente.ID_PLATO);
            cmd.Parameters.AddWithValue("@idIngrediente", platoIngrediente.ID_INGREDIENTE);
            cmd.Parameters.AddWithValue("@cantidad", platoIngrediente.CANTIDAD ?? (object)DBNull.Value);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{idPlato}/{idIngrediente}")]
        public ActionResult EliminarPlatoIngrediente(int idPlato, int idIngrediente)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM PLATO_INGREDIENTE WHERE ID_PLATO = @idPlato AND ID_INGREDIENTE = @idIngrediente";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idPlato", idPlato);
            cmd.Parameters.AddWithValue("@idIngrediente", idIngrediente);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }
}