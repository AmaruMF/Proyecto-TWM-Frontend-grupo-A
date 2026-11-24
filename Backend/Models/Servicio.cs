using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Servicio
{
    public string Sku { get; set; } = null!;

    public string Nombre { get; set; } = null!;

    public bool RestriccionEdad { get; set; }

    public int Tiempo { get; set; }

    public int CotizacionId { get; set; }

    public string Caracteristica { get; set; } = null!;

    public virtual ICollection<Admite> Admites { get; set; } = new List<Admite>();

    public virtual ICollection<Aplica> Aplicas { get; set; } = new List<Aplica>();

    public virtual ICollection<Comentum> Comenta { get; set; } = new List<Comentum>();

    public virtual Cotizacion Cotizacion { get; set; } = null!;

    public virtual ICollection<Distribuye> Distribuyes { get; set; } = new List<Distribuye>();

    public virtual ICollection<Establece> Estableces { get; set; } = new List<Establece>();

    public virtual ICollection<Provee> Provees { get; set; } = new List<Provee>();

    public virtual ICollection<Valorar> Valorars { get; set; } = new List<Valorar>();

    public virtual ICollection<Categorium> Categoria { get; set; } = new List<Categorium>();

    public virtual ICollection<ListaDeseo> ListaDeseos { get; set; } = new List<ListaDeseo>();
}
