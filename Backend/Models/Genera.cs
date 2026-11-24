using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Genera
{
    public int HistorialCompraId { get; set; }

    public int VentaId { get; set; }

    public string Estado { get; set; } = null!;

    public virtual HistorialCompra HistorialCompra { get; set; } = null!;

    public virtual Ventum Venta { get; set; } = null!;
}
