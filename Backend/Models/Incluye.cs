using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Incluye
{
    public string ProductoId { get; set; } = null!;

    public int VentaId { get; set; }

    public string UsuarioId { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;

    public virtual Ventum Venta { get; set; } = null!;
}
