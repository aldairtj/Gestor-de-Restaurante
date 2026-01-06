namespace RestauranteAPI.Models
{
    public class Reserva
    {
        public int ID_RESERVA { get; set; }
        public int? ID_CLIENTE { get; set; }
        public int? ID_MESA { get; set; }
        public DateTime? FECHA_RESERVA { get; set; }
        public TimeSpan? HORA_RESERVA { get; set; }
        public int? NUM_PERSONAS { get; set; }
    }
}