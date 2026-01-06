namespace RestauranteAPI.Models
{
    public class Mesero
    {
        public int ID_MESERO { get; set; }
        public string? NOMBRE { get; set; }
        public string? TURNO { get; set; }
        public string? USUARIO { get; set; }
        public string? CONTRASENA { get; set; }
        public string? EMAIL { get; set; }
        public bool ACTIVO { get; set; } = true;
        public DateTime? ULTIMO_ACCESO { get; set; }
    }
}