namespace RestauranteAPI.Models
{
    public class EstadoMesa
    {
        public int ID_ESTADO { get; set; }
        public int ID_MESA { get; set; }
        public DateTime FECHA { get; set; }
        public TimeSpan HORA_INICIO { get; set; }
        public TimeSpan HORA_FIN { get; set; }
        public string? ESTADO { get; set; } // Agregado ?
    }
}