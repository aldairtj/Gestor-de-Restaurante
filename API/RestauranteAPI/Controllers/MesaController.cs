using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MesaController : ControllerBase
    {
        private readonly string _connectionString;

        public MesaController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection");
        }

        [HttpGet]
        public ActionResult<IEnumerable<Mesa>> GetMesas()
        {
            var mesas = new List<Mesa>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_MESA, NUMERO, CAPACIDAD, POS_X, POS_Y FROM MESA";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                mesas.Add(new Mesa
                {
                    ID_MESA = reader.GetInt32(0),
                    NUMERO = reader.IsDBNull(1) ? 0 : reader.GetInt32(1),
                    CAPACIDAD = reader.IsDBNull(2) ? 0 : reader.GetInt32(2),
                    POS_X = reader.IsDBNull(3) ? null : reader.GetInt32(3),  // Corregido: de índice 4 a 3
                    POS_Y = reader.IsDBNull(4) ? null : reader.GetInt32(4)   // Corregido: de índice 5 a 4
                });
            }

            return Ok(mesas);
        }

        [HttpGet("{id}")]
        public ActionResult<Mesa> GetMesa(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_MESA, NUMERO, CAPACIDAD, POS_X, POS_Y FROM MESA WHERE ID_MESA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var mesa = new Mesa
                {
                    ID_MESA = reader.GetInt32(0),
                    NUMERO = reader.IsDBNull(1) ? 0 : reader.GetInt32(1),
                    CAPACIDAD = reader.IsDBNull(2) ? 0 : reader.GetInt32(2),
                    POS_X = reader.IsDBNull(3) ? null : reader.GetInt32(3),  // Corregido: de índice 4 a 3
                    POS_Y = reader.IsDBNull(4) ? null : reader.GetInt32(4)   // Corregido: de índice 5 a 4
                };

                return Ok(mesa);
            }

            return NotFound();
        }

        [HttpPost]
        public ActionResult CrearMesa(Mesa mesa)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"INSERT INTO MESA (NUMERO, CAPACIDAD, POS_X, POS_Y)
                             VALUES (@numero, @capacidad, @posX, @posY)
                             RETURNING ID_MESA";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@numero", mesa.NUMERO);
            cmd.Parameters.AddWithValue("@capacidad", mesa.CAPACIDAD);
            cmd.Parameters.AddWithValue("@posX", mesa.POS_X ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@posY", mesa.POS_Y ?? (object)DBNull.Value);

            int id = Convert.ToInt32(cmd.ExecuteScalar());
            mesa.ID_MESA = id;

            return CreatedAtAction(nameof(GetMesa), new { id = id }, mesa);
        }

        [HttpPut("{id}")]
        public ActionResult ActualizarMesa(int id, Mesa mesa)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"UPDATE MESA
                             SET NUMERO = @numero, 
                                 CAPACIDAD = @capacidad, 
                                 POS_X = @posX, 
                                 POS_Y = @posY
                             WHERE ID_MESA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@numero", mesa.NUMERO);
            cmd.Parameters.AddWithValue("@capacidad", mesa.CAPACIDAD);
            cmd.Parameters.AddWithValue("@posX", mesa.POS_X ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@posY", mesa.POS_Y ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult EliminarMesa(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM MESA WHERE ID_MESA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }
}