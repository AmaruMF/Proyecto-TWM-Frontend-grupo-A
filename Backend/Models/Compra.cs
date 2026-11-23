using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Compra
{
    public string Usuario { get; set; } = null!;

    public int VentaId
    {
        get; set;
    }

    public DateTime? Fecha
    {
        get; set;
    }

    public decimal? DescuentoAplicado
    {
        get; set;
    }

    public string? Nota
    {
        get; set;
    }

    public virtual Usuario UsuarioNavigation { get; set; } = null!;

    public virtual Venta Venta { get; set; } = null!;
}
