using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using TiendaMultiplaza.API.Models;

namespace TiendaMultiplaza.API.Data;

public partial class TiendaMultiplazaContext : DbContext
{
    public TiendaMultiplazaContext(DbContextOptions<TiendaMultiplazaContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Admite> Admite
    {
        get; set;
    }

    public virtual DbSet<AlertaInventarioCritico> AlertaInventarioCritico
    {
        get; set;
    }

    public virtual DbSet<Aplica> Aplica
    {
        get; set;
    }

    public virtual DbSet<Categoria> Categoria
    {
        get; set;
    }

    public virtual DbSet<Comenta> Comenta
    {
        get; set;
    }

    public virtual DbSet<Compra> Compra
    {
        get; set;
    }

    public virtual DbSet<Comuna> Comuna
    {
        get; set;
    }

    public virtual DbSet<Considera> Considera
    {
        get; set;
    }

    public virtual DbSet<Consultar> Consultar
    {
        get; set;
    }

    public virtual DbSet<Correo> Correo
    {
        get; set;
    }

    public virtual DbSet<Cotizacion> Cotizacion
    {
        get; set;
    }

    public virtual DbSet<Cotizacion_Detalle> Cotizacion_Detalle
    {
        get; set;
    }

    public virtual DbSet<Definir> Definir
    {
        get; set;
    }

    public virtual DbSet<Despacho> Despacho
    {
        get; set;
    }

    public virtual DbSet<Despacho_Datos> Despacho_Datos
    {
        get; set;
    }

    public virtual DbSet<Detalle> Detalle
    {
        get; set;
    }

    public virtual DbSet<Devolucion> Devolucion
    {
        get; set;
    }

    public virtual DbSet<Direccion> Direccion
    {
        get; set;
    }

    public virtual DbSet<Distribuye> Distribuye
    {
        get; set;
    }

    public virtual DbSet<Ejerce> Ejerce
    {
        get; set;
    }

    public virtual DbSet<Empresa> Empresa
    {
        get; set;
    }

    public virtual DbSet<Establece> Establece
    {
        get; set;
    }

    public virtual DbSet<Evalua> Evalua
    {
        get; set;
    }

    public virtual DbSet<Genera> Genera
    {
        get; set;
    }

    public virtual DbSet<Historial_Compra> Historial_Compra
    {
        get; set;
    }

    public virtual DbSet<Incluye> Incluye
    {
        get; set;
    }

    public virtual DbSet<Lista_Deseos> Lista_Deseos
    {
        get; set;
    }

    public virtual DbSet<Mensajeria> Mensajeria
    {
        get; set;
    }

    public virtual DbSet<Oferta> Oferta
    {
        get; set;
    }

    public virtual DbSet<Pago> Pago
    {
        get; set;
    }

    public virtual DbSet<Preguntar> Preguntar
    {
        get; set;
    }

    public virtual DbSet<Producto> Producto
    {
        get; set;
    }

    public virtual DbSet<Promociona> Promociona
    {
        get; set;
    }

    public virtual DbSet<Provee> Provee
    {
        get; set;
    }

    public virtual DbSet<Provincia> Provincia
    {
        get; set;
    }

    public virtual DbSet<Region> Region
    {
        get; set;
    }

    public virtual DbSet<Reseniar> Reseniar
    {
        get; set;
    }

    public virtual DbSet<Resenia> Resenia
    {
        get; set;
    }

    public virtual DbSet<Seguimiento_Despacho> Seguimiento_Despacho
    {
        get; set;
    }

    public virtual DbSet<Servicio> Servicio
    {
        get; set;
    }

    public virtual DbSet<Stock> Stock
    {
        get; set;
    }

    public virtual DbSet<Telefono> Telefono
    {
        get; set;
    }

    public virtual DbSet<Usuario> Usuario
    {
        get; set;
    }

    public virtual DbSet<Valorar> Valorar
    {
        get; set;
    }

    public virtual DbSet<Vende> Vende
    {
        get; set;
    }

    public virtual DbSet<Venta_Datos> Venta_Datos
    {
        get; set;
    }

    public virtual DbSet<Venta> Venta
    {
        get; set;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Admite>(entity =>
        {
            entity.HasKey(e => new { e.ServicioId, e.OfertaId }).HasName("admite_pkey");

            entity.ToTable("admite");

            entity.Property(e => e.ServicioId)
                .HasMaxLength(50)
                .HasColumnName("servicio_id");
            entity.Property(e => e.OfertaId).HasColumnName("oferta_id");
            entity.Property(e => e.FechaFin).HasColumnName("fecha_fin");
            entity.Property(e => e.FechaInicio).HasColumnName("fecha_inicio");

            entity.HasOne(d => d.Oferta).WithMany(p => p.Admites)
                .HasForeignKey(d => d.OfertaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("admite_oferta_id_fkey");

            entity.HasOne(d => d.Servicio).WithMany(p => p.Admites)
                .HasForeignKey(d => d.ServicioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("admite_servicio_id_fkey");
        });

        modelBuilder.Entity<AlertaInventarioCritico>(entity =>
        {
            entity.HasKey(e => e.IdAlerta).HasName("alerta_inventario_critico_pkey");

            entity.ToTable("alerta_inventario_critico");

            entity.Property(e => e.IdAlerta).HasColumnName("id_alerta");
            entity.Property(e => e.Atendida)
                .HasDefaultValue(false)
                .HasColumnName("atendida");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("fecha");
            entity.Property(e => e.Mensaje).HasColumnName("mensaje");
            entity.Property(e => e.ProductoId)
                .HasMaxLength(50)
                .HasColumnName("producto_id");
            entity.Property(e => e.StockId).HasColumnName("stock_id");
        });

        modelBuilder.Entity<Aplica>(entity =>
        {
            entity.HasKey(e => new { e.VentaId, e.ServicioId }).HasName("aplica_pkey");

            entity.ToTable("aplica");

            entity.HasIndex(e => e.ServicioId, "idx_aplica_servicio");

            entity.Property(e => e.VentaId).HasColumnName("venta_id");
            entity.Property(e => e.ServicioId)
                .HasMaxLength(50)
                .HasColumnName("servicio_id");
            entity.Property(e => e.DescuentoOferta)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("descuento_oferta");
            entity.Property(e => e.PrecioFinal)
                .HasPrecision(12, 2)
                .HasColumnName("precio_final");
            entity.Property(e => e.PrecioOriginal)
                .HasPrecision(12, 2)
                .HasColumnName("precio_original");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Servicio).WithMany(p => p.Aplicas)
                .HasForeignKey(d => d.ServicioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("aplica_servicio_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Aplicas)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("aplica_usuario_id_fkey");

            entity.HasOne(d => d.Venta).WithMany(p => p.Aplicas)
                .HasForeignKey(d => d.VentaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("aplica_venta_id_fkey");
        });

        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasKey(e => e.IdCategoria).HasName("categoria_pkey");

            entity.ToTable("categoria");

            entity.HasIndex(e => e.Nombre, "uq_categoria_nombre").IsUnique();

            entity.Property(e => e.IdCategoria)
                .ValueGeneratedNever()
                .HasColumnName("id_categoria");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .HasColumnName("nombre");
            entity.Property(e => e.Tipo)
                .HasMaxLength(50)
                .HasColumnName("tipo");

            entity.HasMany(d => d.CategoriaHijos).WithMany(p => p.CategoriaPadres)
                .UsingEntity<Dictionary<string, object>>(
                    "Subdivide",
                    r => r.HasOne<Categoria>().WithMany()
                        .HasPrincipalKey("Nombre")
                        .HasForeignKey("CategoriaHijo")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("subdivide_categoria_hijo_fkey"),
                    l => l.HasOne<Categoria>().WithMany()
                        .HasPrincipalKey("Nombre")
                        .HasForeignKey("CategoriaPadre")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("subdivide_categoria_padre_fkey"),
                    j =>
                    {
                        j.HasKey("CategoriaPadre", "CategoriaHijo").HasName("subdivide_pkey");
                        j.ToTable("subdivide");
                        j.IndexerProperty<string>("CategoriaPadre")
                            .HasMaxLength(100)
                            .HasColumnName("categoria_padre");
                        j.IndexerProperty<string>("CategoriaHijo")
                            .HasMaxLength(100)
                            .HasColumnName("categoria_hijo");
                    });

            entity.HasMany(d => d.CategoriaPadres).WithMany(p => p.CategoriaHijos)
                .UsingEntity<Dictionary<string, object>>(
                    "Subdivide",
                    r => r.HasOne<Categoria>().WithMany()
                        .HasPrincipalKey("Nombre")
                        .HasForeignKey("CategoriaPadre")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("subdivide_categoria_padre_fkey"),
                    l => l.HasOne<Categoria>().WithMany()
                        .HasPrincipalKey("Nombre")
                        .HasForeignKey("CategoriaHijo")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("subdivide_categoria_hijo_fkey"),
                    j =>
                    {
                        j.HasKey("CategoriaPadre", "CategoriaHijo").HasName("subdivide_pkey");
                        j.ToTable("subdivide");
                        j.IndexerProperty<string>("CategoriaPadre")
                            .HasMaxLength(100)
                            .HasColumnName("categoria_padre");
                        j.IndexerProperty<string>("CategoriaHijo")
                            .HasMaxLength(100)
                            .HasColumnName("categoria_hijo");
                    });
        });

        modelBuilder.Entity<Comenta>(entity =>
        {
            entity.HasKey(e => new { e.UsuarioId, e.MensajeriaId }).HasName("comenta_pkey");

            entity.ToTable("comenta");

            entity.HasIndex(e => e.ServicioId, "idx_comenta_servicio");

            entity.HasIndex(e => e.UsuarioId, "idx_comenta_usuario");

            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");
            entity.Property(e => e.MensajeriaId)
                .HasMaxLength(50)
                .HasColumnName("mensajeria_id");
            entity.Property(e => e.ServicioId)
                .HasMaxLength(50)
                .HasColumnName("servicio_id");

            entity.HasOne(d => d.Mensajeria).WithMany(p => p.Comenta)
                .HasForeignKey(d => d.MensajeriaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("comenta_mensajeria_id_fkey");

            entity.HasOne(d => d.Servicio).WithMany(p => p.Comenta)
                .HasForeignKey(d => d.ServicioId)
                .HasConstraintName("comenta_servicio_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Comenta)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("comenta_usuario_id_fkey");
        });

        modelBuilder.Entity<Compra>(entity =>
        {
            entity.HasKey(e => new { e.Usuario, e.VentaId }).HasName("compra_pkey");

            entity.ToTable("compra");

            entity.Property(e => e.Usuario)
                .HasMaxLength(15)
                .HasColumnName("usuario");
            entity.Property(e => e.VentaId).HasColumnName("venta_id");
            entity.Property(e => e.DescuentoAplicado)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("descuento_aplicado");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("fecha");
            entity.Property(e => e.Nota).HasColumnName("nota");

            entity.HasOne(d => d.UsuarioNavigation).WithMany(p => p.Compras)
                .HasForeignKey(d => d.Usuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("compra_usuario_fkey");

            entity.HasOne(d => d.Venta).WithMany(p => p.Compras)
                .HasForeignKey(d => d.VentaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("compra_venta_id_fkey");
        });

        modelBuilder.Entity<Comuna>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("comuna_pkey");

            entity.ToTable("comuna");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.IdProvincia).HasColumnName("id_provincia");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .HasColumnName("nombre");
            entity.Property(e => e.Superficie).HasColumnName("superficie");

            entity.HasOne(d => d.IdProvinciaNavigation).WithMany(p => p.Comunas)
                .HasForeignKey(d => d.IdProvincia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("comuna_id_provincia_fkey");
        });

        modelBuilder.Entity<Considera>(entity =>
        {
            entity.HasKey(e => e.DireccionId).HasName("considera_pkey");

            entity.ToTable("considera");

            entity.Property(e => e.DireccionId)
                .HasMaxLength(12)
                .HasColumnName("direccion_id");
            entity.Property(e => e.DespachoId).HasColumnName("despacho_id");
            entity.Property(e => e.MedioPagoId).HasColumnName("medio_pago_id");

            entity.HasOne(d => d.Despacho).WithMany(p => p.Consideras)
                .HasForeignKey(d => d.DespachoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("considera_despacho_id_fkey");

            entity.HasOne(d => d.Direccion).WithOne(p => p.Considera)
                .HasForeignKey<Considera>(d => d.DireccionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("considera_direccion_id_fkey");
        });

        modelBuilder.Entity<Consultar>(entity =>
        {
            entity.HasKey(e => new { e.UsuarioId, e.MensajeriaId }).HasName("consultar_pkey");

            entity.ToTable("consultar");

            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");
            entity.Property(e => e.MensajeriaId)
                .HasMaxLength(50)
                .HasColumnName("mensajeria_id");
            entity.Property(e => e.MedioPagoId).HasColumnName("medio_pago_id");

            entity.HasOne(d => d.Mensajeria).WithMany(p => p.Consultars)
                .HasForeignKey(d => d.MensajeriaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("consultar_mensajeria_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Consultars)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("consultar_usuario_id_fkey");
        });

        modelBuilder.Entity<Correo>(entity =>
        {
            entity.HasKey(e => e.IdCorreo).HasName("correo_pkey");

            entity.ToTable("correo");

            entity.HasIndex(e => e.EmpresaId, "idx_correo_empresa");

            entity.HasIndex(e => e.UsuarioId, "idx_correo_usuario");

            entity.HasIndex(e => e.DireccionCorreo, "uq_correo_direccion").IsUnique();

            entity.Property(e => e.IdCorreo)
                .ValueGeneratedNever()
                .HasColumnName("id_correo");
            entity.Property(e => e.CorreoValido)
                .HasDefaultValue(true)
                .HasColumnName("correo_valido");
            entity.Property(e => e.DireccionCorreo)
                .HasMaxLength(255)
                .HasColumnName("direccion_correo");
            entity.Property(e => e.Dominio)
                .HasMaxLength(50)
                .HasColumnName("dominio");
            entity.Property(e => e.EmpresaId)
                .HasMaxLength(15)
                .HasColumnName("empresa_id");
            entity.Property(e => e.ObservacionValidacion).HasColumnName("observacion_validacion");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Empresa).WithMany(p => p.Correos)
                .HasForeignKey(d => d.EmpresaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("correo_empresa_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Correos)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("correo_usuario_id_fkey");
        });

        modelBuilder.Entity<Cotizacion>(entity =>
        {
            entity.HasKey(e => e.IdCotizacion).HasName("cotizacion_pkey");

            entity.ToTable("cotizacion");

            entity.HasIndex(e => e.EmpresaId, "idx_cotizacion_empresa");

            entity.HasIndex(e => e.Fecha, "idx_cotizacion_fecha");

            entity.Property(e => e.IdCotizacion)
                .ValueGeneratedNever()
                .HasColumnName("id_cotizacion");
            entity.Property(e => e.EmpresaId)
                .HasMaxLength(15)
                .HasColumnName("empresa_id");
            entity.Property(e => e.Estado)
                .HasMaxLength(30)
                .HasDefaultValueSql("'Vigente'::character varying")
                .HasColumnName("estado");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.FechaEliminacion).HasColumnName("fecha_eliminacion");
            entity.Property(e => e.FechaVencimiento).HasColumnName("fecha_vencimiento");
            entity.Property(e => e.PrecioTotal)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("precio_total");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Empresa).WithMany(p => p.Cotizacions)
                .HasForeignKey(d => d.EmpresaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("cotizacion_empresa_id_fkey");
        });

        modelBuilder.Entity<Cotizacion_Detalle>(entity =>
        {
            entity.HasKey(e => e.IdCotizacionDetalle).HasName("cotizacion_detalle_pkey");

            entity.ToTable("cotizacion_detalle");

            entity.Property(e => e.IdCotizacionDetalle).HasColumnName("id_cotizacion_detalle");
            entity.Property(e => e.Cantidad)
                .HasDefaultValue(1)
                .HasColumnName("cantidad");
            entity.Property(e => e.CotizacionId).HasColumnName("cotizacion_id");
            entity.Property(e => e.DescuentoOferta)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("descuento_oferta");
            entity.Property(e => e.FechaRegistro)
                .HasDefaultValueSql("CURRENT_DATE")
                .HasColumnName("fecha_registro");
            entity.Property(e => e.FechaUltimaActualizacion)
                .HasDefaultValueSql("CURRENT_DATE")
                .HasColumnName("fecha_ultima_actualizacion");
            entity.Property(e => e.PrecioCotizado)
                .HasPrecision(12, 2)
                .HasColumnName("precio_cotizado");
            entity.Property(e => e.PrecioOriginal)
                .HasPrecision(12, 2)
                .HasColumnName("precio_original");
            entity.Property(e => e.ProductoId)
                .HasMaxLength(50)
                .HasColumnName("producto_id");
            entity.Property(e => e.ServicioId)
                .HasMaxLength(50)
                .HasColumnName("servicio_id");
        });

        modelBuilder.Entity<Definir>(entity =>
        {
            entity.HasKey(e => new { e.ProductoId, e.DireccionId, e.DespachoId }).HasName("definir_pkey");

            entity.ToTable("definir");

            entity.Property(e => e.ProductoId)
                .HasMaxLength(50)
                .HasColumnName("producto_id");
            entity.Property(e => e.DireccionId)
                .HasMaxLength(12)
                .HasColumnName("direccion_id");
            entity.Property(e => e.DespachoId).HasColumnName("despacho_id");

            entity.HasOne(d => d.Despacho).WithMany(p => p.Definirs)
                .HasForeignKey(d => d.DespachoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("definir_despacho_id_fkey");

            entity.HasOne(d => d.Direccion).WithMany(p => p.Definirs)
                .HasForeignKey(d => d.DireccionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("definir_direccion_id_fkey");

            entity.HasOne(d => d.Producto).WithMany(p => p.Definirs)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("definir_producto_id_fkey");
        });

        modelBuilder.Entity<Despacho>(entity =>
        {
            entity.HasKey(e => e.IdDespacho).HasName("despacho_pkey");

            entity.ToTable("despacho");

            entity.HasIndex(e => e.Fecha, "idx_despacho_fecha");

            entity.Property(e => e.IdDespacho)
                .ValueGeneratedNever()
                .HasColumnName("id_despacho");
            entity.Property(e => e.Estado)
                .HasMaxLength(30)
                .HasColumnName("estado");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.HistorialCompraId).HasColumnName("historial_compra_id");
            entity.Property(e => e.NombreEmpresaTransporte)
                .HasMaxLength(100)
                .HasColumnName("nombre_empresa_transporte");
            entity.Property(e => e.NumeroSeguimiento).HasColumnName("numero_seguimiento");
            entity.Property(e => e.Precio).HasColumnName("precio");

            entity.HasOne(d => d.Historial_Compra).WithMany(p => p.Despachos)
                .HasForeignKey(d => d.HistorialCompraId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("despacho_historial_compra_id_fkey");
        });

        modelBuilder.Entity<Despacho_Datos>(entity =>
        {
            entity.HasKey(e => e.IdDespacho).HasName("despacho_datos_pkey");

            entity.ToTable("despacho_datos");

            entity.HasIndex(e => e.Fecha, "idx_despacho_datos_fecha");

            entity.Property(e => e.IdDespacho)
                .ValueGeneratedNever()
                .HasColumnName("id_despacho");
            entity.Property(e => e.Alto)
                .HasPrecision(10, 2)
                .HasColumnName("alto");
            entity.Property(e => e.Ancho)
                .HasPrecision(10, 2)
                .HasColumnName("ancho");
            entity.Property(e => e.CostoEnvioProyectado)
                .HasPrecision(12, 2)
                .HasColumnName("costo_envio_proyectado");
            entity.Property(e => e.Estado)
                .HasMaxLength(30)
                .HasColumnName("estado");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.Fondo)
                .HasPrecision(10, 2)
                .HasColumnName("fondo");
            entity.Property(e => e.HistorialCompraId).HasColumnName("historial_compra_id");
            entity.Property(e => e.Precio).HasColumnName("precio");
            entity.Property(e => e.Volumen)
                .HasPrecision(14, 2)
                .HasColumnName("volumen");

            entity.HasOne(d => d.Historial_Compra).WithMany(p => p.DespachoDatos)
                .HasForeignKey(d => d.HistorialCompraId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("despacho_datos_historial_compra_id_fkey");

            entity.HasOne(d => d.IdDespachoNavigation).WithOne(p => p.Despacho_Datos)
                .HasForeignKey<Despacho_Datos>(d => d.IdDespacho)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("despacho_datos_id_despacho_fkey");
        });

        modelBuilder.Entity<Detalle>(entity =>
        {
            entity.HasKey(e => new { e.ProductoId, e.VentaId }).HasName("detalle_pkey");

            entity.ToTable("detalle");

            entity.HasIndex(e => e.EmpresaId, "idx_detalle_empresa");

            entity.Property(e => e.ProductoId)
                .HasMaxLength(50)
                .HasColumnName("producto_id");
            entity.Property(e => e.VentaId).HasColumnName("venta_id");
            entity.Property(e => e.EmpresaId)
                .HasMaxLength(15)
                .HasColumnName("empresa_id");

            entity.HasOne(d => d.Empresa).WithMany(p => p.Detalles)
                .HasForeignKey(d => d.EmpresaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("detalle_empresa_id_fkey");

            entity.HasOne(d => d.Producto).WithMany(p => p.Detalles)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("detalle_producto_id_fkey");

            entity.HasOne(d => d.Venta).WithMany(p => p.Detalles)
                .HasForeignKey(d => d.VentaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("detalle_venta_id_fkey");
        });

        modelBuilder.Entity<Devolucion>(entity =>
        {
            entity.HasKey(e => e.IdDevolucion).HasName("devolucion_pkey");

            entity.ToTable("devolucion");

            entity.HasIndex(e => e.Fecha, "idx_devolucion_fecha");

            entity.Property(e => e.IdDevolucion)
                .ValueGeneratedNever()
                .HasColumnName("id_devolucion");
            entity.Property(e => e.DespachoId).HasColumnName("despacho_id");
            entity.Property(e => e.Estado)
                .HasMaxLength(30)
                .HasColumnName("estado");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.Motivo)
                .HasMaxLength(100)
                .HasColumnName("motivo");
            entity.Property(e => e.StockRestaurado)
                .HasDefaultValue(false)
                .HasColumnName("stock_restaurado");

            entity.HasOne(d => d.Despacho).WithMany(p => p.Devolucions)
                .HasForeignKey(d => d.DespachoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("devolucion_despacho_id_fkey");
        });

        modelBuilder.Entity<Direccion>(entity =>
        {
            entity.HasKey(e => e.CodigoPostal).HasName("direccion_pkey");

            entity.ToTable("direccion");

            entity.HasIndex(e => e.EmpresaId, "idx_direccion_empresa");

            entity.HasIndex(e => e.UsuarioId, "idx_direccion_usuario");

            entity.Property(e => e.CodigoPostal)
                .HasMaxLength(12)
                .HasColumnName("codigo_postal");
            entity.Property(e => e.Calle)
                .HasMaxLength(100)
                .HasColumnName("calle");
            entity.Property(e => e.ComunaId).HasColumnName("comuna_id");
            entity.Property(e => e.EmpresaId)
                .HasMaxLength(15)
                .HasColumnName("empresa_id");
            entity.Property(e => e.Numero)
                .HasMaxLength(12)
                .HasColumnName("numero");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Comuna).WithMany(p => p.Direccions)
                .HasForeignKey(d => d.ComunaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("direccion_comuna_id_fkey");

            entity.HasOne(d => d.Empresa).WithMany(p => p.Direccions)
                .HasForeignKey(d => d.EmpresaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("direccion_empresa_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Direccions)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("direccion_usuario_id_fkey");
        });

        modelBuilder.Entity<Distribuye>(entity =>
        {
            entity.HasKey(e => new { e.EmpresaId, e.ServicioId }).HasName("distribuye_pkey");

            entity.ToTable("distribuye");

            entity.HasIndex(e => e.ServicioId, "idx_distribuye_servicio");

            entity.Property(e => e.EmpresaId)
                .HasMaxLength(15)
                .HasColumnName("empresa_id");
            entity.Property(e => e.ServicioId)
                .HasMaxLength(50)
                .HasColumnName("servicio_id");
            entity.Property(e => e.Precio).HasColumnName("precio");

            entity.HasOne(d => d.Empresa).WithMany(p => p.Distribuyes)
                .HasForeignKey(d => d.EmpresaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("distribuye_empresa_id_fkey");

            entity.HasOne(d => d.Servicio).WithMany(p => p.Distribuyes)
                .HasForeignKey(d => d.ServicioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("distribuye_servicio_id_fkey");
        });

        modelBuilder.Entity<Ejerce>(entity =>
        {
            entity.HasKey(e => new { e.UsuarioId, e.DevolucionId }).HasName("ejerce_pkey");

            entity.ToTable("ejerce");

            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");
            entity.Property(e => e.DevolucionId).HasColumnName("devolucion_id");
            entity.Property(e => e.Estado)
                .HasMaxLength(30)
                .HasDefaultValueSql("'Pendiente'::character varying")
                .HasColumnName("estado");
            entity.Property(e => e.MedioPagoId).HasColumnName("medio_pago_id");

            entity.HasOne(d => d.Devolucion).WithMany(p => p.Ejerces)
                .HasForeignKey(d => d.DevolucionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ejerce_devolucion_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Ejerces)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ejerce_usuario_id_fkey");
        });

        modelBuilder.Entity<Empresa>(entity =>
        {
            entity.HasKey(e => e.RunEmpresa).HasName("empresa_pkey");

            entity.ToTable("empresa");

            entity.HasIndex(e => e.UsuarioId, "idx_empresa_usuario");

            entity.Property(e => e.RunEmpresa)
                .HasMaxLength(15)
                .HasColumnName("run_empresa");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .HasColumnName("nombre");
            entity.Property(e => e.PaginaWeb)
                .HasMaxLength(255)
                .HasColumnName("pagina_web");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Empresas)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("empresa_usuario_id_fkey");

            entity.HasMany(d => d.Productos).WithMany(p => p.Empresas)
                .UsingEntity<Dictionary<string, object>>(
                    "Comercializa",
                    r => r.HasOne<Producto>().WithMany()
                        .HasForeignKey("ProductoId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("comercializa_producto_id_fkey"),
                    l => l.HasOne<Empresa>().WithMany()
                        .HasForeignKey("EmpresaId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("comercializa_empresa_id_fkey"),
                    j =>
                    {
                        j.HasKey("EmpresaId", "ProductoId").HasName("comercializa_pkey");
                        j.ToTable("comercializa");
                        j.HasIndex(new[] { "ProductoId" }, "idx_comercializa_producto");
                        j.IndexerProperty<string>("EmpresaId")
                            .HasMaxLength(15)
                            .HasColumnName("empresa_id");
                        j.IndexerProperty<string>("ProductoId")
                            .HasMaxLength(50)
                            .HasColumnName("producto_id");
                    });
        });

        modelBuilder.Entity<Establece>(entity =>
        {
            entity.HasKey(e => new { e.VentaId, e.ServicioId }).HasName("establece_pkey");

            entity.ToTable("establece");

            entity.HasIndex(e => e.ServicioId, "idx_establece_servicio");

            entity.Property(e => e.VentaId).HasColumnName("venta_id");
            entity.Property(e => e.ServicioId)
                .HasMaxLength(50)
                .HasColumnName("servicio_id");
            entity.Property(e => e.DescuentoOferta)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("descuento_oferta");
            entity.Property(e => e.EmpresaId)
                .HasMaxLength(15)
                .HasColumnName("empresa_id");
            entity.Property(e => e.PrecioFinal)
                .HasPrecision(12, 2)
                .HasColumnName("precio_final");
            entity.Property(e => e.PrecioOriginal)
                .HasPrecision(12, 2)
                .HasColumnName("precio_original");

            entity.HasOne(d => d.Empresa).WithMany(p => p.Estableces)
                .HasForeignKey(d => d.EmpresaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("establece_empresa_id_fkey");

            entity.HasOne(d => d.Servicio).WithMany(p => p.Estableces)
                .HasForeignKey(d => d.ServicioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("establece_servicio_id_fkey");

            entity.HasOne(d => d.Venta).WithMany(p => p.Estableces)
                .HasForeignKey(d => d.VentaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("establece_venta_id_fkey");
        });

        modelBuilder.Entity<Evalua>(entity =>
        {
            entity.HasKey(e => e.ReseniaId).HasName("evalua_pkey");

            entity.ToTable("evalua");

            entity.Property(e => e.ReseniaId)
                .ValueGeneratedNever()
                .HasColumnName("resenia_id");
            entity.Property(e => e.UsuarioClienteId)
                .HasMaxLength(15)
                .HasColumnName("usuario_cliente_id");
            entity.Property(e => e.UsuarioEmprendedorId)
                .HasMaxLength(15)
                .HasColumnName("usuario_emprendedor_id");

            entity.HasOne(d => d.Resenia).WithOne(p => p.Evalua)
                .HasForeignKey<Evalua>(d => d.ReseniaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("evalua_resenia_id_fkey");

            entity.HasOne(d => d.UsuarioCliente).WithMany(p => p.EvaluaUsuarioClientes)
                .HasForeignKey(d => d.UsuarioClienteId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("evalua_usuario_cliente_id_fkey");

            entity.HasOne(d => d.UsuarioEmprendedor).WithMany(p => p.EvaluaUsuarioEmprendedors)
                .HasForeignKey(d => d.UsuarioEmprendedorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("evalua_usuario_emprendedor_id_fkey");
        });

        modelBuilder.Entity<Genera>(entity =>
        {
            entity.HasKey(e => new { e.HistorialCompraId, e.VentaId }).HasName("genera_pkey");

            entity.ToTable("genera");

            entity.Property(e => e.HistorialCompraId).HasColumnName("historial_compra_id");
            entity.Property(e => e.VentaId).HasColumnName("venta_id");
            entity.Property(e => e.Estado)
                .HasMaxLength(30)
                .HasColumnName("estado");

            entity.HasOne(d => d.Historial_Compra).WithMany(p => p.Generas)
                .HasForeignKey(d => d.HistorialCompraId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("genera_historial_compra_id_fkey");

            entity.HasOne(d => d.Venta).WithMany(p => p.Generas)
                .HasForeignKey(d => d.VentaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("genera_venta_id_fkey");
        });

        modelBuilder.Entity<Historial_Compra>(entity =>
        {
            entity.HasKey(e => e.IdHistorial).HasName("historial_compra_pkey");

            entity.ToTable("historial_compra");

            entity.Property(e => e.IdHistorial)
                .ValueGeneratedNever()
                .HasColumnName("id_historial");
            entity.Property(e => e.FechaFin).HasColumnName("fecha_fin");
            entity.Property(e => e.FechaInicio).HasColumnName("fecha_inicio");
        });

        modelBuilder.Entity<Incluye>(entity =>
        {
            entity.HasKey(e => new { e.ProductoId, e.VentaId }).HasName("incluye_pkey");

            entity.ToTable("incluye");

            entity.HasIndex(e => e.ProductoId, "idx_incluye_producto");

            entity.Property(e => e.ProductoId)
                .HasMaxLength(50)
                .HasColumnName("producto_id");
            entity.Property(e => e.VentaId).HasColumnName("venta_id");
            entity.Property(e => e.Cantidad)
                .HasDefaultValue(1)
                .HasColumnName("cantidad");
            entity.Property(e => e.DescuentoOferta)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("descuento_oferta");
            entity.Property(e => e.PrecioFinal)
                .HasPrecision(12, 2)
                .HasColumnName("precio_final");
            entity.Property(e => e.PrecioOriginal)
                .HasPrecision(12, 2)
                .HasColumnName("precio_original");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Producto).WithMany(p => p.Incluyes)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("incluye_producto_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Incluyes)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("incluye_usuario_id_fkey");

            entity.HasOne(d => d.Venta).WithMany(p => p.Incluyes)
                .HasForeignKey(d => d.VentaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("incluye_venta_id_fkey");
        });

        modelBuilder.Entity<Lista_Deseos>(entity =>
        {
            entity.HasKey(e => e.IdListaDeseos).HasName("lista_deseos_pkey");

            entity.ToTable("lista_deseos");

            entity.HasIndex(e => e.Nombre, "uq_lista_deseos_nombre").IsUnique();

            entity.Property(e => e.IdListaDeseos)
                .ValueGeneratedNever()
                .HasColumnName("id_lista_deseos");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .HasColumnName("nombre");

            entity.HasMany(d => d.Servicios).WithMany(p => p.ListaDeseos)
                .UsingEntity<Dictionary<string, object>>(
                    "Integra",
                    r => r.HasOne<Servicio>().WithMany()
                        .HasForeignKey("ServicioId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("integra_servicio_id_fkey"),
                    l => l.HasOne<Lista_Deseos>().WithMany()
                        .HasPrincipalKey("Nombre")
                        .HasForeignKey("ListaDeseosId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("integra_lista_deseos_id_fkey"),
                    j =>
                    {
                        j.HasKey("ListaDeseosId", "ServicioId").HasName("integra_pkey");
                        j.ToTable("integra");
                        j.HasIndex(new[] { "ServicioId" }, "idx_integra_servicio");
                        j.IndexerProperty<string>("ListaDeseosId")
                            .HasMaxLength(100)
                            .HasColumnName("lista_deseos_id");
                        j.IndexerProperty<string>("ServicioId")
                            .HasMaxLength(50)
                            .HasColumnName("servicio_id");
                    });
        });

        modelBuilder.Entity<Mensajeria>(entity =>
        {
            entity.HasKey(e => e.IdMensajeria).HasName("mensajeria_pkey");

            entity.ToTable("mensajeria");

            entity.HasIndex(e => e.EmpresaId, "idx_mensajeria_empresa");

            entity.HasIndex(e => e.Fecha, "idx_mensajeria_fecha");

            entity.HasIndex(e => e.UsuarioId, "idx_mensajeria_usuario");

            entity.Property(e => e.IdMensajeria)
                .HasMaxLength(50)
                .HasColumnName("id_mensajeria");
            entity.Property(e => e.Comentario)
                .HasMaxLength(500)
                .HasColumnName("comentario");
            entity.Property(e => e.EmpresaId)
                .HasMaxLength(15)
                .HasColumnName("empresa_id");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Empresa).WithMany(p => p.Mensajeria)
                .HasForeignKey(d => d.EmpresaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("mensajeria_empresa_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.MensajeriaNavigation)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("mensajeria_usuario_id_fkey");
        });

        modelBuilder.Entity<Oferta>(entity =>
        {
            entity.HasKey(e => e.IdOferta).HasName("oferta_pkey");

            entity.ToTable("oferta");

            entity.Property(e => e.IdOferta)
                .ValueGeneratedNever()
                .HasColumnName("id_oferta");
            entity.Property(e => e.Porcentaje).HasColumnName("porcentaje");
        });

        modelBuilder.Entity<Pago>(entity =>
        {
            entity.HasKey(e => e.CodigoTransferencia).HasName("pago_pkey");

            entity.ToTable("pago");

            entity.Property(e => e.CodigoTransferencia)
                .ValueGeneratedNever()
                .HasColumnName("codigo_transferencia");
            entity.Property(e => e.MedioPagoId).HasColumnName("medio_pago_id");
            entity.Property(e => e.Ultimos4DigitosTarjeta)
                .HasMaxLength(4)
                .HasColumnName("ultimos_4_digitos_tarjeta");

            entity.HasOne(d => d.CodigoTransferenciaNavigation).WithOne(p => p.Pago)
                .HasForeignKey<Pago>(d => d.CodigoTransferencia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("pago_codigo_transferencia_fkey");
        });

        modelBuilder.Entity<Preguntar>(entity =>
        {
            entity.HasKey(e => new { e.UsuarioId, e.MensajeriaId }).HasName("preguntar_pkey");

            entity.ToTable("preguntar");

            entity.HasIndex(e => e.ProductoId, "idx_preguntar_producto");

            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");
            entity.Property(e => e.MensajeriaId)
                .HasMaxLength(50)
                .HasColumnName("mensajeria_id");
            entity.Property(e => e.ProductoId)
                .HasMaxLength(50)
                .HasColumnName("producto_id");

            entity.HasOne(d => d.Mensajeria).WithMany(p => p.Preguntars)
                .HasForeignKey(d => d.MensajeriaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("preguntar_mensajeria_id_fkey");

            entity.HasOne(d => d.Producto).WithMany(p => p.Preguntars)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("preguntar_producto_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Preguntars)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("preguntar_usuario_id_fkey");
        });

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasKey(e => e.Sku).HasName("producto_pkey");

            entity.ToTable("producto");

            entity.Property(e => e.Sku)
                .HasMaxLength(50)
                .HasColumnName("sku");
            entity.Property(e => e.Caracteristica)
                .HasColumnType("jsonb")
                .HasColumnName("caracteristica");
            entity.Property(e => e.CotizacionId).HasColumnName("cotizacion_id");
            entity.Property(e => e.FechaUltimaActividad)
                .HasDefaultValueSql("CURRENT_DATE")
                .HasColumnName("fecha_ultima_actividad");
            entity.Property(e => e.Marca)
                .HasMaxLength(50)
                .HasColumnName("marca");
            entity.Property(e => e.MotivoOculto).HasColumnName("motivo_oculto");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .HasColumnName("nombre");
            entity.Property(e => e.RestriccionEdad).HasColumnName("restriccion_edad");
            entity.Property(e => e.StockId).HasColumnName("stock_id");
            entity.Property(e => e.Visible)
                .HasDefaultValue(true)
                .HasColumnName("visible");

            entity.HasOne(d => d.Cotizacion).WithMany(p => p.Productos)
                .HasForeignKey(d => d.CotizacionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("producto_cotizacion_id_fkey");

            entity.HasOne(d => d.Stock).WithMany(p => p.Productos)
                .HasForeignKey(d => d.StockId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("producto_stock_id_fkey");

            entity.HasMany(d => d.Categoria).WithMany(p => p.Productos)
                .UsingEntity<Dictionary<string, object>>(
                    "Pertenece",
                    r => r.HasOne<Categoria>().WithMany()
                        .HasPrincipalKey("Nombre")
                        .HasForeignKey("CategoriaId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("pertenece_categoria_id_fkey"),
                    l => l.HasOne<Producto>().WithMany()
                        .HasForeignKey("ProductoId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("pertenece_producto_id_fkey"),
                    j =>
                    {
                        j.HasKey("ProductoId", "CategoriaId").HasName("pertenece_pkey");
                        j.ToTable("pertenece");
                        j.IndexerProperty<string>("ProductoId")
                            .HasMaxLength(50)
                            .HasColumnName("producto_id");
                        j.IndexerProperty<string>("CategoriaId")
                            .HasMaxLength(100)
                            .HasColumnName("categoria_id");
                    });

            entity.HasMany(d => d.ListaDeseos).WithMany(p => p.Productos)
                .UsingEntity<Dictionary<string, object>>(
                    "Aniadir",
                    r => r.HasOne<Lista_Deseos>().WithMany()
                        .HasPrincipalKey("Nombre")
                        .HasForeignKey("ListaDeseosId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("aniadir_lista_deseos_id_fkey"),
                    l => l.HasOne<Producto>().WithMany()
                        .HasForeignKey("ProductoId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("aniadir_producto_id_fkey"),
                    j =>
                    {
                        j.HasKey("ProductoId", "ListaDeseosId").HasName("aniadir_pkey");
                        j.ToTable("aniadir");
                        j.IndexerProperty<string>("ProductoId")
                            .HasMaxLength(50)
                            .HasColumnName("producto_id");
                        j.IndexerProperty<string>("ListaDeseosId")
                            .HasMaxLength(100)
                            .HasColumnName("lista_deseos_id");
                    });
        });

        modelBuilder.Entity<Promociona>(entity =>
        {
            entity.HasKey(e => new { e.ProductoId, e.OfertaId }).HasName("promociona_pkey");

            entity.ToTable("promociona");

            entity.Property(e => e.ProductoId)
                .HasMaxLength(50)
                .HasColumnName("producto_id");
            entity.Property(e => e.OfertaId).HasColumnName("oferta_id");
            entity.Property(e => e.FechaFin).HasColumnName("fecha_fin");
            entity.Property(e => e.FechaInicio).HasColumnName("fecha_inicio");

            entity.HasOne(d => d.Oferta).WithMany(p => p.Promocionas)
                .HasForeignKey(d => d.OfertaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("promociona_oferta_id_fkey");

            entity.HasOne(d => d.Producto).WithMany(p => p.Promocionas)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("promociona_producto_id_fkey");
        });

        modelBuilder.Entity<Provee>(entity =>
        {
            entity.HasKey(e => new { e.UsuarioId, e.ServicioId }).HasName("provee_pkey");

            entity.ToTable("provee");

            entity.HasIndex(e => e.ServicioId, "idx_provee_servicio");

            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");
            entity.Property(e => e.ServicioId)
                .HasMaxLength(50)
                .HasColumnName("servicio_id");
            entity.Property(e => e.Precio).HasColumnName("precio");

            entity.HasOne(d => d.Servicio).WithMany(p => p.Provees)
                .HasForeignKey(d => d.ServicioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("provee_servicio_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Provees)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("provee_usuario_id_fkey");
        });

        modelBuilder.Entity<Provincia>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("provincia_pkey");

            entity.ToTable("provincia");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.IdRegion).HasColumnName("id_region");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .HasColumnName("nombre");
            entity.Property(e => e.Superficie).HasColumnName("superficie");

            entity.HasOne(d => d.IdRegionNavigation).WithMany(p => p.Provincia)
                .HasForeignKey(d => d.IdRegion)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("provincia_id_region_fkey");
        });

        modelBuilder.Entity<Region>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("region_pkey");

            entity.ToTable("region");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .HasColumnName("nombre");
            entity.Property(e => e.Superficie).HasColumnName("superficie");
        });

        modelBuilder.Entity<Reseniar>(entity =>
        {
            entity.HasKey(e => e.ReseniaId).HasName("reseniar_pkey");

            entity.ToTable("reseniar");

            entity.HasIndex(e => e.ProductoId, "idx_reseniar_producto");

            entity.Property(e => e.ReseniaId)
                .ValueGeneratedNever()
                .HasColumnName("resenia_id");
            entity.Property(e => e.ProductoId)
                .HasMaxLength(50)
                .HasColumnName("producto_id");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Producto).WithMany(p => p.Reseniars)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("reseniar_producto_id_fkey");

            entity.HasOne(d => d.Resenia).WithOne(p => p.Reseniar)
                .HasForeignKey<Reseniar>(d => d.ReseniaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("reseniar_resenia_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Reseniars)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("reseniar_usuario_id_fkey");
        });

        modelBuilder.Entity<Resenia>(entity =>
        {
            entity.HasKey(e => e.IdResenia).HasName("resenia_pkey");

            entity.ToTable("resenia");

            entity.Property(e => e.IdResenia)
                .ValueGeneratedNever()
                .HasColumnName("id_resenia");
            entity.Property(e => e.Comentario)
                .HasMaxLength(500)
                .HasColumnName("comentario");
            entity.Property(e => e.Puntaje).HasColumnName("puntaje");
        });

        modelBuilder.Entity<Seguimiento_Despacho>(entity =>
        {
            entity.HasKey(e => e.NumeroSeguimiento).HasName("seguimiento_despacho_pkey");

            entity.ToTable("seguimiento_despacho");

            entity.Property(e => e.NumeroSeguimiento)
                .ValueGeneratedNever()
                .HasColumnName("numero_seguimiento");
            entity.Property(e => e.NombreEmpresaTransporte)
                .HasMaxLength(100)
                .HasColumnName("nombre_empresa_transporte");
        });

        modelBuilder.Entity<Servicio>(entity =>
        {
            entity.HasKey(e => e.Sku).HasName("servicio_pkey");

            entity.ToTable("servicio");

            entity.Property(e => e.Sku)
                .HasMaxLength(50)
                .HasColumnName("sku");
            entity.Property(e => e.Caracteristica)
                .HasColumnType("jsonb")
                .HasColumnName("caracteristica");
            entity.Property(e => e.CotizacionId).HasColumnName("cotizacion_id");
            entity.Property(e => e.FechaUltimaActividad)
                .HasDefaultValueSql("CURRENT_DATE")
                .HasColumnName("fecha_ultima_actividad");
            entity.Property(e => e.MotivoOculto).HasColumnName("motivo_oculto");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .HasColumnName("nombre");
            entity.Property(e => e.RestriccionEdad).HasColumnName("restriccion_edad");
            entity.Property(e => e.Tiempo).HasColumnName("tiempo");
            entity.Property(e => e.Visible)
                .HasDefaultValue(true)
                .HasColumnName("visible");

            entity.HasOne(d => d.Cotizacion).WithMany(p => p.Servicios)
                .HasForeignKey(d => d.CotizacionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("servicio_cotizacion_id_fkey");

            entity.HasMany(d => d.Categoria).WithMany(p => p.Servicios)
                .UsingEntity<Dictionary<string, object>>(
                    "Incorpora",
                    r => r.HasOne<Categoria>().WithMany()
                        .HasPrincipalKey("Nombre")
                        .HasForeignKey("CategoriaId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("incorpora_categoria_id_fkey"),
                    l => l.HasOne<Servicio>().WithMany()
                        .HasForeignKey("ServicioId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("incorpora_servicio_id_fkey"),
                    j =>
                    {
                        j.HasKey("ServicioId", "CategoriaId").HasName("incorpora_pkey");
                        j.ToTable("incorpora");
                        j.IndexerProperty<string>("ServicioId")
                            .HasMaxLength(50)
                            .HasColumnName("servicio_id");
                        j.IndexerProperty<string>("CategoriaId")
                            .HasMaxLength(100)
                            .HasColumnName("categoria_id");
                    });
        });

        modelBuilder.Entity<Stock>(entity =>
        {
            entity.HasKey(e => e.IdStock).HasName("stock_pkey");

            entity.ToTable("stock");

            entity.Property(e => e.IdStock)
                .ValueGeneratedNever()
                .HasColumnName("id_stock");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
        });

        modelBuilder.Entity<Telefono>(entity =>
        {
            entity.HasKey(e => e.IdTelefono).HasName("telefono_pkey");

            entity.ToTable("telefono");

            entity.HasIndex(e => e.UsuarioId, "idx_telefono_usuario");

            entity.HasIndex(e => e.Numero, "uq_telefono_numero").IsUnique();

            entity.Property(e => e.IdTelefono)
                .ValueGeneratedNever()
                .HasColumnName("id_telefono");
            entity.Property(e => e.Numero).HasColumnName("numero");
            entity.Property(e => e.Prefijo).HasColumnName("prefijo");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Telefonos)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("telefono_usuario_id_fkey");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.Run).HasName("usuario_pkey");

            entity.ToTable("usuario");

            entity.Property(e => e.Run)
                .HasMaxLength(15)
                .HasColumnName("run");
            entity.Property(e => e.ClaveAcceso)
                .HasMaxLength(20)
                .HasColumnName("clave_acceso");
            entity.Property(e => e.DescuentoProximaCompra)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("descuento_proxima_compra");
            entity.Property(e => e.DescuentoVigenteHasta).HasColumnName("descuento_vigente_hasta");
            entity.Property(e => e.FechaNacimiento).HasColumnName("fecha_nacimiento");
            entity.Property(e => e.FechaRegistro).HasColumnName("fecha_registro");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .HasColumnName("nombre");
            entity.Property(e => e.Tipo).HasColumnName("tipo");
            entity.Property(e => e.UltimaActividad).HasColumnName("ultima_actividad");

            entity.HasMany(d => d.ListaDeseos).WithMany(p => p.Usuarios)
                .UsingEntity<Dictionary<string, object>>(
                    "Crear",
                    r => r.HasOne<Lista_Deseos>().WithMany()
                        .HasPrincipalKey("Nombre")
                        .HasForeignKey("ListaDeseosId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("crear_lista_deseos_id_fkey"),
                    l => l.HasOne<Usuario>().WithMany()
                        .HasForeignKey("UsuarioId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("crear_usuario_id_fkey"),
                    j =>
                    {
                        j.HasKey("UsuarioId", "ListaDeseosId").HasName("crear_pkey");
                        j.ToTable("crear");
                        j.IndexerProperty<string>("UsuarioId")
                            .HasMaxLength(15)
                            .HasColumnName("usuario_id");
                        j.IndexerProperty<string>("ListaDeseosId")
                            .HasMaxLength(100)
                            .HasColumnName("lista_deseos_id");
                    });

            entity.HasMany(d => d.Mensajeria).WithMany(p => p.Usuarios)
                .UsingEntity<Dictionary<string, object>>(
                    "Hablar",
                    r => r.HasOne<Mensajeria>().WithMany()
                        .HasForeignKey("MensajeriaId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("hablar_mensajeria_id_fkey"),
                    l => l.HasOne<Usuario>().WithMany()
                        .HasForeignKey("UsuarioId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("hablar_usuario_id_fkey"),
                    j =>
                    {
                        j.HasKey("UsuarioId", "MensajeriaId").HasName("hablar_pkey");
                        j.ToTable("hablar");
                        j.IndexerProperty<string>("UsuarioId")
                            .HasMaxLength(15)
                            .HasColumnName("usuario_id");
                        j.IndexerProperty<string>("MensajeriaId")
                            .HasMaxLength(50)
                            .HasColumnName("mensajeria_id");
                    });
        });

        modelBuilder.Entity<Valorar>(entity =>
        {
            entity.HasKey(e => e.ReseniaId).HasName("valorar_pkey");

            entity.ToTable("valorar");

            entity.HasIndex(e => e.ServicioId, "idx_valorar_servicio");

            entity.Property(e => e.ReseniaId)
                .ValueGeneratedNever()
                .HasColumnName("resenia_id");
            entity.Property(e => e.ServicioId)
                .HasMaxLength(50)
                .HasColumnName("servicio_id");
            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");

            entity.HasOne(d => d.Resenia).WithOne(p => p.Valorar)
                .HasForeignKey<Valorar>(d => d.ReseniaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("valorar_resenia_id_fkey");

            entity.HasOne(d => d.Servicio).WithMany(p => p.Valorars)
                .HasForeignKey(d => d.ServicioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("valorar_servicio_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Valorars)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("valorar_usuario_id_fkey");
        });

        modelBuilder.Entity<Vende>(entity =>
        {
            entity.HasKey(e => new { e.UsuarioId, e.ProductoId }).HasName("vende_pkey");

            entity.ToTable("vende");

            entity.HasIndex(e => e.ProductoId, "idx_vende_producto");

            entity.Property(e => e.UsuarioId)
                .HasMaxLength(15)
                .HasColumnName("usuario_id");
            entity.Property(e => e.ProductoId)
                .HasMaxLength(50)
                .HasColumnName("producto_id");
            entity.Property(e => e.Precio).HasColumnName("precio");

            entity.HasOne(d => d.Producto).WithMany(p => p.Vendes)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("vende_producto_id_fkey");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Vendes)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("vende_usuario_id_fkey");
        });

        modelBuilder.Entity<Venta_Datos>(entity =>
        {
            entity.HasKey(e => e.IdVenta).HasName("venta_datos_pkey");

            entity.ToTable("venta_datos");

            entity.HasIndex(e => e.Fecha, "idx_venta_datos_fecha");

            entity.Property(e => e.IdVenta)
                .ValueGeneratedNever()
                .HasColumnName("id_venta");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.Descuento)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("descuento");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.PrecioSinIva).HasColumnName("precio_sin_iva");
            entity.Property(e => e.PrecioTotal).HasColumnName("precio_total");
            entity.Property(e => e.TotalCalculado)
                .HasPrecision(12, 2)
                .HasColumnName("total_calculado");
            entity.Property(e => e.TotalIva).HasColumnName("total_iva");

            entity.HasOne(d => d.IdVentaNavigation).WithOne(p => p.Venta_Datos)
                .HasForeignKey<Venta_Datos>(d => d.IdVenta)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("venta_datos_id_venta_fkey");
        });

        modelBuilder.Entity<Venta>(entity =>
        {
            entity.HasKey(e => e.IdVenta).HasName("venta_pkey");

            entity.ToTable("venta");

            entity.Property(e => e.IdVenta)
                .ValueGeneratedNever()
                .HasColumnName("id_venta");
            entity.Property(e => e.CodigoTransferencia).HasColumnName("codigo_transferencia");
            entity.Property(e => e.Estado)
                .HasMaxLength(30)
                .HasDefaultValueSql("'Pendiente'::character varying")
                .HasColumnName("estado");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("fecha");
            entity.Property(e => e.Pagada)
                .HasDefaultValue(false)
                .HasColumnName("pagada");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
