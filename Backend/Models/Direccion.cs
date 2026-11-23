using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Direccion
{
    public string CodigoPostal { get; set; } = null!;

    public int ComunaId
    {
        get; set;
    }

    public string Calle { get; set; } = null!;

    public string Numero { get; set; } = null!;

    public string EmpresaId { get; set; } = null!;

    public string UsuarioId { get; set; } = null!;

    public virtual Comuna Comuna { get; set; } = null!;

    public virtual Considera? Considera
    {
        get; set;
    }

    public virtual ICollection<Definir> Definirs { get; set; } = new List<Definir>();

    public virtual Empresa Empresa { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
