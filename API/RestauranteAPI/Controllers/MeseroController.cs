using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FirebirdSql.Data.FirebirdClient;
using RestauranteAPI.Models;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace RestauranteAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MeseroController : ControllerBase
    {
        private readonly string _connectionString;

        public MeseroController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("FirebirdConnection") ?? 
                throw new ArgumentNullException(nameof(configuration));
        }

        // Método auxiliar para encriptar contraseña en SHA256 (Hexadecimal)
        private string EncriptarContrasena(string contrasena)
        {
            Console.WriteLine($"=== ENCRIPTANDO CONTRASEÑA ===");
            Console.WriteLine($"Texto original: '{contrasena}'");
            Console.WriteLine($"Longitud: {contrasena.Length}");
            
            // Mostrar bytes en diferentes encodings
            Console.WriteLine($"Bytes (UTF8): {BitConverter.ToString(Encoding.UTF8.GetBytes(contrasena))}");
            Console.WriteLine($"Bytes (ASCII): {BitConverter.ToString(Encoding.ASCII.GetBytes(contrasena))}");
            Console.WriteLine($"Bytes (UTF32): {BitConverter.ToString(Encoding.UTF32.GetBytes(contrasena))}");
            
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(contrasena));
            
            Console.WriteLine($"Hash bytes: {BitConverter.ToString(bytes)}");
            
            var sb = new StringBuilder();
            foreach (var b in bytes)
            {
                sb.Append(b.ToString("x2"));
            }
            
            string result = sb.ToString();
            Console.WriteLine($"Hash resultante: {result}");
            Console.WriteLine($"Longitud hash: {result.Length}");
            
            return result;
        }

        // ============================================================
        // POST: api/mesero/login
        // ============================================================
        [HttpPost("login")]
        public ActionResult<LoginResponse> Login([FromBody] JsonDocument jsonDocument)
        {
            try
            {
                Console.WriteLine("=== LOGIN ENDPOINT CALLED ===");
                
                var root = jsonDocument.RootElement;
                
                string usuario = "";
                string contrasena = "";
                
                // Intentar con diferentes formatos de propiedades
                if (root.TryGetProperty("usuario", out var usuarioProp))
                    usuario = usuarioProp.GetString() ?? "";
                else if (root.TryGetProperty("Usuario", out usuarioProp))
                    usuario = usuarioProp.GetString() ?? "";
                
                if (root.TryGetProperty("contrasena", out var contrasenaProp))
                    contrasena = contrasenaProp.GetString() ?? "";
                else if (root.TryGetProperty("Contrasena", out contrasenaProp))
                    contrasena = contrasenaProp.GetString() ?? "";
                
                Console.WriteLine($"Usuario: {usuario}");
                Console.WriteLine($"Contraseña: {contrasena}");
                
                if (string.IsNullOrEmpty(usuario) || string.IsNullOrEmpty(contrasena))
                {
                    return BadRequest(new { error = "Usuario y contraseña son requeridos" });
                }
                
                using var con = new FbConnection(_connectionString);
                con.Open();

                string contrasenaEncriptada = EncriptarContrasena(contrasena);
                
                Console.WriteLine($"Hash calculado: {contrasenaEncriptada}");
                
                string query = @"SELECT ID_MESERO, NOMBRE, TURNO, USUARIO, EMAIL, ACTIVO, ULTIMO_ACCESO 
                                FROM MESERO 
                                WHERE USUARIO = @usuario 
                                AND CONTRASENA = @contrasena 
                                AND ACTIVO = TRUE";

                using var cmd = new FbCommand(query, con);
                cmd.Parameters.AddWithValue("@usuario", usuario);
                cmd.Parameters.AddWithValue("@contrasena", contrasenaEncriptada);

                using var readerDb = cmd.ExecuteReader();

                if (readerDb.Read())
                {
                    var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
                    
                    var updateQuery = "UPDATE MESERO SET ULTIMO_ACCESO = @fecha WHERE ID_MESERO = @id";
                    using var updateCmd = new FbCommand(updateQuery, con);
                    updateCmd.Parameters.AddWithValue("@fecha", DateTime.Now);
                    updateCmd.Parameters.AddWithValue("@id", readerDb.GetInt32(0));
                    updateCmd.ExecuteNonQuery();

                    var response = new LoginResponse
                    {
                        ID_MESERO = readerDb.GetInt32(0),
                        NOMBRE = readerDb.IsDBNull(1) ? null : readerDb.GetString(1),
                        TURNO = readerDb.IsDBNull(2) ? null : readerDb.GetString(2),
                        USUARIO = readerDb.IsDBNull(3) ? null : readerDb.GetString(3),
                        EMAIL = readerDb.IsDBNull(4) ? null : readerDb.GetString(4),
                        Token = token,
                        ULTIMO_ACCESO = readerDb.IsDBNull(6) ? null : readerDb.GetDateTime(6)
                    };

                    Console.WriteLine($"=== LOGIN EXITOSO ===");
                    Console.WriteLine($"Bienvenido: {response.NOMBRE}");

                    return Ok(response);
                }
                
                Console.WriteLine($"=== LOGIN FALLIDO ===");
                return Unauthorized(new { 
                    error = "Usuario o contraseña incorrectos",
                    usuarios = new[] { "Aldair", "Albert", "Pedro" }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== ERROR EN LOGIN ===");
                Console.WriteLine($"Mensaje: {ex.Message}");
                
                return StatusCode(500, new { 
                    error = "Error interno del servidor",
                    detalle = ex.Message 
                });
            }
        }

        // ============================================================
        // POST: api/mesero/login-simple
        // Versión alternativa simple
        // ============================================================
        [HttpPost("login-simple")]
        public ActionResult LoginSimple([FromBody] Dictionary<string, string> data)
        {
            try
            {
                Console.WriteLine("=== LOGIN SIMPLE LLAMADO ===");
                
                if (data == null || !data.ContainsKey("usuario") || !data.ContainsKey("contrasena"))
                {
                    return BadRequest(new { error = "Formato: {\"usuario\":\"...\",\"contrasena\":\"...\"}" });
                }
                
                string usuario = data["usuario"];
                string contrasena = data["contrasena"];
                
                Console.WriteLine($"Usuario: {usuario}");
                Console.WriteLine($"Contraseña recibida: {contrasena}");
                
                using var con = new FbConnection(_connectionString);
                con.Open();
                
                // Obtener hash del usuario de la BD
                string queryHash = "SELECT CONTRASENA FROM MESERO WHERE USUARIO = @usuario";
                using var cmdHash = new FbCommand(queryHash, con);
                cmdHash.Parameters.AddWithValue("@usuario", usuario);
                var hashEnBD = cmdHash.ExecuteScalar()?.ToString();
                
                if (string.IsNullOrEmpty(hashEnBD))
                {
                    return Unauthorized(new { error = $"Usuario '{usuario}' no encontrado" });
                }
                
                Console.WriteLine($"Hash en BD: {hashEnBD}");
                
                // Calcular hash de la contraseña proporcionada
                string hashCalculado = EncriptarContrasena(contrasena);
                Console.WriteLine($"Hash calculado: {hashCalculado}");
                
                // Verificar si coinciden
                if (hashCalculado == hashEnBD)
                {
                    // Login exitoso - obtener datos del usuario
                    string query = @"SELECT ID_MESERO, NOMBRE, TURNO, USUARIO, EMAIL, ACTIVO 
                                    FROM MESERO 
                                    WHERE USUARIO = @usuario";
                    
                    using var cmd = new FbCommand(query, con);
                    cmd.Parameters.AddWithValue("@usuario", usuario);
                    
                    using var readerDb = cmd.ExecuteReader();
                    
                    if (readerDb.Read())
                    {
                        var response = new
                        {
                            ID_MESERO = readerDb.GetInt32(0),
                            NOMBRE = readerDb.IsDBNull(1) ? "" : readerDb.GetString(1),
                            TURNO = readerDb.IsDBNull(2) ? "" : readerDb.GetString(2),
                            USUARIO = readerDb.IsDBNull(3) ? "" : readerDb.GetString(3),
                            EMAIL = readerDb.IsDBNull(4) ? "" : readerDb.GetString(4),
                            Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
                            Message = "Login exitoso"
                        };
                        
                        Console.WriteLine($"✅ Login exitoso para: {response.NOMBRE}");
                        return Ok(response);
                    }
                }
                
                // Si no coincide, probar contraseñas comunes para debugging
                Console.WriteLine("=== PROBANDO CONTRASEÑAS COMUNES ===");
                
                var contraseñasComunes = new Dictionary<string, string>
                {
                    { "12345678", "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f" },
                    { "87654321", "e24df920078c3dd4e7e8d2442f00e5c9ab2a231bb3918d65cc50906e49ecaef4" },
                    { "81726354", "c7de7152ba2393dee92b7e7b9941c48602285af3c2cf995c85bb18895a291877" },
                    { "password", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" },
                    { "123456", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" },
                    { "1234", "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4" }
                };
                
                var posiblesContraseñas = new List<string>();
                foreach (var pass in contraseñasComunes)
                {
                    if (pass.Value == hashEnBD)
                    {
                        posiblesContraseñas.Add(pass.Key);
                    }
                }
                
                // Mostrar todos los usuarios y sus hashes para referencia
                string queryAll = "SELECT USUARIO, CONTRASENA FROM MESERO WHERE ACTIVO = TRUE";
                using var cmdAll = new FbCommand(queryAll, con);
                using var readerAll = cmdAll.ExecuteReader();
                
                var usuariosInfo = new List<object>();
                while (readerAll.Read())
                {
                    string user = readerAll.GetString(0);
                    string hash = readerAll.GetString(1);
                    
                    // Encontrar qué contraseña corresponde a este hash
                    string contraseñaEncontrada = "DESCONOCIDA";
                    foreach (var pass in contraseñasComunes)
                    {
                        if (pass.Value == hash)
                        {
                            contraseñaEncontrada = pass.Key;
                            break;
                        }
                    }
                    
                    usuariosInfo.Add(new
                    {
                        usuario = user,
                        hash = hash.Substring(0, 16) + "...", // Mostrar solo parte del hash
                        contraseña_probable = contraseñaEncontrada
                    });
                }
                
                return Unauthorized(new 
                { 
                    error = "Credenciales incorrectas",
                    debug_info = new
                    {
                        usuario_solicitado = usuario,
                        contraseña_proporcionada = contrasena,
                        hash_en_bd = hashEnBD,
                        hash_calculado = hashCalculado,
                        posibles_contraseñas = posiblesContraseñas,
                        todos_usuarios = usuariosInfo,
                        nota = "Aldair y Albert usan '87654321'. Pedro tiene una contraseña diferente."
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("reset-contrasena")]
        public ActionResult ResetContrasena([FromBody] ResetRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Usuario) || string.IsNullOrEmpty(request.NuevaContrasena))
                {
                    return BadRequest(new { error = "Usuario y nueva contraseña son requeridos" });
                }
                
                using var con = new FbConnection(_connectionString);
                con.Open();
                
                // Verificar que el usuario existe
                string checkQuery = "SELECT COUNT(*) FROM MESERO WHERE USUARIO = @usuario";
                using var checkCmd = new FbCommand(checkQuery, con);
                checkCmd.Parameters.AddWithValue("@usuario", request.Usuario);
                
                if (Convert.ToInt32(checkCmd.ExecuteScalar()) == 0)
                {
                    return NotFound(new { error = $"Usuario '{request.Usuario}' no encontrado" });
                }
                
                // Actualizar contraseña
                string nuevoHash = EncriptarContrasena(request.NuevaContrasena);
                
                string updateQuery = "UPDATE MESERO SET CONTRASENA = @contrasena WHERE USUARIO = @usuario";
                using var updateCmd = new FbCommand(updateQuery, con);
                updateCmd.Parameters.AddWithValue("@contrasena", nuevoHash);
                updateCmd.Parameters.AddWithValue("@usuario", request.Usuario);
                
                int rows = updateCmd.ExecuteNonQuery();
                
                if (rows > 0)
                {
                    return Ok(new
                    {
                        message = $"Contraseña actualizada para {request.Usuario}",
                        usuario = request.Usuario,
                        nueva_contrasena = request.NuevaContrasena,
                        hash = nuevoHash
                    });
                }
                
                return BadRequest(new { error = "No se pudo actualizar la contraseña" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class ResetRequest
        {
            public string Usuario { get; set; }
            public string NuevaContrasena { get; set; }
        }

        [HttpGet("descubrir-contrasena/{usuario}")]
        public ActionResult DescubrirContrasena(string usuario)
        {
            try
            {
                using var con = new FbConnection(_connectionString);
                con.Open();
                
                // Obtener hash del usuario
                string queryHash = "SELECT CONTRASENA FROM MESERO WHERE USUARIO = @usuario";
                using var cmdHash = new FbCommand(queryHash, con);
                cmdHash.Parameters.AddWithValue("@usuario", usuario);
                var hashEnBD = cmdHash.ExecuteScalar()?.ToString();
                
                if (hashEnBD == null)
                {
                    return NotFound(new { error = $"Usuario '{usuario}' no encontrado" });
                }
                
                // Diccionario de contraseñas comunes y sus hashes
                var contraseñasComunes = new Dictionary<string, string>
                {
                    { "12345678", "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f" },
                    { "87654321", "e24df920078c3dd4e7e8d2442f00e5c9ab2a231bb3918d65cc50906e49ecaef4" },
                    { "81726354", "c7de7152ba2393dee92b7e7b9941c48602285af3c2cf995c85bb18895a291877" },
                    { "123456789", "15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225" },
                    { "password", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" },
                    { "123456", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" },
                    { "qwerty", "65e84be33532fb784c48129675f9eff3a682b27168c0ea744b2cf58ee02337c5" },
                    { "abc123", "6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090" }
                };
                
                // Buscar coincidencias
                var coincidencias = new List<string>();
                foreach (var pass in contraseñasComunes)
                {
                    if (pass.Value == hashEnBD)
                    {
                        coincidencias.Add(pass.Key);
                    }
                }
                
                return Ok(new
                {
                    usuario,
                    hash_en_bd = hashEnBD,
                    contraseñas_posibles = coincidencias,
                    nota = coincidencias.Count > 0 
                        ? $"La contraseña probable es: {string.Join(" o ", coincidencias)}" 
                        : "Contraseña no encontrada en la lista común"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("calcular-hash/{texto}")]
        public ActionResult CalcularHash(string texto)
        {
            try
            {
                Console.WriteLine($"=== CALCULAR HASH PARA: {texto} ===");
                
                // Método actual
                string hashActual = EncriptarContrasena(texto);
                
                // Método alternativo para verificar
                using var sha256 = SHA256.Create();
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(texto));
                
                // Convertir a hexadecimal (manualmente)
                var sbManual = new StringBuilder();
                foreach (var b in bytes)
                {
                    sbManual.Append(b.ToString("x2"));
                }
                string hashManual = sbManual.ToString();
                
                // Convertir a Base64
                string hashBase64 = Convert.ToBase64String(bytes);
                
                // Ver hash en la BD para comparar
                using var con = new FbConnection(_connectionString);
                con.Open();
                
                string query = "SELECT USUARIO, CONTRASENA FROM MESERO";
                using var cmd = new FbCommand(query, con);
                using var reader = cmd.ExecuteReader();
                
                var hashesEnBD = new List<object>();
                while (reader.Read())
                {
                    hashesEnBD.Add(new
                    {
                        usuario = reader.GetString(0),
                        hash = reader.GetString(1)
                    });
                }
                
                return Ok(new
                {
                    texto,
                    hashActual,
                    hashManual,
                    hashBase64,
                    longitudHashActual = hashActual.Length,
                    longitudHashManual = hashManual.Length,
                    sonIguales = hashActual == hashManual,
                    hashesEnBD,
                    comparaciones = hashesEnBD.Select(h => new
                    {
                        usuario = ((dynamic)h).usuario,
                        coincide = hashActual == ((dynamic)h).hash
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("login-test")]
        public ActionResult LoginTest([FromBody] Dictionary<string, string> data)
        {
            try
            {
                Console.WriteLine("=== LOGIN TEST CALLED ===");
                
                if (data == null || !data.ContainsKey("usuario") || !data.ContainsKey("contrasena"))
                {
                    return BadRequest(new { error = "Formato: {\"usuario\":\"...\",\"contrasena\":\"...\"}" });
                }
                
                string usuario = data["usuario"];
                string contrasena = data["contrasena"];
                
                Console.WriteLine($"Usuario: {usuario}");
                Console.WriteLine($"Contraseña: {contrasena}");
                
                // Solo para pruebas: aceptar cualquier cosa
                if (usuario == "Aldair" && contrasena == "12345678")
                {
                    return Ok(new
                    {
                        ID_MESERO = 12,
                        NOMBRE = "Aldair Desken",
                        TURNO = "Mañana",
                        USUARIO = "Aldair",
                        EMAIL = "aldair@gmail.com",
                        Token = "test-token-123",
                        Message = "Login de prueba exitoso"
                    });
                }
                
                return Unauthorized(new { error = "Credenciales de prueba: Aldair/12345678" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================================
        // Métodos GET (mantener existentes)
        // ============================================================
        
        [HttpGet]
        public ActionResult<IEnumerable<Mesero>> GetMeseros()
        {
            var meseros = new List<Mesero>();

            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_MESERO, NOMBRE, TURNO, USUARIO, EMAIL, ACTIVO, ULTIMO_ACCESO FROM MESERO";

            using var cmd = new FbCommand(query, con);
            using var reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                meseros.Add(new Mesero
                {
                    ID_MESERO = reader.GetInt32(0),
                    NOMBRE = reader.IsDBNull(1) ? null : reader.GetString(1),
                    TURNO = reader.IsDBNull(2) ? null : reader.GetString(2),
                    USUARIO = reader.IsDBNull(3) ? null : reader.GetString(3),
                    EMAIL = reader.IsDBNull(4) ? null : reader.GetString(4),
                    ACTIVO = reader.IsDBNull(5) ? true : reader.GetBoolean(5),
                    ULTIMO_ACCESO = reader.IsDBNull(6) ? null : reader.GetDateTime(6)
                });
            }

            return Ok(meseros);
        }

        [HttpGet("{id}")]
        public ActionResult<Mesero> GetMesero(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "SELECT ID_MESERO, NOMBRE, TURNO, USUARIO, EMAIL, ACTIVO, ULTIMO_ACCESO FROM MESERO WHERE ID_MESERO = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            using var reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                var mesero = new Mesero
                {
                    ID_MESERO = reader.GetInt32(0),
                    NOMBRE = reader.IsDBNull(1) ? null : reader.GetString(1),
                    TURNO = reader.IsDBNull(2) ? null : reader.GetString(2),
                    USUARIO = reader.IsDBNull(3) ? null : reader.GetString(3),
                    EMAIL = reader.IsDBNull(4) ? null : reader.GetString(4),
                    ACTIVO = reader.IsDBNull(5) ? true : reader.GetBoolean(5),
                    ULTIMO_ACCESO = reader.IsDBNull(6) ? null : reader.GetDateTime(6)
                };

                return Ok(mesero);
            }

            return NotFound();
        }

        // ============================================================
        // POST: api/mesero (crear nuevo)
        // ============================================================
        [HttpPost]
        public ActionResult CrearMesero(Mesero mesero)
        {
            if (string.IsNullOrEmpty(mesero.USUARIO) || string.IsNullOrEmpty(mesero.CONTRASENA))
                return BadRequest("Usuario y contraseña son requeridos");

            using var con = new FbConnection(_connectionString);
            con.Open();

            string checkQuery = "SELECT COUNT(*) FROM MESERO WHERE USUARIO = @usuario";
            using var checkCmd = new FbCommand(checkQuery, con);
            checkCmd.Parameters.AddWithValue("@usuario", mesero.USUARIO);
            
            if (Convert.ToInt32(checkCmd.ExecuteScalar()) > 0)
                return BadRequest("El usuario ya existe");

            string contrasenaEncriptada = EncriptarContrasena(mesero.CONTRASENA);

            string query = @"INSERT INTO MESERO (NOMBRE, TURNO, USUARIO, CONTRASENA, EMAIL, ACTIVO, ULTIMO_ACCESO)
                             VALUES (@nombre, @turno, @usuario, @contrasena, @email, @activo, @ultimoAcceso)
                             RETURNING ID_MESERO";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@nombre", mesero.NOMBRE ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@turno", mesero.TURNO ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@usuario", mesero.USUARIO);
            cmd.Parameters.AddWithValue("@contrasena", contrasenaEncriptada);
            cmd.Parameters.AddWithValue("@email", mesero.EMAIL ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@activo", mesero.ACTIVO);
            cmd.Parameters.AddWithValue("@ultimoAcceso", DateTime.Now);

            int id = Convert.ToInt32(cmd.ExecuteScalar());
            mesero.ID_MESERO = id;

            return CreatedAtAction(nameof(GetMesero), new { id = id }, mesero);
        }

        // ============================================================
        // PUT: api/mesero/5
        // ============================================================
        [HttpPut("{id}")]
        public ActionResult ActualizarMesero(int id, Mesero mesero)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string getQuery = "SELECT CONTRASENA FROM MESERO WHERE ID_MESERO = @id";
            using var getCmd = new FbCommand(getQuery, con);
            getCmd.Parameters.AddWithValue("@id", id);
            
            string contrasenaActual = "";
            using (var reader = getCmd.ExecuteReader())
            {
                if (reader.Read())
                {
                    contrasenaActual = reader.IsDBNull(0) ? "" : reader.GetString(0);
                }
                else
                {
                    return NotFound();
                }
            }

            string nuevaContrasena = contrasenaActual;
            if (!string.IsNullOrEmpty(mesero.CONTRASENA) && mesero.CONTRASENA != "********")
            {
                nuevaContrasena = EncriptarContrasena(mesero.CONTRASENA);
            }

            string query = @"UPDATE MESERO
                             SET NOMBRE = @nombre, 
                                 TURNO = @turno, 
                                 USUARIO = @usuario, 
                                 CONTRASENA = @contrasena, 
                                 EMAIL = @email, 
                                 ACTIVO = @activo
                             WHERE ID_MESERO = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@nombre", mesero.NOMBRE ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@turno", mesero.TURNO ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@usuario", mesero.USUARIO ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@contrasena", nuevaContrasena);
            cmd.Parameters.AddWithValue("@email", mesero.EMAIL ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@activo", mesero.ACTIVO);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }

        // ============================================================
        // DELETE: api/mesero/5
        // ============================================================
        [HttpDelete("{id}")]
        public ActionResult EliminarMesero(int id)
        {
            using var con = new FbConnection(_connectionString);
            con.Open();

            string query = "DELETE FROM MESERO WHERE ID_MESERO = @id";

            using var cmd = new FbCommand(query, con);
            cmd.Parameters.AddWithValue("@id", id);

            int rows = cmd.ExecuteNonQuery();

            if (rows == 0)
                return NotFound();

            return NoContent();
        }
    }

    // ============================================================
    // CLASES AUXILIARES
    // ============================================================

    public class LoginResponse
    {
        public int ID_MESERO { get; set; }
        public string? NOMBRE { get; set; }
        public string? TURNO { get; set; }
        public string? USUARIO { get; set; }
        public string? EMAIL { get; set; }
        public string? Token { get; set; }
        public DateTime? ULTIMO_ACCESO { get; set; }
    }
}