using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class VentaDato
{
    public int IdVenta { get; set; }

    public int Cantidad { get; set; }

    public int TotalIva { get; set; }

    public int PrecioSinIva { get; set; }

    public int PrecioTotal { get; set; }

    public DateOnly Fecha { get; set; }

    public virtual Ventum IdVentaNavigation { get; set; } = null!;
}
