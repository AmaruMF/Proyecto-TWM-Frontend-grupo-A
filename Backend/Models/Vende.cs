using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Vende
{
    public string UsuarioId { get; set; } = null!;

    public string ProductoId { get; set; } = null!;

    public int Precio { get; set; }

    public virtual Producto Producto { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
