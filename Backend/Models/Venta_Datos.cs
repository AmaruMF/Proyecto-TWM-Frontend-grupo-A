using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Venta_Datos
{
    public int IdVenta
    {
        get; set;
    }

    public int Cantidad
    {
        get; set;
    }

    public int TotalIva
    {
        get; set;
    }

    public int PrecioSinIva
    {
        get; set;
    }

    public int PrecioTotal
    {
        get; set;
    }

    public DateOnly Fecha
    {
        get; set;
    }

    public decimal? Descuento
    {
        get; set;
    }

    public decimal? TotalCalculado
    {
        get; set;
    }

    public virtual Venta IdVentaNavigation { get; set; } = null!;
}
