namespace RestauranteAPI.Models
{
    public class DetallePedido
    {
        public int ID_DETALLE { get; set; }
        public int? ID_PEDIDO { get; set; } // Nullable
        public int? ID_PLATO { get; set; } // Nullable
        public int? CANTIDAD { get; set; } // Nullable
        public decimal? PRECIO_UNITARIO { get; set; } // Nullable
    }
}