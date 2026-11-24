using Backend_GrupoA.DTOs;
using Backend_GrupoA.Repositories;
using static Backend_GrupoA.Repositories.StoreRepository;
namespace Backend_GrupoA.Services;
public class ProductService(StoreRepository repo) {
 public async Task Create(string actor,NewProductDto d,CancellationToken ct) {
  if(string.IsNullOrWhiteSpace(d.Name)||string.IsNullOrWhiteSpace(d.Brand)) throw new StoreException("Nombre y marca son obligatorios.");
  await using var c=await repo.Open(ct); await using var tx=await c.BeginTransactionAsync(ct);
  if(!await Scalar<bool>(c,"SELECT EXISTS(SELECT 1 FROM empresa e JOIN usuario u ON u.run=e.usuario_id WHERE e.run_empresa=@company AND e.usuario_id=@actor AND u.fecha_nacimiento<=@adult)",ct,("company",d.CompanyId),("actor",actor),("adult",AccountService.Today.AddYears(-18)))) throw new StoreException("No puedes publicar en esta empresa.",403);
  var category=await Scalar<string>(c,"SELECT nombre FROM categoria WHERE id_categoria=@id AND tipo<>'Servicio'",ct,("id",d.CategoryId));
  if(category==null) throw new StoreException("Selecciona una categoría de productos válida.");
  var stock=await Scalar<int>(c,"SELECT app.siguiente('stock')",ct); var quote=await Scalar<int>(c,"SELECT app.siguiente('cotizacion')",ct);
  await Exec(c,"INSERT INTO stock VALUES(@id,@q)",ct,("id",stock),("q",d.Stock));
  await Exec(c,"INSERT INTO cotizacion VALUES(@id,@date,@company)",ct,("id",quote),("date",AccountService.Today),("company",d.CompanyId));
  await Exec(c,"INSERT INTO producto(sku,nombre,restriccion_edad,marca,cotizacion_id,caracteristica,stock_id) VALUES(@sku,@name,@adult,@brand,@quote,'{}',@stock)",ct,("sku",d.Sku),("name",d.Name.Trim()),("adult",d.AdultOnly),("brand",d.Brand.Trim()),("quote",quote),("stock",stock));
  await Exec(c,"INSERT INTO comercializa VALUES(@company,@sku); INSERT INTO vende VALUES(@actor,@sku,@price); INSERT INTO pertenece VALUES(@sku,@category)",ct,("company",d.CompanyId),("sku",d.Sku),("actor",actor),("price",d.Price),("category",category));
  await tx.CommitAsync(ct);
 }
 public async Task Delete(string actor,string sku,CancellationToken ct) {
  await using var c=await repo.Open(ct); await using var tx=await c.BeginTransactionAsync(ct);
  await Exec(c,"SELECT sku FROM producto WHERE sku=@sku FOR UPDATE",ct,("sku",sku));
  if(!await Scalar<bool>(c,"SELECT count(*)=1 AND bool_and(e.usuario_id=@actor) FROM comercializa co JOIN empresa e ON e.run_empresa=co.empresa_id WHERE co.producto_id=@sku",ct,("actor",actor),("sku",sku))) throw new StoreException("No puedes eliminar esta publicación.",403);
  await Exec(c,"INSERT INTO app.producto(sku,activo) VALUES(@sku,false) ON CONFLICT(sku) DO UPDATE SET activo=false",ct,("sku",sku));
  await tx.CommitAsync(ct);
 }
}
