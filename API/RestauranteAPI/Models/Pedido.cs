namespace RestauranteAPI.Models
{
    public class Pedido
    {
        public int ID_PEDIDO { get; set; }
        public int? ID_MESA { get; set; }
        public int? ID_MESERO { get; set; }
        public DateTime? FECHA_PEDIDO { get; set; }
        public TimeSpan? HORA_PEDIDO { get; set; }
        public string? ESTADO { get; set; } 
    }
}