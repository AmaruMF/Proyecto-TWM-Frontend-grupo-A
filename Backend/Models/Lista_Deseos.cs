using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Lista_Deseos
{
    public int IdListaDeseos
    {
        get; set;
    }

    public string Nombre { get; set; } = null!;

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();

    public virtual ICollection<Servicio> Servicios { get; set; } = new List<Servicio>();

    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
