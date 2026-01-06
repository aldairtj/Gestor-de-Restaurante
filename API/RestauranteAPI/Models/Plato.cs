namespace RestauranteAPI.Models
{
    public class Plato
    {
        public int ID_PLATO { get; set; }
        public string? NOMBRE { get; set; } // Agregado ?
        public decimal? PRECIO { get; set; }
        public int? ID_CATEGORIA { get; set; }
    }
}