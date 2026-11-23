using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Despacho_Datos
{
    public int IdDespacho
    {
        get; set;
    }

    public int Precio
    {
        get; set;
    }

    public DateOnly Fecha
    {
        get; set;
    }

    public string Estado { get; set; } = null!;

    public int HistorialCompraId
    {
        get; set;
    }

    public decimal? Ancho
    {
        get; set;
    }

    public decimal? Alto
    {
        get; set;
    }

    public decimal? Fondo
    {
        get; set;
    }

    public decimal? Volumen
    {
        get; set;
    }

    public decimal? CostoEnvioProyectado
    {
        get; set;
    }

    public virtual Historial_Compra Historial_Compra { get; set; } = null!;

    public virtual Despacho IdDespachoNavigation { get; set; } = null!;
}
