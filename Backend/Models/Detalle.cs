using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Detalle
{
    public string ProductoId { get; set; } = null!;

    public int VentaId { get; set; }

    public string EmpresaId { get; set; } = null!;

    public virtual Empresa Empresa { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;

    public virtual Ventum Venta { get; set; } = null!;
}
