using Backend_GrupoA.Data;
using Backend_GrupoA.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Backend_GrupoA.Repositories;

public class CatalogRepository(MultiplazaDbContext db)
{
    public async Task<PageDto<CatalogItemDto>> Products(int page, int size, string? query, string? owner, CancellationToken ct, string? sku = null)
    {
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "America/Santiago"));
        var source = db.Productos.AsNoTracking().Where(p => !db.ProductStates.Any(s => s.Sku == p.Sku && !s.Active));
        if (sku != null) source = source.Where(p => p.Sku == sku);
        if (!string.IsNullOrWhiteSpace(query)) source = source.Where(p => p.Nombre.Contains(query) || p.Sku.Contains(query));
        if (owner != null) source = source.Where(p => p.Empresas.Any(e => e.UsuarioId == owner));
        var total = await source.CountAsync(ct);
        var rows = await source.OrderBy(p => p.Sku).Skip((page - 1) * size).Take(size)
            .Select(p => new {
                p.Sku, p.Nombre, p.Marca, p.RestriccionEdad, p.Caracteristica, Stock = p.Stock.Cantidad,
                Companies = p.Empresas.Select(e => new { Id = e.RunEmpresa, e.Nombre, e.UsuarioId }).ToList(),
                Prices = p.Vendes.Select(v => new { v.UsuarioId, v.Precio }).ToList(),
                Categories = p.Categoria.Select(c => new { c.IdCategoria, c.Nombre }).ToList(),
                Discount = p.Promocionas.Where(o => o.FechaInicio <= today && o.FechaFin >= today)
                    .Select(o => (int?)o.Oferta.Porcentaje).Max() ?? 0
            }).ToListAsync(ct);
        var items = rows.Select(p => {
            // Sin elegir un vendedor arbitrario cuando las relaciones son ambiguas.
            var company = p.Companies.Count == 1 ? p.Companies[0] : null;
            int? price = company == null ? null : p.Prices.Where(v => v.UsuarioId == company.UsuarioId).Select(v => (int?)v.Precio).SingleOrDefault();
            var discount = Math.Clamp(p.Discount, 0, 100);
            int? current = price.HasValue ? (int)Math.Round(price.Value * (100 - discount) / 100m, MidpointRounding.AwayFromZero) : null;
            return new CatalogItemDto(p.Sku, p.Sku, p.Nombre, "product", company?.Id ?? "", company?.Nombre ?? "Empresa por confirmar",
                p.Marca, current, price, discount, p.Stock, p.RestriccionEdad, 0,
                p.Categories.Select(c => c.IdCategoria.ToString()).ToArray(), string.Join(" / ", p.Categories.Select(c => c.Nombre)),
                p.Caracteristica, price.HasValue && p.Stock > 0);
        }).ToList();
        return new(items, total, page, size);
    }

    public async Task<PageDto<CatalogItemDto>> Services(int page, int size, string? query, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "America/Santiago"));
        var source = db.Servicios.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query)) source = source.Where(p => p.Nombre.Contains(query) || p.Sku.Contains(query));
        var total = await source.CountAsync(ct);
        var rows = await source.OrderBy(p => p.Sku).Skip((page - 1) * size).Take(size).Select(p => new {
            p.Sku, p.Nombre, p.RestriccionEdad, p.Tiempo, p.Caracteristica,
            Companies = p.Distribuyes.Select(d => new { Id = d.EmpresaId, d.Empresa.Nombre, d.Precio }).ToList(),
            Categories = p.Categoria.Select(c => new { c.IdCategoria, c.Nombre }).ToList(),
            Discount = p.Admites.Where(o => o.FechaInicio <= today && o.FechaFin >= today).Select(o => (int?)o.Oferta.Porcentaje).Max() ?? 0
        }).ToListAsync(ct);
        var items = rows.Select(p => {
            var company = p.Companies.Count == 1 ? p.Companies[0] : null;
            var discount = Math.Clamp(p.Discount, 0, 100);
            int? price = company?.Precio;
            return new CatalogItemDto(p.Sku, p.Sku, p.Nombre, "service", company?.Id ?? "", company?.Nombre ?? "Empresa por confirmar", "",
                price.HasValue ? (int)Math.Round(price.Value * (100 - discount) / 100m, MidpointRounding.AwayFromZero) : null,
                price, discount, 0, p.RestriccionEdad, p.Tiempo,
                p.Categories.Select(c => c.IdCategoria.ToString()).ToArray(), string.Join(" / ", p.Categories.Select(c => c.Nombre)), p.Caracteristica, price.HasValue);
        }).ToList();
        return new(items, total, page, size);
    }
    public async Task<List<CategoryDto>> Categories(CancellationToken ct) => await db.Categoria.AsNoTracking().OrderBy(c => c.IdCategoria)
        .Select(c => new CategoryDto(c.IdCategoria.ToString(), c.Nombre, c.Tipo == "Servicio" ? "service" : "product",
            c.CategoriaPadres.Select(p => p.IdCategoria.ToString()).ToArray())).ToListAsync(ct);
}


