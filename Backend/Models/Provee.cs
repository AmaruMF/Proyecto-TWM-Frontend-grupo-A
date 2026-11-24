using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Provee
{
    public string UsuarioId { get; set; } = null!;

    public string ServicioId { get; set; } = null!;

    public int Precio { get; set; }

    public virtual Servicio Servicio { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
