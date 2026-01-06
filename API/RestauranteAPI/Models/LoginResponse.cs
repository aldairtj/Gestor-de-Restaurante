namespace RestauranteAPI.Models
{
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