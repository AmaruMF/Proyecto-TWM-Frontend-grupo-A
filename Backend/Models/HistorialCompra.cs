using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class HistorialCompra
{
    public int IdHistorial { get; set; }

    public DateOnly FechaInicio { get; set; }

    public DateOnly FechaFin { get; set; }

    public virtual ICollection<DespachoDato> DespachoDatos { get; set; } = new List<DespachoDato>();

    public virtual ICollection<Despacho> Despachos { get; set; } = new List<Despacho>();

    public virtual ICollection<Genera> Generas { get; set; } = new List<Genera>();
}
