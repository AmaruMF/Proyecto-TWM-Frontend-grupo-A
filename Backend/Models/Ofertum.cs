using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Ofertum
{
    public int IdOferta { get; set; }

    public int Porcentaje { get; set; }

    public virtual ICollection<Admite> Admites { get; set; } = new List<Admite>();

    public virtual ICollection<Promociona> Promocionas { get; set; } = new List<Promociona>();
}
