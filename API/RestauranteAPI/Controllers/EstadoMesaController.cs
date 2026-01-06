using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;
using System.Globalization;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EstadoMesaController : ControllerBase
    {
        private readonly string _connectionString;

        public EstadoMesaController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection") ?? 
                throw new ArgumentNullException(nameof(configuration));
        }

        [HttpGet]
        public ActionResult<IEnumerable<EstadoMesa>> GetEstadosMesa()
        {
            var estados = new List<EstadoMesa>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_ESTADO, ID_MESA, FECHA, HORA_INICIO, HORA_FIN, ESTADO FROM ESTADO_MESA";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                estados.Add(new EstadoMesa
                {
                    ID_ESTADO = reader.GetInt32(0),
                    ID_MESA = reader.GetInt32(1),
                    FECHA = reader.GetDateTime(2),
                    HORA_INICIO = TimeSpan.TryParse(reader.IsDBNull(3) ? null : reader.GetString(3), out var inicio) ? inicio : TimeSpan.Zero,
                    HORA_FIN = TimeSpan.TryParse(reader.IsDBNull(4) ? null : reader.GetString(4), out var fin) ? fin : TimeSpan.Zero,
                    ESTADO = reader.IsDBNull(5) ? null : reader.GetString(5)
                });
            }

            return Ok(estados);
        }

        [HttpGet("{id}")]
        public ActionResult<EstadoMesa> GetEstadoMesa(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_ESTADO, ID_MESA, FECHA, HORA_INICIO, HORA_FIN, ESTADO FROM ESTADO_MESA WHERE ID_ESTADO = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var estado = new EstadoMesa
                {
                    ID_ESTADO = reader.GetInt32(0),
                    ID_MESA = reader.GetInt32(1),
                    FECHA = reader.GetDateTime(2),
                    HORA_INICIO = TimeSpan.TryParse(reader.IsDBNull(3) ? null : reader.GetString(3), out var inicio) ? inicio : TimeSpan.Zero,
                    HORA_FIN = TimeSpan.TryParse(reader.IsDBNull(4) ? null : reader.GetString(4), out var fin) ? fin : TimeSpan.Zero,
                    ESTADO = reader.IsDBNull(5) ? null : reader.GetString(5)
                };

                return Ok(estado);
            }

            return NotFound();
        }

        [HttpGet("mesa/{idMesa}")]
        public ActionResult<IEnumerable<EstadoMesa>> GetEstadosPorMesa(int idMesa)
        {
            var estados = new List<EstadoMesa>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_ESTADO, ID_MESA, FECHA, HORA_INICIO, HORA_FIN, ESTADO FROM ESTADO_MESA WHERE ID_MESA = @idMesa";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idMesa", idMesa);

            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                estados.Add(new EstadoMesa
                {
                    ID_ESTADO = reader.GetInt32(0),
                    ID_MESA = reader.GetInt32(1),
                    FECHA = reader.GetDateTime(2),
                    HORA_INICIO = TimeSpan.TryParse(reader.IsDBNull(3) ? null : reader.GetString(3), out var inicio) ? inicio : TimeSpan.Zero,
                    HORA_FIN = TimeSpan.TryParse(reader.IsDBNull(4) ? null : reader.GetString(4), out var fin) ? fin : TimeSpan.Zero,
                    ESTADO = reader.IsDBNull(5) ? null : reader.GetString(5)
                });
            }

            return Ok(estados);
        }

        [HttpPost]
        public ActionResult CrearEstadoMesa(EstadoMesa estado)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"INSERT INTO ESTADO_MESA (ID_MESA, FECHA, HORA_INICIO, HORA_FIN, ESTADO)
                             VALUES (@idMesa, @fecha, @horaInicio, @horaFin, @estado)
                             RETURNING ID_ESTADO";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idMesa", estado.ID_MESA);
            cmd.Parameters.AddWithValue("@fecha", estado.FECHA);
            cmd.Parameters.AddWithValue("@horaInicio", estado.HORA_INICIO.ToString(@"hh\:mm\:ss"));
            cmd.Parameters.AddWithValue("@horaFin", estado.HORA_FIN.ToString(@"hh\:mm\:ss"));
            cmd.Parameters.AddWithValue("@estado", estado.ESTADO ?? (object)DBNull.Value);

            int id = Convert.ToInt32(cmd.ExecuteScalar());
            estado.ID_ESTADO = id;

            return CreatedAtAction(nameof(GetEstadoMesa), new { id = id }, estado);
        }

        [HttpPut("{id}")]
        public ActionResult ActualizarEstadoMesa(int id, EstadoMesa estado)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"UPDATE ESTADO_MESA
                             SET ID_MESA = @idMesa, 
                                 FECHA = @fecha, 
                                 HORA_INICIO = @horaInicio, 
                                 HORA_FIN = @horaFin, 
                                 ESTADO = @estado
                             WHERE ID_ESTADO = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idMesa", estado.ID_MESA);
            cmd.Parameters.AddWithValue("@fecha", estado.FECHA);
            cmd.Parameters.AddWithValue("@horaInicio", estado.HORA_INICIO.ToString(@"hh\:mm\:ss"));
            cmd.Parameters.AddWithValue("@horaFin", estado.HORA_FIN.ToString(@"hh\:mm\:ss"));
            cmd.Parameters.AddWithValue("@estado", estado.ESTADO ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult EliminarEstadoMesa(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM ESTADO_MESA WHERE ID_ESTADO = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }
}