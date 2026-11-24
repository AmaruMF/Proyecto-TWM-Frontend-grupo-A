using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Definir
{
    public string ProductoId { get; set; } = null!;

    public string DireccionId { get; set; } = null!;

    public int DespachoId { get; set; }

    public virtual Despacho Despacho { get; set; } = null!;

    public virtual Direccion Direccion { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;
}
