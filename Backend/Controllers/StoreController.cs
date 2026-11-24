using System.Security.Claims;
using Backend_GrupoA.DTOs;
using Backend_GrupoA.Services;
using Backend_GrupoA.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using static Backend_GrupoA.Repositories.StoreRepository;
namespace Backend_GrupoA.Controllers;
[ApiController,Route("api")]
public class StoreController(AccountService accounts,CommerceService commerce,ProductService products,StoreRepository repo,CatalogRepository catalog):ControllerBase {
 string Actor => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
 [HttpPost("auth/register"),EnableRateLimiting("login")]
 public async Task<IActionResult> Register(RegisterDto dto,CancellationToken ct) { var id=await accounts.Register(dto,ct); return Created("/api/auth/me",new {id}); }
 [HttpPut("cuenta"),Authorize]
 public async Task<IActionResult> Profile(ProfileEditDto dto,CancellationToken ct) { await accounts.Edit(Actor,dto,ct);return NoContent(); }
 [HttpPut("cuenta/password"),Authorize,EnableRateLimiting("login")]
 public async Task<IActionResult> Password(PasswordDto dto,CancellationToken ct) { await accounts.ChangePassword(Actor,dto,ct);return NoContent(); }
 [HttpPost("empresas"),Authorize]
 public async Task<IActionResult> Company(CompanyDto dto,CancellationToken ct) {await accounts.Company(Actor,dto,ct);return NoContent();}
 [HttpGet("productos/{sku}")]
 public async Task<IActionResult> Product(string sku,CancellationToken ct) {var page=await catalog.Products(1,1,null,null,ct,sku);return page.Items.Count==0?NotFound():Ok(page.Items[0]);}
 [HttpPost("productos"),Authorize]
 public async Task<IActionResult> Create(NewProductDto dto,CancellationToken ct) {await products.Create(Actor,dto,ct);return Created("/api/productos/"+Uri.EscapeDataString(dto.Sku),new {sku=dto.Sku});}
 [HttpDelete("productos/{sku}"),Authorize]
 public async Task<IActionResult> Delete(string sku,CancellationToken ct) {await products.Delete(Actor,sku,ct);return NoContent();}
 [HttpGet("carrito"),Authorize]
 public async Task<IActionResult> Cart(CancellationToken ct)=>Ok(await commerce.Cart(Actor,ct));
 [HttpPost("carrito/{sku}"),Authorize]
 public async Task<IActionResult> Add(string sku,CartDto dto,CancellationToken ct) {await commerce.SetCart(Actor,sku,dto.Quantity,true,ct);return NoContent();}
 [HttpPut("carrito/{sku}"),Authorize]
 public async Task<IActionResult> Quantity(string sku,CartDto dto,CancellationToken ct) {await commerce.SetCart(Actor,sku,dto.Quantity,false,ct);return NoContent();}
 [HttpDelete("carrito/{sku}"),Authorize]
 public async Task<IActionResult> Remove(string sku,CancellationToken ct) {await commerce.Remove(Actor,sku,ct);return NoContent();}
 [HttpPost("pedidos"),Authorize]
 public async Task<IActionResult> Order(OrderDto dto,CancellationToken ct)=>Ok(await commerce.Checkout(Actor,dto,ct));
 [HttpGet("pedidos/nuevos"),Authorize]
 public async Task<IActionResult> Orders(bool sales=false,CancellationToken ct=default)=>Ok(await commerce.Orders(Actor,sales,ct));
 [HttpPut("pedidos/{id:guid}/estado"),Authorize]
 public async Task<IActionResult> State(Guid id,OrderStateDto dto,CancellationToken ct) {await commerce.State(Actor,id,dto.State,ct);return NoContent();}
 [HttpGet("admin/usuarios"),Authorize]
 public async Task<IActionResult> Users(int page=1,CancellationToken ct=default) {
  if(!await accounts.IsAdmin(Actor,ct)) return Forbid(); if(page<1||page>10000)return BadRequest();
  await using var c=await repo.Open(ct);return Ok(await Json(c,"SELECT coalesce(json_agg(x),'[]')::text FROM (SELECT u.run id,u.nombre name,a.email,coalesce(a.disabled,false) disabled,coalesce(a.admin,false) admin FROM usuario u LEFT JOIN app.usuario a ON a.usuario_id=u.run ORDER BY u.run LIMIT 50 OFFSET @offset)x",ct,("offset",(page-1)*50)));
 }
 [HttpPut("admin/usuarios/{id}/estado"),Authorize]
 public async Task<IActionResult> UserState(string id,UserStatusDto dto,CancellationToken ct) {
  if(!await accounts.IsAdmin(Actor,ct))return Forbid();if(id==Actor)throw new StoreException("No puedes desactivar tu propia cuenta administradora.");
  await using var c=await repo.Open(ct);
  if(!await Scalar<bool>(c,"SELECT EXISTS(SELECT 1 FROM usuario WHERE run=@id)",ct,("id",id)))return NotFound();
  await Exec(c,"INSERT INTO app.usuario(usuario_id,email,disabled) VALUES(@id,@email,@disabled) ON CONFLICT(usuario_id) DO UPDATE SET disabled=excluded.disabled",ct,("id",id),("email","legacy-"+Guid.NewGuid()+"@sin-correo.invalid"),("disabled",dto.Disabled));return NoContent();
 }
 [HttpPost("categorias"),Authorize]
 public async Task<IActionResult> Category(CategoryWriteDto dto,CancellationToken ct) {
  if(!await accounts.IsAdmin(Actor,ct)) return Forbid();if(dto.Type is not ("product" or "service")||string.IsNullOrWhiteSpace(dto.Name)) return BadRequest();
  await using var c=await repo.Open(ct);await using var tx=await c.BeginTransactionAsync(ct);await Exec(c,"LOCK TABLE categoria IN EXCLUSIVE MODE",ct);
  var id=await Scalar<int>(c,"INSERT INTO categoria(id_categoria,nombre,tipo) SELECT coalesce(max(id_categoria),0)+1,@name,@type FROM categoria RETURNING id_categoria",ct,("name",dto.Name.Trim()),("type",dto.Type=="service"?"Servicio":"Producto Físico"));await tx.CommitAsync(ct);return Ok(new{id});
 }
}
