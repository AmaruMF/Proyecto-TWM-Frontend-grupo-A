using Microsoft.EntityFrameworkCore;
namespace Backend_GrupoA.Data;
public class ProductState { public string Sku {get;set;}=null!; public bool Active {get;set;} }
public class OrderLink { public Guid Id {get;set;} public int SaleId {get;set;} }
public partial class MultiplazaDbContext {
 public DbSet<OrderLink> OrderLinks => Set<OrderLink>();
 public DbSet<ProductState> ProductStates => Set<ProductState>();
 partial void OnModelCreatingPartial(ModelBuilder modelBuilder) {
  modelBuilder.Entity<OrderLink>(e=>{e.ToTable("pedido","app");e.HasKey(p=>p.Id);e.Property(p=>p.Id).HasColumnName("id");e.Property(p=>p.SaleId).HasColumnName("venta_id");});
  modelBuilder.Entity<ProductState>(e=>{e.ToTable("producto","app");e.HasKey(p=>p.Sku);e.Property(p=>p.Sku).HasColumnName("sku");e.Property(p=>p.Active).HasColumnName("activo");});
 }
}

