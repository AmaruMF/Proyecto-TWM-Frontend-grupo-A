using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Genera
{
    public int HistorialCompraId
    {
        get; set;
    }

    public int VentaId
    {
        get; set;
    }

    public string Estado { get; set; } = null!;

    public virtual Historial_Compra Historial_Compra { get; set; } = null!;

    public virtual Venta Venta { get; set; } = null!;
}
