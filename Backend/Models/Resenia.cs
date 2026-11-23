using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Resenia
{
    public int IdResenia
    {
        get; set;
    }

    public int? Puntaje
    {
        get; set;
    }

    public string? Comentario
    {
        get; set;
    }

    public virtual Evalua? Evalua
    {
        get; set;
    }

    public virtual Reseniar? Reseniar
    {
        get; set;
    }

    public virtual Valorar? Valorar
    {
        get; set;
    }
}
