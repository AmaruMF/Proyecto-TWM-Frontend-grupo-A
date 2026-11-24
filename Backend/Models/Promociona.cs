using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Promociona
{
    public string ProductoId { get; set; } = null!;

    public int OfertaId { get; set; }

    public DateOnly FechaInicio { get; set; }

    public DateOnly FechaFin { get; set; }

    public virtual Ofertum Oferta { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;
}
