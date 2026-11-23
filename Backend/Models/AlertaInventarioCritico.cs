using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class AlertaInventarioCritico
{
    public int IdAlerta
    {
        get; set;
    }

    public string? ProductoId
    {
        get; set;
    }

    public int? StockId
    {
        get; set;
    }

    public int? Cantidad
    {
        get; set;
    }

    public DateTime? Fecha
    {
        get; set;
    }

    public string? Mensaje
    {
        get; set;
    }

    public bool? Atendida
    {
        get; set;
    }
}
