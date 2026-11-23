using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Provincia
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

    public int IdRegion
    {
        get; set;
    }

    public virtual ICollection<Comuna> Comunas { get; set; } = new List<Comuna>();

    public virtual Region IdRegionNavigation { get; set; } = null!;
}
