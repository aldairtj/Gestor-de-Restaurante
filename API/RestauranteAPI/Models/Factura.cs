namespace RestauranteAPI.Models
{
    public class Factura
    {
        public int ID_FACTURA { get; set; }
        public int? ID_PEDIDO { get; set; } // Nullable
        public DateTime? FECHA_FACTURA { get; set; } // Nullable
        public decimal? TOTAL { get; set; } // Nullable
    }
}