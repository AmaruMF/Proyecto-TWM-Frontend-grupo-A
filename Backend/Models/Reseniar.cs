using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Reseniar
{
    public int ReseniaId { get; set; }

    public string UsuarioId { get; set; } = null!;

    public string ProductoId { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;

    public virtual Resenium Resenia { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
