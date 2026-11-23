using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace TiendaMultiplaza.API.DTOs;
public record RegistroDto(
    [Required, StringLength(15)] string Run,
    [Required, StringLength(100, MinimumLength = 2)] string Nombre,
    DateOnly FechaNacimiento,
    [Required, StringLength(128, MinimumLength = 12)] string Clave);
public record LoginDto([Required, StringLength(15)] string Run, [Required, StringLength(128)] string Clave);
public record ClaveDto([Required, StringLength(128)] string ClaveActual, [Required, StringLength(128, MinimumLength = 12)] string ClaveNueva);
public record PerfilDto([Required, StringLength(100, MinimumLength = 2)] string Nombre);
public record AccesoDto([Required] string Rol, bool Activo);
public record UsuarioDto(string Run, string Nombre, DateOnly FechaNacimiento, string Rol, bool Activo);
public record TokenDto(string AccessToken, DateTime ExpiraEn, UsuarioDto Usuario);
public record CategoriaDto(int IdCategoria, string Nombre, string Tipo);
public record CategoriaGuardarDto([Required, StringLength(100)] string Nombre, [Required, StringLength(50)] string Tipo);
public record ProductoGuardarDto(
    [Required, StringLength(50)] string Sku,
    [Required, StringLength(100)] string Nombre,
    [Required, StringLength(50)] string Marca,
    bool RestriccionEdad,
    [Range(1, int.MaxValue)] int CotizacionId,
    JsonElement Caracteristica,
    [Range(0, 1000000)] int Stock,
    bool Visible,
    [Required, StringLength(15)] string VendedorRun,
    [Range(1, 10000000)] int Precio,
    [Required, MinLength(1), MaxLength(20)] int[] Categorias);
public record StockDto([Range(0, 1000000)] int Cantidad);
public record PrecioDto(string VendedorRun, int PrecioBase, int DescuentoPorcentaje, int PrecioFinal);
public record ProductoDetalleDto(string Sku, string Nombre, string Marca, bool RestriccionEdad, int CotizacionId, JsonElement Caracteristica, int Stock, bool Visible, int[] Categorias, IReadOnlyList<PrecioDto> Precios);
public record PaginaDto<T>(IReadOnlyList<T> Datos, int Pagina, int Tamano, int Total);
public record CarritoItemDto([Required, StringLength(50)] string Sku, [Required, StringLength(15)] string VendedorRun, [Range(1, 1000)] int Cantidad);
public record CantidadDto([Range(1, 1000)] int Cantidad);
public record CarritoLineaDto(string Sku, string Nombre, string VendedorRun, int Cantidad, int Stock, int PrecioUnitario, long Subtotal, bool Disponible);
public record CarritoDto(IReadOnlyList<CarritoLineaDto> Items, long Subtotal, long Iva, long Total);
public record ConfirmarPedidoDto(Guid ClaveIdempotencia, [Required, StringLength(500, MinimumLength = 10)] string DireccionEntrega);
public record EstadoPedidoDto([Required] string Estado);
public record PedidoLineaDto(string Sku, string Nombre, string VendedorRun, int Cantidad, int PrecioUnitario, long Subtotal);
public record PedidoDto(int IdVenta, string UsuarioRun, string Estado, DateTime CreadoEn, string? DireccionEntrega, long Subtotal, long Iva, long Total, bool Pagada, IReadOnlyList<PedidoLineaDto> Items);
