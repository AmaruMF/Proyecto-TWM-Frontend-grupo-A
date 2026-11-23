using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Cotizacion_Detalle
{
    public int IdCotizacionDetalle
    {
        get; set;
    }

    public int CotizacionId
    {
        get; set;
    }

    public string? ProductoId
    {
        get; set;
    }

    public string? ServicioId
    {
        get; set;
    }

    public int? Cantidad
    {
        get; set;
    }

    public decimal? PrecioOriginal
    {
        get; set;
    }

    public decimal? DescuentoOferta
    {
        get; set;
    }

    public decimal? PrecioCotizado
    {
        get; set;
    }

    public DateOnly? FechaRegistro
    {
        get; set;
    }

    public DateOnly? FechaUltimaActualizacion
    {
        get; set;
    }
}
