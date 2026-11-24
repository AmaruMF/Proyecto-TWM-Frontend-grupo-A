using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Categorium
{
    public int IdCategoria { get; set; }

    public string Nombre { get; set; } = null!;

    public string Tipo { get; set; } = null!;

    public virtual ICollection<Categorium> CategoriaHijos { get; set; } = new List<Categorium>();

    public virtual ICollection<Categorium> CategoriaPadres { get; set; } = new List<Categorium>();

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();

    public virtual ICollection<Servicio> Servicios { get; set; } = new List<Servicio>();
}
