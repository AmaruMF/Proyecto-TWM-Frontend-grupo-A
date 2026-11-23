using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Stock
{
    public int IdStock
    {
        get; set;
    }

    public int Cantidad
    {
        get; set;
    }

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
