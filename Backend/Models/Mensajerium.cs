using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Mensajerium
{
    public string IdMensajeria { get; set; } = null!;

    public string Comentario { get; set; } = null!;

    public DateOnly Fecha { get; set; }

    public string UsuarioId { get; set; } = null!;

    public string EmpresaId { get; set; } = null!;

    public virtual ICollection<Comentum> Comenta { get; set; } = new List<Comentum>();

    public virtual ICollection<Consultar> Consultars { get; set; } = new List<Consultar>();

    public virtual Empresa Empresa { get; set; } = null!;

    public virtual ICollection<Preguntar> Preguntars { get; set; } = new List<Preguntar>();

    public virtual Usuario Usuario { get; set; } = null!;

    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
