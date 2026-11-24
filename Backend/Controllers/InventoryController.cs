using System.Security.Claims;
using Backend_GrupoA.Data;
using Backend_GrupoA.DTOs;
using Backend_GrupoA.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend_GrupoA.Controllers;

[ApiController, Authorize]
[Route("api/inventario")]
public class InventoryController(CatalogRepository catalog, MultiplazaDbContext db, NpgsqlDataSource source) : ControllerBase
{
    private string Actor => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    [HttpGet]
    public async Task<IActionResult> Get(int page = 1, int pageSize = 48, CancellationToken ct = default)
    {
        if (page < 1 || page > 10000 || pageSize < 1 || pageSize > 100) return BadRequest();
        return Ok(await catalog.Products(page, pageSize, null, Actor, ct));
    }
    [HttpPut("{sku}/stock")]
    public async Task<IActionResult> Stock(string sku, StockDto dto, CancellationToken ct)
    {
        if (dto.Quantity < 0 || dto.Quantity > 999999 || dto.ExpectedQuantity < 0) return BadRequest(new { title = "El stock debe ser un entero entre 0 y 999999." });
        var adult = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "America/Santiago")).AddYears(-18);
        if (!await db.Usuarios.AnyAsync(u => u.Run == Actor && u.FechaNacimiento <= adult, ct)) return Forbid();
        await using var command = source.CreateCommand("""
            UPDATE stock st SET cantidad=@quantity FROM producto p
            WHERE p.sku=@sku AND p.stock_id=st.id_stock AND st.cantidad=@expected
              AND EXISTS (SELECT 1 FROM comercializa c JOIN empresa e ON e.run_empresa=c.empresa_id
                          WHERE c.producto_id=p.sku AND e.usuario_id=@actor)
              AND NOT EXISTS (SELECT 1 FROM producto other WHERE other.stock_id=p.stock_id AND other.sku<>p.sku)
              AND NOT EXISTS (SELECT 1 FROM comercializa c JOIN empresa e ON e.run_empresa=c.empresa_id
                          WHERE c.producto_id=p.sku AND e.usuario_id<>@actor)
            """);
        command.Parameters.AddWithValue("quantity", dto.Quantity);
        command.Parameters.AddWithValue("sku", sku);
        command.Parameters.AddWithValue("expected", dto.ExpectedQuantity);
        command.Parameters.AddWithValue("actor", Actor);
        return await command.ExecuteNonQueryAsync(ct) == 1 ? NoContent() : Conflict(new { title = "No se actualizó: el stock cambió, es compartido o no tienes permiso. Recarga el inventario." });
    }
    [HttpPut("{sku}"), HttpPut("/api/productos/{sku}")]
    public async Task<IActionResult> Edit(string sku, EditProductDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length > 100 || string.IsNullOrWhiteSpace(dto.Brand) || dto.Brand.Length > 50 || dto.Price < 0 || dto.Price > 10000000) return BadRequest(new { title = "Nombre, marca o precio inválido." });
        var adult = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "America/Santiago")).AddYears(-18);
        if (!await db.Usuarios.AnyAsync(u => u.Run == Actor && u.FechaNacimiento <= adult, ct)) return Forbid();
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var product = await db.Productos.Include(p => p.Empresas).Include(p => p.Vendes).SingleOrDefaultAsync(p => p.Sku == sku, ct);
        if (product == null || product.Empresas.Count != 1 || product.Empresas.Single().UsuarioId != Actor) return Forbid();
        var price = product.Vendes.SingleOrDefault(v => v.UsuarioId == Actor);
        if (dto.Price.HasValue && price == null) return Conflict(new { title = "No existe un precio de tu empresa. Se conserva la relación original de Vende." });
        product.Nombre = dto.Name.Trim(); product.Marca = dto.Brand.Trim(); product.RestriccionEdad = dto.AdultOnly;
        if (dto.Price.HasValue) price!.Precio = dto.Price.Value;
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return NoContent();
    }
}



