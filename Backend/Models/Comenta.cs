using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Comenta
{
    public string UsuarioId { get; set; } = null!;

    public string MensajeriaId { get; set; } = null!;

    public string? ServicioId
    {
        get; set;
    }

    public virtual Mensajeria Mensajeria { get; set; } = null!;

    public virtual Servicio? Servicio
    {
        get; set;
    }

    public virtual Usuario Usuario { get; set; } = null!;
}
