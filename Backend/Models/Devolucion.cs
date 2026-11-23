using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Devolucion
{
    public int IdDevolucion
    {
        get; set;
    }

    public string Motivo { get; set; } = null!;

    public DateOnly Fecha
    {
        get; set;
    }

    public int DespachoId
    {
        get; set;
    }

    public string Estado { get; set; } = null!;

    public bool? StockRestaurado
    {
        get; set;
    }

    public virtual Despacho Despacho { get; set; } = null!;

    public virtual ICollection<Ejerce> Ejerces { get; set; } = new List<Ejerce>();
}
