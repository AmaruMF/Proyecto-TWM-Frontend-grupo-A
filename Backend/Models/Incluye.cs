using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Incluye
{
    public string ProductoId { get; set; } = null!;

    public int VentaId
    {
        get; set;
    }

    public string UsuarioId { get; set; } = null!;

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

    public decimal? PrecioFinal
    {
        get; set;
    }

    public virtual Producto Producto { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;

    public virtual Venta Venta { get; set; } = null!;
}
