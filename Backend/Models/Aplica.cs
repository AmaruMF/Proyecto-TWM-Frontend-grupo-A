using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Aplica
{
    public int VentaId { get; set; }

    public string ServicioId { get; set; } = null!;

    public string UsuarioId { get; set; } = null!;

    public virtual Servicio Servicio { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;

    public virtual Ventum Venta { get; set; } = null!;
}
