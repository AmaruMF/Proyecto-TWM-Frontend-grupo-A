using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Aplica
{
    public int VentaId
    {
        get; set;
    }

    public string ServicioId { get; set; } = null!;

    public string UsuarioId { get; set; } = null!;

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

    public virtual Servicio Servicio { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;

    public virtual Venta Venta { get; set; } = null!;
}
