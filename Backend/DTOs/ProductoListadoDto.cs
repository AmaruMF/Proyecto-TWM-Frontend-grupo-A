namespace TiendaMultiplaza.API.DTOs;

public record ProductoListadoDto(
    string Sku,
    string Nombre,
    string Marca,
    int Stock,
    int? PrecioDesde
);
