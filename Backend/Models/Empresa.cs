using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Empresa
{
    public string RunEmpresa { get; set; } = null!;

    public string Nombre { get; set; } = null!;

    public string? PaginaWeb
    {
        get; set;
    }

    public string UsuarioId { get; set; } = null!;

    public virtual ICollection<Correo> Correos { get; set; } = new List<Correo>();

    public virtual ICollection<Cotizacion> Cotizacions { get; set; } = new List<Cotizacion>();

    public virtual ICollection<Detalle> Detalles { get; set; } = new List<Detalle>();

    public virtual ICollection<Direccion> Direccions { get; set; } = new List<Direccion>();

    public virtual ICollection<Distribuye> Distribuyes { get; set; } = new List<Distribuye>();

    public virtual ICollection<Establece> Estableces { get; set; } = new List<Establece>();

    public virtual ICollection<Mensajeria> Mensajeria { get; set; } = new List<Mensajeria>();

    public virtual Usuario Usuario { get; set; } = null!;

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
