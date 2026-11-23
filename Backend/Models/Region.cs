using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Region
{
    public int Id
    {
        get; set;
    }

    public string Nombre { get; set; } = null!;

    public int Superficie
    {
        get; set;
    }

    public virtual ICollection<Provincia> Provincia { get; set; } = new List<Provincia>();
}
