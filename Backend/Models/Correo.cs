using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Correo
{
    public int IdCorreo { get; set; }

    public string DireccionCorreo { get; set; } = null!;

    public string Dominio { get; set; } = null!;

    public string UsuarioId { get; set; } = null!;

    public string EmpresaId { get; set; } = null!;

    public virtual Empresa Empresa { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
