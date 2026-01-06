using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriaController : ControllerBase
    {
        private readonly string _connectionString;

        public CategoriaController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection");
        }

        [HttpGet]
        public ActionResult<IEnumerable<Categoria>> GetCategorias()
        {
            var categorias = new List<Categoria>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_CATEGORIA, NOMBRE FROM CATEGORIA";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                categorias.Add(new Categoria
                {
                    ID_CATEGORIA = reader.GetInt32(0),
                    NOMBRE = reader.GetString(1)
                });
            }

            return Ok(categorias);
        }

        [HttpGet("{id}")]
        public ActionResult<Categoria> GetCategoria(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_CATEGORIA, NOMBRE FROM CATEGORIA WHERE ID_CATEGORIA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var categoria = new Categoria
                {
                    ID_CATEGORIA = reader.GetInt32(0),
                    NOMBRE = reader.GetString(1)
                };

                return Ok(categoria);
            }

            return NotFound();
        }

        [HttpPost]
        public ActionResult CrearCategoria(Categoria categoria)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"INSERT INTO CATEGORIA (NOMBRE)
                             VALUES (@nombre)
                             RETURNING ID_CATEGORIA";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@nombre", categoria.NOMBRE);

            int id = Convert.ToInt32(cmd.ExecuteScalar());
            categoria.ID_CATEGORIA = id;

            return CreatedAtAction(nameof(GetCategoria), new { id = id }, categoria);
        }

        [HttpPut("{id}")]
        public ActionResult ActualizarCategoria(int id, Categoria categoria)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = @"UPDATE CATEGORIA
                             SET NOMBRE = @nombre
                             WHERE ID_CATEGORIA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@nombre", categoria.NOMBRE);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult EliminarCategoria(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM CATEGORIA WHERE ID_CATEGORIA = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }
}