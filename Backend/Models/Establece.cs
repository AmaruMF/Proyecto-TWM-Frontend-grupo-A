using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Establece
{
    public int VentaId
    {
        get; set;
    }

    public string ServicioId { get; set; } = null!;

    public string EmpresaId { get; set; } = null!;

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

    public virtual Empresa Empresa { get; set; } = null!;

    public virtual Servicio Servicio { get; set; } = null!;

    public virtual Venta Venta { get; set; } = null!;
}
