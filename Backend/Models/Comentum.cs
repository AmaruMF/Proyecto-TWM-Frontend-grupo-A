using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Comentum
{
    public string UsuarioId { get; set; } = null!;

    public string MensajeriaId { get; set; } = null!;

    public string? ServicioId { get; set; }

    public virtual Mensajerium Mensajeria { get; set; } = null!;

    public virtual Servicio? Servicio { get; set; }

    public virtual Usuario Usuario { get; set; } = null!;
}
