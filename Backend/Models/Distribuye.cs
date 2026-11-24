using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Distribuye
{
    public string EmpresaId { get; set; } = null!;

    public string ServicioId { get; set; } = null!;

    public int Precio { get; set; }

    public virtual Empresa Empresa { get; set; } = null!;

    public virtual Servicio Servicio { get; set; } = null!;
}
