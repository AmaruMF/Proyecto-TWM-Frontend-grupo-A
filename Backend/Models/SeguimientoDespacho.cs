using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class SeguimientoDespacho
{
    public int NumeroSeguimiento { get; set; }

    public string NombreEmpresaTransporte { get; set; } = null!;
}
