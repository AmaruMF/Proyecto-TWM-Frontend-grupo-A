using System;
using System.Collections.Generic;

namespace Backend_GrupoA.Models;

public partial class Usuario
{
    public string Run { get; set; } = null!;

    public string Nombre { get; set; } = null!;

    public string ClaveAcceso { get; set; } = null!;

    public DateOnly FechaNacimiento { get; set; }

    public DateOnly FechaRegistro { get; set; }

    public int Tipo { get; set; }

    public virtual ICollection<Aplica> Aplicas { get; set; } = new List<Aplica>();

    public virtual ICollection<Comentum> Comenta { get; set; } = new List<Comentum>();

    public virtual ICollection<Consultar> Consultars { get; set; } = new List<Consultar>();

    public virtual ICollection<Correo> Correos { get; set; } = new List<Correo>();

    public virtual ICollection<Direccion> Direccions { get; set; } = new List<Direccion>();

    public virtual ICollection<Ejerce> Ejerces { get; set; } = new List<Ejerce>();

    public virtual ICollection<Empresa> Empresas { get; set; } = new List<Empresa>();

    public virtual ICollection<Evalua> EvaluaUsuarioClientes { get; set; } = new List<Evalua>();

    public virtual ICollection<Evalua> EvaluaUsuarioEmprendedors { get; set; } = new List<Evalua>();

    public virtual ICollection<Incluye> Incluyes { get; set; } = new List<Incluye>();

    public virtual ICollection<Mensajerium> MensajeriaNavigation { get; set; } = new List<Mensajerium>();

    public virtual ICollection<Preguntar> Preguntars { get; set; } = new List<Preguntar>();

    public virtual ICollection<Provee> Provees { get; set; } = new List<Provee>();

    public virtual ICollection<Reseniar> Reseniars { get; set; } = new List<Reseniar>();

    public virtual ICollection<Telefono> Telefonos { get; set; } = new List<Telefono>();

    public virtual ICollection<Valorar> Valorars { get; set; } = new List<Valorar>();

    public virtual ICollection<Vende> Vendes { get; set; } = new List<Vende>();

    public virtual ICollection<ListaDeseo> ListaDeseos { get; set; } = new List<ListaDeseo>();

    public virtual ICollection<Mensajerium> Mensajeria { get; set; } = new List<Mensajerium>();

    public virtual ICollection<Ventum> Venta { get; set; } = new List<Ventum>();
}
