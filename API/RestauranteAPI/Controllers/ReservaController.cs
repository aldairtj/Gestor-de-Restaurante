using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservaController : ControllerBase
    {
        private readonly string _connectionString;

        public ReservaController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection") ?? 
                throw new ArgumentNullException(nameof(configuration));
        }

        [HttpGet]
        public ActionResult<IEnumerable<Reserva>> GetReservas()
        {
            var reservas = new List<Reserva>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_RESERVA, ID_CLIENTE, ID_MESA, FECHA_RESERVA, HORA_RESERVA, NUM_PERSONAS FROM RESERVA";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                reservas.Add(new Reserva
                {
                    ID_RESERVA = reader.GetInt32(0),
                    ID_CLIENTE = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                    ID_MESA = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                    FECHA_RESERVA = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                    HORA_RESERVA = reader.IsDBNull(4) ? null : TimeSpan.TryParse(reader.GetString(4), out var hora) ? hora : null,
                    NUM_PERSONAS = reader.IsDBNull(5) ? null : reader.GetInt32(5)
                });
            }

            return Ok(reservas);
        }

        [HttpGet("{id}")]
        public ActionResult<Reserva> GetReserva(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_RESERVA, ID_CLIENTE, ID_MESA, FECHA_RESERVA, HORA_RESERVA, NUM_PERSONAS FROM RESERVA WHERE ID_RESERVA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var reserva = new Reserva
                {
                    ID_RESERVA = reader.GetInt32(0),
                    ID_CLIENTE = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                    ID_MESA = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                    FECHA_RESERVA = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                    HORA_RESERVA = reader.IsDBNull(4) ? null : TimeSpan.TryParse(reader.GetString(4), out var hora) ? hora : null,
                    NUM_PERSONAS = reader.IsDBNull(5) ? null : reader.GetInt32(5)
                };

                return Ok(reserva);
            }

            return NotFound();
        }

        [HttpPost]
        public ActionResult CrearReserva(Reserva reserva)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"INSERT INTO RESERVA (ID_CLIENTE, ID_MESA, FECHA_RESERVA, HORA_RESERVA, NUM_PERSONAS)
                             VALUES (@idCliente, @idMesa, @fechaReserva, @horaReserva, @numPersonas)
                             RETURNING ID_RESERVA";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idCliente", reserva.ID_CLIENTE ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@idMesa", reserva.ID_MESA ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@fechaReserva", reserva.FECHA_RESERVA ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@horaReserva", reserva.HORA_RESERVA?.ToString(@"hh\:mm\:ss") ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@numPersonas", reserva.NUM_PERSONAS ?? (object)DBNull.Value);

            int id = Convert.ToInt32(cmd.ExecuteScalar());
            reserva.ID_RESERVA = id;

            return CreatedAtAction(nameof(GetReserva), new { id = id }, reserva);
        }

        [HttpPut("{id}")]
        public ActionResult ActualizarReserva(int id, Reserva reserva)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"UPDATE RESERVA
                             SET ID_CLIENTE = @idCliente, 
                                 ID_MESA = @idMesa, 
                                 FECHA_RESERVA = @fechaReserva, 
                                 HORA_RESERVA = @horaReserva, 
                                 NUM_PERSONAS = @numPersonas
                             WHERE ID_RESERVA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@idCliente", reserva.ID_CLIENTE ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@idMesa", reserva.ID_MESA ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@fechaReserva", reserva.FECHA_RESERVA ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@horaReserva", reserva.HORA_RESERVA?.ToString(@"hh\:mm\:ss") ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@numPersonas", reserva.NUM_PERSONAS ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult EliminarReserva(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM RESERVA WHERE ID_RESERVA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }
}