using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IngredienteController : ControllerBase
    {
        private readonly string _connectionString;

        public IngredienteController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection");
        }

        [HttpGet]
        public ActionResult<IEnumerable<Ingrediente>> GetIngredientes()
        {
            var ingredientes = new List<Ingrediente>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_INGREDIENTE, NOMBRE, UNIDAD_MEDIDA, STOCK FROM INGREDIENTE";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                ingredientes.Add(new Ingrediente
                {
                    ID_INGREDIENTE = reader.GetInt32(0),
                    NOMBRE = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    UNIDAD_MEDIDA = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    STOCK = reader.IsDBNull(3) ? 0 : reader.GetDecimal(3)
                });
            }

            return Ok(ingredientes);
        }

        [HttpGet("{id}")]
        public ActionResult<Ingrediente> GetIngrediente(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_INGREDIENTE, NOMBRE, UNIDAD_MEDIDA, STOCK FROM INGREDIENTE WHERE ID_INGREDIENTE = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var ingrediente = new Ingrediente
                {
                    ID_INGREDIENTE = reader.GetInt32(0),
                    NOMBRE = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    UNIDAD_MEDIDA = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    STOCK = reader.IsDBNull(3) ? 0 : reader.GetDecimal(3)
                };

                return Ok(ingrediente);
            }

            return NotFound();
        }

        [HttpPost]
        public ActionResult CrearIngrediente(Ingrediente ingrediente)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"INSERT INTO INGREDIENTE (NOMBRE, UNIDAD_MEDIDA, STOCK)
                             VALUES (@nombre, @unidadMedida, @stock)
                             RETURNING ID_INGREDIENTE";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@nombre", ingrediente.NOMBRE ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@unidadMedida", ingrediente.UNIDAD_MEDIDA ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@stock", ingrediente.STOCK);

            int id = Convert.ToInt32(cmd.ExecuteScalar());
            ingrediente.ID_INGREDIENTE = id;

            return CreatedAtAction(nameof(GetIngrediente), new { id = id }, ingrediente);
        }

        [HttpPut("{id}")]
        public ActionResult ActualizarIngrediente(int id, Ingrediente ingrediente)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"UPDATE INGREDIENTE
                             SET NOMBRE = @nombre, 
                                 UNIDAD_MEDIDA = @unidadMedida, 
                                 STOCK = @stock
                             WHERE ID_INGREDIENTE = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@nombre", ingrediente.NOMBRE ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@unidadMedida", ingrediente.UNIDAD_MEDIDA ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@stock", ingrediente.STOCK);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult EliminarIngrediente(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM INGREDIENTE WHERE ID_INGREDIENTE = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }
}