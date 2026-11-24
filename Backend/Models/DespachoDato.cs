using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class DespachoDato
{
    public int IdDespacho { get; set; }

    public int Precio { get; set; }

    public DateOnly Fecha { get; set; }

    public string Estado { get; set; } = null!;

    public int HistorialCompraId { get; set; }

    public virtual HistorialCompra HistorialCompra { get; set; } = null!;

    public virtual Despacho IdDespachoNavigation { get; set; } = null!;
}
