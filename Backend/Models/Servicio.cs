using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Servicio
{
    public string Sku { get; set; } = null!;

    public string Nombre { get; set; } = null!;

    public bool RestriccionEdad
    {
        get; set;
    }

    public int Tiempo
    {
        get; set;
    }

    public int CotizacionId
    {
        get; set;
    }

    public string Caracteristica { get; set; } = null!;

    public bool? Visible
    {
        get; set;
    }

    public DateOnly? FechaUltimaActividad
    {
        get; set;
    }

    public string? MotivoOculto
    {
        get; set;
    }

    public virtual ICollection<Admite> Admites { get; set; } = new List<Admite>();

    public virtual ICollection<Aplica> Aplicas { get; set; } = new List<Aplica>();

    public virtual ICollection<Comenta> Comenta { get; set; } = new List<Comenta>();

    public virtual Cotizacion Cotizacion { get; set; } = null!;

    public virtual ICollection<Distribuye> Distribuyes { get; set; } = new List<Distribuye>();

    public virtual ICollection<Establece> Estableces { get; set; } = new List<Establece>();

    public virtual ICollection<Provee> Provees { get; set; } = new List<Provee>();

    public virtual ICollection<Valorar> Valorars { get; set; } = new List<Valorar>();

    public virtual ICollection<Categoria> Categoria { get; set; } = new List<Categoria>();

    public virtual ICollection<Lista_Deseos> ListaDeseos { get; set; } = new List<Lista_Deseos>();
}
