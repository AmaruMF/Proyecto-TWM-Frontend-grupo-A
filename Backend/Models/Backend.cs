namespace TiendaMultiplaza.API.Models;

public class Usuario_Acceso
{
    public string UsuarioRun { get; set; } = "";
    public string Rol { get; set; } = "Cliente";
    public bool Activo { get; set; } = true;
    public int VersionToken { get; set; } = 1;
    public int IntentosFallidos
    {
        get; set;
    }
    public DateTime? BloqueadoHasta
    {
        get; set;
    }
    public bool ClaveEsHash
    {
        get; set;
    }
    public Usuario Usuario { get; set; } = null!;
}
public class Carrito
{
    public string UsuarioRun { get; set; } = "";
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
    public List<Carrito_Detalle> Detalles { get; set; } = [];
}
public class Carrito_Detalle
{
    public string UsuarioRun { get; set; } = "";
    public string ProductoId { get; set; } = "";
    public string VendedorRun { get; set; } = "";
    public int Cantidad
    {
        get; set;
    }
    public Carrito Carrito { get; set; } = null!;
}
public class Pedido
{
    public int VentaId
    {
        get; set;
    }
    public string UsuarioRun { get; set; } = "";
    public Guid ClaveIdempotencia
    {
        get; set;
    }
    public string Estado { get; set; } = "Pendiente";
    public string DireccionEntrega { get; set; } = "";
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
    public List<Pedido_Detalle> Detalles { get; set; } = [];
}
public class Pedido_Detalle
{
    public int VentaId
    {
        get; set;
    }
    public string ProductoId { get; set; } = "";
    public string VendedorRun { get; set; } = "";
    public string Nombre { get; set; } = "";
    public int Cantidad
    {
        get; set;
    }
    public int PrecioUnitario
    {
        get; set;
    }
    public Pedido Pedido { get; set; } = null!;
}
