using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Despacho
{
    public int IdDespacho { get; set; }

    public int Precio { get; set; }

    public DateOnly Fecha { get; set; }

    public int? NumeroSeguimiento { get; set; }

    public string? NombreEmpresaTransporte { get; set; }

    public string Estado { get; set; } = null!;

    public int HistorialCompraId { get; set; }

    public virtual ICollection<Considera> Consideras { get; set; } = new List<Considera>();

    public virtual ICollection<Definir> Definirs { get; set; } = new List<Definir>();

    public virtual DespachoDato? DespachoDato { get; set; }

    public virtual ICollection<Devolucion> Devolucions { get; set; } = new List<Devolucion>();

    public virtual HistorialCompra HistorialCompra { get; set; } = null!;
}
