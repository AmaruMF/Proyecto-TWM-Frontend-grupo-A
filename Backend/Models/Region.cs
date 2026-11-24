using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Region
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public int Superficie { get; set; }

    public virtual ICollection<Provincium> Provincia { get; set; } = new List<Provincium>();
}
