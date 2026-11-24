using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Cotizacion
{
    public int IdCotizacion { get; set; }

    public DateOnly Fecha { get; set; }

    public string EmpresaId { get; set; } = null!;

    public virtual Empresa Empresa { get; set; } = null!;

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();

    public virtual ICollection<Servicio> Servicios { get; set; } = new List<Servicio>();
}
