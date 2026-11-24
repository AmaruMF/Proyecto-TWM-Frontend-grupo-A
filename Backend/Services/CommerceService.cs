using System.Text.Json;
using Backend_GrupoA.DTOs;
using Backend_GrupoA.Repositories;
using Npgsql;
using static Backend_GrupoA.Repositories.StoreRepository;
namespace Backend_GrupoA.Services;

public class CommerceService(StoreRepository repo)
{
 public const string ItemSql = """
 SELECT p.sku,p.nombre name,p.restriccion_edad adult,p.stock_id stockId,st.cantidad stock,
  (SELECT min(e.run_empresa) FROM comercializa c JOIN empresa e ON e.run_empresa=c.empresa_id WHERE c.producto_id=p.sku) companyId,
  (SELECT count(*) FROM comercializa WHERE producto_id=p.sku) companyCount,
  (SELECT min(v.precio) FROM comercializa co JOIN empresa e ON e.run_empresa=co.empresa_id JOIN vende v ON v.producto_id=co.producto_id AND v.usuario_id=e.usuario_id WHERE co.producto_id=p.sku) basePrice,
  coalesce((SELECT max(o.porcentaje) FROM promociona pr JOIN oferta o ON o.id_oferta=pr.oferta_id WHERE pr.producto_id=p.sku AND @today BETWEEN pr.fecha_inicio AND pr.fecha_fin),0) discount,
  coalesce((SELECT activo FROM app.producto WHERE sku=p.sku),true) active
 FROM producto p JOIN stock st ON st.id_stock=p.stock_id WHERE p.sku=@sku
 """;
 public static async Task<JsonElement> Item(NpgsqlConnection c,string sku,CancellationToken ct) {
  var rows=await Json(c,"SELECT coalesce(json_agg(x),'[]')::text FROM ("+ItemSql+")x",ct,("sku",sku),("today",AccountService.Today));
  if(rows.GetArrayLength()!=1) throw new StoreException("Producto no encontrado.",404);
  return rows[0].Clone();
 }
 static int Price(JsonElement p) {
  if(!p.GetProperty("active").GetBoolean() || p.GetProperty("companycount").GetInt64()!=1 || p.GetProperty("baseprice").ValueKind==JsonValueKind.Null) throw new StoreException("El producto no está disponible o su precio está pendiente de confirmar.",409);
  return (int)Math.Round(p.GetProperty("baseprice").GetInt32()*(100-Math.Clamp(p.GetProperty("discount").GetInt32(),0,100))/100m,MidpointRounding.AwayFromZero);
 }
 static async Task LockAccount(NpgsqlConnection c,string actor,CancellationToken ct) {
  await Exec(c,"SELECT run FROM usuario WHERE run=@id FOR UPDATE",ct,("id",actor));
 }
 public async Task<object> Cart(string actor,CancellationToken ct) {
  await using var c=await repo.Open(ct);
  var rows=await Json(c,"SELECT coalesce(json_agg(x),'[]')::text FROM (SELECT sku,cantidad quantity FROM app.carrito WHERE usuario_id=@id ORDER BY sku)x",ct,("id",actor));
  var result=new List<object>();
  foreach(var line in rows.EnumerateArray()) {
   var sku=line.GetProperty("sku").GetString()!; var p=await Item(c,sku,ct); int? price=null;
   try { price=Price(p); } catch(StoreException) { }
   result.Add(new { sku,name=p.GetProperty("name").GetString(),companyId=p.GetProperty("companyid").GetString(),price,quantity=line.GetProperty("quantity").GetInt32(),stock=p.GetProperty("stock").GetInt32(),available=price.HasValue && p.GetProperty("stock").GetInt32()>=line.GetProperty("quantity").GetInt32() });
  }
  return result;
 }
 public async Task SetCart(string actor,string sku,int quantity,bool add,CancellationToken ct) {
  if(quantity<1||quantity>999) throw new StoreException("Cantidad inválida.");
  await using var c=await repo.Open(ct); await using var tx=await c.BeginTransactionAsync(ct); await LockAccount(c,actor,ct);
  var p=await Item(c,sku,ct); _=Price(p);
  if(add) quantity+=await Scalar<int>(c,"SELECT cantidad FROM app.carrito WHERE usuario_id=@id AND sku=@sku",ct,("id",actor),("sku",sku));
  if(quantity>999||quantity>p.GetProperty("stock").GetInt32()) throw new StoreException("La cantidad supera el stock disponible.",409);
  await Exec(c,"INSERT INTO app.carrito(usuario_id,sku,cantidad) VALUES(@id,@sku,@q) ON CONFLICT(usuario_id,sku) DO UPDATE SET cantidad=excluded.cantidad",ct,("id",actor),("sku",sku),("q",quantity));
  await tx.CommitAsync(ct);
 }
 public async Task Remove(string actor,string sku,CancellationToken ct) {
  await using var c=await repo.Open(ct); await using var tx=await c.BeginTransactionAsync(ct); await LockAccount(c,actor,ct);
  await Exec(c,"DELETE FROM app.carrito WHERE usuario_id=@id AND sku=@sku",ct,("id",actor),("sku",sku)); await tx.CommitAsync(ct);
 }
 public async Task<object> Checkout(string actor,OrderDto dto,CancellationToken ct) {
  if(dto.RequestId==Guid.Empty) throw new StoreException("Falta el identificador de confirmación.");
  await using var c=await repo.Open(ct); await using var tx=await c.BeginTransactionAsync(ct); await LockAccount(c,actor,ct);
  var existing=await Scalar<Guid?>(c,"SELECT id FROM app.pedido WHERE usuario_id=@id AND solicitud_id=@key",ct,("id",actor),("key",dto.RequestId));
  if(existing.HasValue) return new { id=existing.Value, repeated=true };
  var rows=await Json(c,"SELECT coalesce(json_agg(x),'[]')::text FROM (SELECT ca.sku,ca.cantidad quantity FROM app.carrito ca WHERE ca.usuario_id=@id AND EXISTS(SELECT 1 FROM comercializa co WHERE co.producto_id=ca.sku AND co.empresa_id=@company) ORDER BY ca.sku)x",ct,("id",actor),("company",dto.CompanyId));
  if(rows.GetArrayLength()==0) throw new StoreException("El carrito de esta empresa está vacío.",409);
  var adult=await Scalar<bool>(c,"SELECT fecha_nacimiento<=@birth FROM usuario WHERE run=@id",ct,("birth",AccountService.Today.AddYears(-18)),("id",actor));
  var items=new List<(string Sku,string Name,int Quantity,int Price)>(); long net=0;
  foreach(var line in rows.EnumerateArray()) {
   var sku=line.GetProperty("sku").GetString()!; var qty=line.GetProperty("quantity").GetInt32();
   // Bloquea producto, stock y precio antes de recalcular. Orden SKU evita interbloqueos entre compras.
   await Exec(c,"SELECT sku FROM producto WHERE sku=@sku FOR UPDATE",ct,("sku",sku));
   await Exec(c,"SELECT st.id_stock FROM stock st JOIN producto p ON p.stock_id=st.id_stock WHERE p.sku=@sku FOR UPDATE OF st",ct,("sku",sku));
   await Exec(c,"SELECT producto_id FROM vende WHERE producto_id=@sku FOR SHARE",ct,("sku",sku));
   var p=await Item(c,sku,ct); var price=Price(p);
   if(p.GetProperty("companyid").GetString()!=dto.CompanyId) throw new StoreException("Cambió el vendedor del producto. Revisa el carrito.",409);
   if(p.GetProperty("adult").GetBoolean()&&!adult) throw new StoreException("Debes tener 18 años para adquirir este producto.",403);
   if(p.GetProperty("stock").GetInt32()<qty) throw new StoreException("Stock insuficiente. Revisa las cantidades.",409);
   net+= (long)qty*price; items.Add((sku,p.GetProperty("name").GetString()!,qty,price));
  }
  var iva=net*19/100; var total=net+iva;
  if(total>int.MaxValue || net>int.MaxValue/19) throw new StoreException("El importe supera el límite admitido por la base de datos.");
  var orderId=Guid.NewGuid(); var sale=await Scalar<int>(c,"SELECT app.siguiente('venta')",ct);
  await Exec(c,"INSERT INTO venta(id_venta,codigo_transferencia) VALUES(@id,@id)",ct,("id",sale));
  await Exec(c,"INSERT INTO venta_datos(id_venta,cantidad,total_iva,precio_sin_iva,precio_total,fecha) VALUES(@id,@q,@iva,@net,@total,@date)",ct,("id",sale),("q",items.Sum(i=>i.Quantity)),("iva",(int)iva),("net",(int)net),("total",(int)total),("date",AccountService.Today));
  await Exec(c,"INSERT INTO compra(usuario,venta_id) VALUES(@actor,@id)",ct,("actor",actor),("id",sale));
  await Exec(c,"INSERT INTO app.pedido(id,usuario_id,empresa_id,venta_id,solicitud_id,neto,iva,total) VALUES(@id,@actor,@company,@sale,@key,@net,@iva,@total)",ct,("id",orderId),("actor",actor),("company",dto.CompanyId),("sale",sale),("key",dto.RequestId),("net",net),("iva",iva),("total",total));
  foreach(var item in items) {
   await Exec(c,"INSERT INTO app.pedido_detalle(pedido_id,sku,nombre,cantidad,precio_unitario) VALUES(@id,@sku,@name,@q,@price)",ct,("id",orderId),("sku",item.Sku),("name",item.Name),("q",item.Quantity),("price",item.Price));
   await Exec(c,"INSERT INTO incluye(producto_id,venta_id,usuario_id) SELECT @sku,@sale,usuario_id FROM empresa WHERE run_empresa=@company; INSERT INTO detalle(producto_id,venta_id,empresa_id) VALUES(@sku,@sale,@company)",ct,("sku",item.Sku),("sale",sale),("company",dto.CompanyId));
   var affected=await Exec(c,"UPDATE stock SET cantidad=cantidad-@q WHERE id_stock=(SELECT stock_id FROM producto WHERE sku=@sku) AND cantidad>=@q",ct,("sku",item.Sku),("q",item.Quantity));
   if(affected!=1) throw new StoreException("Stock insuficiente.",409);
   await Exec(c,"DELETE FROM app.carrito WHERE usuario_id=@actor AND sku=@sku",ct,("actor",actor),("sku",item.Sku));
  }
  await tx.CommitAsync(ct); return new { id=orderId,saleId=sale,total,net,iva,repeated=false };
 }
 public async Task<JsonElement> Orders(string actor,bool sales,CancellationToken ct) {
  await using var c=await repo.Open(ct);
  return await Json(c,"""
   SELECT coalesce(json_agg(x ORDER BY x.date DESC),'[]')::text FROM (
    SELECT p.id,p.venta_id "saleId",p.fecha date,p.estado state,p.neto net,p.iva,p.total,e.nombre seller,
      p.usuario_id "customerId",(SELECT json_agg(d) FROM (SELECT sku,nombre name,cantidad quantity,precio_unitario price FROM app.pedido_detalle WHERE pedido_id=p.id ORDER BY sku)d) items
    FROM app.pedido p JOIN empresa e ON e.run_empresa=p.empresa_id
    WHERE (NOT @sales AND p.usuario_id=@actor) OR (@sales AND e.usuario_id=@actor)
   )x
   """,ct,("sales",sales),("actor",actor));
 }
 public async Task State(string actor,Guid id,string state,CancellationToken ct) {
  if(state is not ("En preparación" or "Entregado")) throw new StoreException("Estado inválido.");
  await using var c=await repo.Open(ct);
  var affected=await Exec(c,"UPDATE app.pedido p SET estado=@state FROM empresa e WHERE p.id=@id AND e.run_empresa=p.empresa_id AND e.usuario_id=@actor AND ((p.estado='Confirmado' AND @state='En preparación') OR (p.estado='En preparación' AND @state='Entregado'))",ct,("id",id),("state",state),("actor",actor));
  if(affected!=1) throw new StoreException("No tienes permiso o el pedido ya cambió de estado.",409);
 }
}
