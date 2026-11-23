using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Categoria
{
    public int IdCategoria
    {
        get; set;
    }

    public string Nombre { get; set; } = null!;

    public string Tipo { get; set; } = null!;

    public virtual ICollection<Categoria> CategoriaHijos { get; set; } = new List<Categoria>();

    public virtual ICollection<Categoria> CategoriaPadres { get; set; } = new List<Categoria>();

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();

    public virtual ICollection<Servicio> Servicios { get; set; } = new List<Servicio>();
}
