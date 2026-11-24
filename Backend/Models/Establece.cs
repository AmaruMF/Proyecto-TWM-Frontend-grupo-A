using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Establece
{
    public int VentaId { get; set; }

    public string ServicioId { get; set; } = null!;

    public string EmpresaId { get; set; } = null!;

    public virtual Empresa Empresa { get; set; } = null!;

    public virtual Servicio Servicio { get; set; } = null!;

    public virtual Ventum Venta { get; set; } = null!;
}
