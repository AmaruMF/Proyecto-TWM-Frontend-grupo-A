using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Ejerce
{
    public string UsuarioId { get; set; } = null!;

    public int DevolucionId
    {
        get; set;
    }

    public int MedioPagoId
    {
        get; set;
    }

    public string Estado { get; set; } = null!;

    public virtual Devolucion Devolucion { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
