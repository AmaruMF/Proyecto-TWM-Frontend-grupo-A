using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Comuna
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public int Superficie { get; set; }

    public int IdProvincia { get; set; }

    public virtual ICollection<Direccion> Direccions { get; set; } = new List<Direccion>();

    public virtual Provincium IdProvinciaNavigation { get; set; } = null!;
}
