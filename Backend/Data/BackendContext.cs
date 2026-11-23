using Microsoft.EntityFrameworkCore;
using TiendaMultiplaza.API.Models;

namespace TiendaMultiplaza.API.Data;
public partial class TiendaMultiplazaContext
{
    public DbSet<Usuario_Acceso> Usuario_Acceso => Set<Usuario_Acceso>();
    public DbSet<Carrito> Carrito => Set<Carrito>();
    public DbSet<Carrito_Detalle> Carrito_Detalle => Set<Carrito_Detalle>();
    public DbSet<Pedido> Pedido => Set<Pedido>();
    public DbSet<Pedido_Detalle> Pedido_Detalle => Set<Pedido_Detalle>();

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>().Property(x => x.ClaveAcceso).HasMaxLength(512);
        modelBuilder.Entity<Usuario_Acceso>(e =>
        {
            e.ToTable("usuario_acceso");
            e.HasKey(x => x.UsuarioRun);
            e.Property(x => x.UsuarioRun).HasColumnName("usuario_run");
            e.Property(x => x.Rol).HasColumnName("rol");
            e.Property(x => x.Activo).HasColumnName("activo");
            e.Property(x => x.VersionToken).HasColumnName("version_token");
            e.Property(x => x.IntentosFallidos).HasColumnName("intentos_fallidos");
            e.Property(x => x.BloqueadoHasta).HasColumnName("bloqueado_hasta");
            e.Property(x => x.ClaveEsHash).HasColumnName("clave_es_hash");
            e.HasOne(x => x.Usuario).WithOne().HasForeignKey<Usuario_Acceso>(x => x.UsuarioRun).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<Carrito>(e =>
        {
            e.ToTable("carrito");
            e.HasKey(x => x.UsuarioRun);
            e.Property(x => x.UsuarioRun).HasColumnName("usuario_run");
            e.Property(x => x.ActualizadoEn).HasColumnName("actualizado_en");
        });
        modelBuilder.Entity<Carrito_Detalle>(e =>
        {
            e.ToTable("carrito_detalle");
            e.HasKey(x => new { x.UsuarioRun, x.ProductoId });
            e.Property(x => x.UsuarioRun).HasColumnName("usuario_run");
            e.Property(x => x.ProductoId).HasColumnName("producto_id");
            e.Property(x => x.VendedorRun).HasColumnName("vendedor_run");
            e.Property(x => x.Cantidad).HasColumnName("cantidad");
            e.HasOne(x => x.Carrito).WithMany(x => x.Detalles).HasForeignKey(x => x.UsuarioRun).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Pedido>(e =>
        {
            e.ToTable("pedido");
            e.HasKey(x => x.VentaId);
            e.Property(x => x.VentaId).HasColumnName("venta_id").ValueGeneratedNever();
            e.Property(x => x.UsuarioRun).HasColumnName("usuario_run");
            e.Property(x => x.ClaveIdempotencia).HasColumnName("clave_idempotencia");
            e.HasIndex(x => new { x.UsuarioRun, x.ClaveIdempotencia }).IsUnique();
            e.Property(x => x.Estado).HasColumnName("estado");
            e.Property(x => x.DireccionEntrega).HasColumnName("direccion_entrega");
            e.Property(x => x.CreadoEn).HasColumnName("creado_en");
            e.Property(x => x.ActualizadoEn).HasColumnName("actualizado_en");
        });
        modelBuilder.Entity<Pedido_Detalle>(e =>
        {
            e.ToTable("pedido_detalle");
            e.HasKey(x => new { x.VentaId, x.ProductoId });
            e.Property(x => x.VentaId).HasColumnName("venta_id");
            e.Property(x => x.ProductoId).HasColumnName("producto_id");
            e.Property(x => x.VendedorRun).HasColumnName("vendedor_run");
            e.Property(x => x.Nombre).HasColumnName("nombre");
            e.Property(x => x.Cantidad).HasColumnName("cantidad");
            e.Property(x => x.PrecioUnitario).HasColumnName("precio_unitario");
            e.HasOne(x => x.Pedido).WithMany(x => x.Detalles).HasForeignKey(x => x.VentaId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
