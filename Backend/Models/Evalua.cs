using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Evalua
{
    public int ReseniaId
    {
        get; set;
    }

    public string UsuarioClienteId { get; set; } = null!;

    public string UsuarioEmprendedorId { get; set; } = null!;

    public virtual Resenia Resenia { get; set; } = null!;

    public virtual Usuario UsuarioCliente { get; set; } = null!;

    public virtual Usuario UsuarioEmprendedor { get; set; } = null!;
}
