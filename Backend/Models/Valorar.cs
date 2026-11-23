using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Valorar
{
    public int ReseniaId
    {
        get; set;
    }

    public string UsuarioId { get; set; } = null!;

    public string ServicioId { get; set; } = null!;

    public virtual Resenia Resenia { get; set; } = null!;

    public virtual Servicio Servicio { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
