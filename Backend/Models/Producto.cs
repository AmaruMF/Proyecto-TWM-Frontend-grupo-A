using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Producto
{
    public string Sku { get; set; } = null!;

    public string Nombre { get; set; } = null!;

    public bool RestriccionEdad { get; set; }

    public string Marca { get; set; } = null!;

    public int CotizacionId { get; set; }

    public string Caracteristica { get; set; } = null!;

    public int StockId { get; set; }

    public virtual Cotizacion Cotizacion { get; set; } = null!;

    public virtual ICollection<Definir> Definirs { get; set; } = new List<Definir>();

    public virtual ICollection<Detalle> Detalles { get; set; } = new List<Detalle>();

    public virtual ICollection<Incluye> Incluyes { get; set; } = new List<Incluye>();

    public virtual ICollection<Preguntar> Preguntars { get; set; } = new List<Preguntar>();

    public virtual ICollection<Promociona> Promocionas { get; set; } = new List<Promociona>();

    public virtual ICollection<Reseniar> Reseniars { get; set; } = new List<Reseniar>();

    public virtual Stock Stock { get; set; } = null!;

    public virtual ICollection<Vende> Vendes { get; set; } = new List<Vende>();

    public virtual ICollection<Categorium> Categoria { get; set; } = new List<Categorium>();

    public virtual ICollection<Empresa> Empresas { get; set; } = new List<Empresa>();

    public virtual ICollection<ListaDeseo> ListaDeseos { get; set; } = new List<ListaDeseo>();
}
