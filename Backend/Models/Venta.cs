using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Venta
{
    public int IdVenta
    {
        get; set;
    }

    public int CodigoTransferencia
    {
        get; set;
    }

    public DateTime? Fecha
    {
        get; set;
    }

    public string? Estado
    {
        get; set;
    }

    public bool? Pagada
    {
        get; set;
    }

    public virtual ICollection<Aplica> Aplicas { get; set; } = new List<Aplica>();

    public virtual ICollection<Compra> Compras { get; set; } = new List<Compra>();

    public virtual ICollection<Detalle> Detalles { get; set; } = new List<Detalle>();

    public virtual ICollection<Establece> Estableces { get; set; } = new List<Establece>();

    public virtual ICollection<Genera> Generas { get; set; } = new List<Genera>();

    public virtual ICollection<Incluye> Incluyes { get; set; } = new List<Incluye>();

    public virtual Pago? Pago
    {
        get; set;
    }

    public virtual Venta_Datos? Venta_Datos
    {
        get; set;
    }
}
