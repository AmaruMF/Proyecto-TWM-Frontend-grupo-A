using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Considera
{
    public string DireccionId { get; set; } = null!;

    public int MedioPagoId
    {
        get; set;
    }

    public int DespachoId
    {
        get; set;
    }

    public virtual Despacho Despacho { get; set; } = null!;

    public virtual Direccion Direccion { get; set; } = null!;
}
