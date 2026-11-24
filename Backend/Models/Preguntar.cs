using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Preguntar
{
    public string UsuarioId { get; set; } = null!;

    public string MensajeriaId { get; set; } = null!;

    public string ProductoId { get; set; } = null!;

    public virtual Mensajerium Mensajeria { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
