namespace RestauranteAPI.Models
{
    public class Ingrediente
    {
        public int ID_INGREDIENTE { get; set; }
        public string? NOMBRE { get; set; } // Agregado ?
        public string? UNIDAD_MEDIDA { get; set; } // Agregado ?
        public decimal STOCK { get; set; }
    }
}