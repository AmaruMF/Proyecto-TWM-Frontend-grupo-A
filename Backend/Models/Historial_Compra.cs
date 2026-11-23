using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Historial_Compra
{
    public int IdHistorial
    {
        get; set;
    }

    public DateOnly FechaInicio
    {
        get; set;
    }

    public DateOnly FechaFin
    {
        get; set;
    }

    public virtual ICollection<Despacho_Datos> DespachoDatos { get; set; } = new List<Despacho_Datos>();

    public virtual ICollection<Despacho> Despachos { get; set; } = new List<Despacho>();

    public virtual ICollection<Genera> Generas { get; set; } = new List<Genera>();
}
