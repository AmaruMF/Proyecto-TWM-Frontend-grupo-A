using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Seguimiento_Despacho
{
    public int NumeroSeguimiento
    {
        get; set;
    }

    public string NombreEmpresaTransporte { get; set; } = null!;
}
