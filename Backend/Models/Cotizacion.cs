using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Cotizacion
{
    public int IdCotizacion
    {
        get; set;
    }

    public DateOnly Fecha
    {
        get; set;
    }

    public string EmpresaId { get; set; } = null!;

    public string? UsuarioId
    {
        get; set;
    }

    public DateOnly? FechaVencimiento
    {
        get; set;
    }

    public DateOnly? FechaEliminacion
    {
        get; set;
    }

    public string? Estado
    {
        get; set;
    }

    public decimal? PrecioTotal
    {
        get; set;
    }

    public virtual Empresa Empresa { get; set; } = null!;

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();

    public virtual ICollection<Servicio> Servicios { get; set; } = new List<Servicio>();
}
