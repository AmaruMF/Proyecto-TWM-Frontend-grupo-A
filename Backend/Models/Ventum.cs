using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Ventum
{
    public int IdVenta { get; set; }

    public int CodigoTransferencia { get; set; }

    public virtual ICollection<Aplica> Aplicas { get; set; } = new List<Aplica>();

    public virtual ICollection<Detalle> Detalles { get; set; } = new List<Detalle>();

    public virtual ICollection<Establece> Estableces { get; set; } = new List<Establece>();

    public virtual ICollection<Genera> Generas { get; set; } = new List<Genera>();

    public virtual ICollection<Incluye> Incluyes { get; set; } = new List<Incluye>();

    public virtual Pago? Pago { get; set; }

    public virtual VentaDato? VentaDato { get; set; }

    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
