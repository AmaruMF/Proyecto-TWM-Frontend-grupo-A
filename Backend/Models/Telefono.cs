using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Telefono
{
    public int IdTelefono { get; set; }

    public int Numero { get; set; }

    public int Prefijo { get; set; }

    public string UsuarioId { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
