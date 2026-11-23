using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Consultar
{
    public string UsuarioId { get; set; } = null!;

    public string MensajeriaId { get; set; } = null!;

    public int MedioPagoId
    {
        get; set;
    }

    public virtual Mensajeria Mensajeria { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
