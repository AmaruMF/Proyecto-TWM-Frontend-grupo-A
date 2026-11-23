using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TiendaMultiplaza.API.Data;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Models;

namespace TiendaMultiplaza.API.Services;
public sealed class CatalogoService(TiendaMultiplazaContext db)
{
    public async Task<Dictionary<string, List<PrecioDto>>> Precios(IEnumerable<string> skus, CancellationToken ct)
    {
        var ids = skus.Distinct().ToArray();
        var today = Reglas.Hoy;
        var prices = await db.Vende.AsNoTracking().Where(x => ids.Contains(x.ProductoId) && x.Precio > 0)
            .Join(db.Usuario_Acceso.Where(x => x.Activo), v => v.UsuarioId, a => a.UsuarioRun, (v, a) => new { v.ProductoId, v.UsuarioId, v.Precio }).ToListAsync(ct);
        var discounts = await db.Promociona.AsNoTracking().Where(x => ids.Contains(x.ProductoId) && x.FechaInicio <= today && x.FechaFin >= today && x.Oferta.Porcentaje >= 0 && x.Oferta.Porcentaje <= 100)
            .Select(x => new { x.ProductoId, x.Oferta.Porcentaje }).ToListAsync(ct);
        return prices.GroupBy(x => x.ProductoId).ToDictionary(g => g.Key, g => g.Select(p =>
        {
            var discount = discounts.Where(x => x.ProductoId == p.ProductoId).Select(x => x.Porcentaje).DefaultIfEmpty(0).Max();
            var final = (int)Math.Round(p.Precio * (100m - discount) / 100m, MidpointRounding.AwayFromZero);
            return new PrecioDto(p.UsuarioId, p.Precio, discount, final);
        }).OrderBy(x => x.PrecioFinal).ThenBy(x => x.VendedorRun).ToList());
    }
    public async Task<PaginaDto<ProductoListadoDto>> Listar(int pagina, int tamano, string? buscar, int? categoria, bool incluirOcultos, CancellationToken ct)
    {
        var offset = Reglas.Offset(pagina, tamano);
        var query = db.Producto.AsNoTracking().Where(x => incluirOcultos || x.Visible == true);
        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var term = buscar.Trim();
            if (term.Length > 100)
                throw new ReglaException(400, "La búsqueda admite hasta 100 caracteres.");
            query = query.Where(x => x.Nombre.Contains(term) || x.Marca.Contains(term) || x.Sku.Contains(term));
        }
        if (categoria.HasValue)
            query = query.Where(x => x.Categoria.Any(c => c.IdCategoria == categoria));
        var total = await query.CountAsync(ct);
        var rows = await query.OrderBy(x => x.Nombre).ThenBy(x => x.Sku).Skip(offset).Take(tamano).Select(x => new { x.Sku, x.Nombre, x.Marca, x.Stock.Cantidad }).ToListAsync(ct);
        var prices = await Precios(rows.Select(x => x.Sku), ct);
        var data = rows.Select(x => new ProductoListadoDto(x.Sku, x.Nombre, x.Marca, x.Cantidad, prices.TryGetValue(x.Sku, out var p) ? p[0].PrecioFinal : null)).ToList();
        return new(data, pagina, tamano, total);
    }
    public async Task<ProductoDetalleDto> Obtener(string sku, bool incluirOcultos, CancellationToken ct)
    {
        var p = await db.Producto.AsNoTracking().Include(x => x.Stock).Include(x => x.Categoria).SingleOrDefaultAsync(x => x.Sku == sku && (incluirOcultos || x.Visible == true), ct) ?? throw new ReglaException(404, "Producto no encontrado.");
        var prices = await Precios([sku], ct);
        return new(p.Sku, p.Nombre, p.Marca, p.RestriccionEdad, p.CotizacionId, JsonSerializer.Deserialize<JsonElement>(p.Caracteristica), p.Stock.Cantidad, p.Visible == true, p.Categoria.Select(x => x.IdCategoria).Order().ToArray(), prices.GetValueOrDefault(sku, []));
    }
    public async Task<ProductoDetalleDto> Guardar(string? sku, ProductoGuardarDto dto, CancellationToken ct)
    {
        var target = Reglas.Texto(dto.Sku, "SKU");
        if (sku is not null && sku != target)
            throw new ReglaException(400, "El SKU de la ruta y el cuerpo deben coincidir.");
        if (dto.Caracteristica.ValueKind != JsonValueKind.Object || dto.Caracteristica.GetRawText().Length > 20000)
            throw new ReglaException(400, "Caracteristica debe ser un objeto JSON de hasta 20.000 caracteres.");
        var seller = Reglas.Run(dto.VendedorRun);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        if (!await db.Cotizacion.AnyAsync(x => x.IdCotizacion == dto.CotizacionId, ct))
            throw new ReglaException(400, "La cotización de origen no existe.");
        if (!await db.Usuario_Acceso.AnyAsync(x => x.UsuarioRun == seller && x.Activo, ct))
            throw new ReglaException(400, "El vendedor no existe o está inactivo.");
        var categoryIds = dto.Categorias.Distinct().ToArray();
        var categories = await db.Categoria.Where(x => categoryIds.Contains(x.IdCategoria)).ToListAsync(ct);
        if (categories.Count != categoryIds.Length)
            throw new ReglaException(400, "Una categoría no existe.");
        Producto p;
        if (sku is null)
        {
            if (await db.Producto.AnyAsync(x => x.Sku == target, ct))
                throw new ReglaException(409, "El SKU ya existe.");
            var stock = new Stock { IdStock = await DbOperaciones.SiguienteId(db, "stock", ct), Cantidad = dto.Stock };
            p = new Producto { Sku = target, Stock = stock, StockId = stock.IdStock };
            db.Producto.Add(p);
        }
        else
        {
            p = await db.Producto.FromSqlInterpolated($"SELECT * FROM public.producto WHERE sku={sku} FOR UPDATE").SingleOrDefaultAsync(ct) ?? throw new ReglaException(404, "Producto no encontrado.");
            await db.Entry(p).Collection(x => x.Categoria).LoadAsync(ct);
            p.Stock = await db.Stock.FromSqlInterpolated($"SELECT * FROM public.stock WHERE id_stock={p.StockId} FOR UPDATE").SingleAsync(ct);
            p.Stock.Cantidad = dto.Stock;
        }
        p.Nombre = Reglas.Texto(dto.Nombre, "Nombre");
        p.Marca = Reglas.Texto(dto.Marca, "Marca");
        p.RestriccionEdad = dto.RestriccionEdad;
        p.CotizacionId = dto.CotizacionId;
        p.Caracteristica = dto.Caracteristica.GetRawText();
        p.Visible = dto.Visible;
        p.Categoria.Clear();
        foreach (var c in categories)
            p.Categoria.Add(c);
        var price = await db.Vende.SingleOrDefaultAsync(x => x.ProductoId == target && x.UsuarioId == seller, ct);
        if (price is null)
            db.Vende.Add(new Vende { ProductoId = target, Producto = p, UsuarioId = seller, Precio = dto.Precio });
        else
            price.Precio = dto.Precio;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return await Obtener(target, true, ct);
    }
    public async Task Ocultar(string sku, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var p = await db.Producto.FromSqlInterpolated($"SELECT * FROM public.producto WHERE sku={sku} FOR UPDATE").SingleOrDefaultAsync(ct) ?? throw new ReglaException(404, "Producto no encontrado.");
        p.Visible = false;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }
    public async Task Stock(string sku, int cantidad, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var p = await db.Producto.FromSqlInterpolated($"SELECT * FROM public.producto WHERE sku={sku} FOR UPDATE").SingleOrDefaultAsync(ct) ?? throw new ReglaException(404, "Producto no encontrado.");
        var s = await db.Stock.FromSqlInterpolated($"SELECT * FROM public.stock WHERE id_stock={p.StockId} FOR UPDATE").SingleAsync(ct);
        s.Cantidad = cantidad;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }
    public async Task<List<CategoriaDto>> Categorias(CancellationToken ct) => await db.Categoria.AsNoTracking().OrderBy(x => x.Nombre).Select(x => new CategoriaDto(x.IdCategoria, x.Nombre, x.Tipo)).ToListAsync(ct);
    public async Task<CategoriaDto> GuardarCategoria(int? id, CategoriaGuardarDto dto, CancellationToken ct)
    {
        var name = Reglas.Texto(dto.Nombre, "Nombre");
        var type = Reglas.Texto(dto.Tipo, "Tipo");
        if (id is null)
        {
            var c = new Categoria { IdCategoria = await DbOperaciones.SiguienteId(db, "categoria", ct), Nombre = name, Tipo = type };
            db.Categoria.Add(c);
            await db.SaveChangesAsync(ct);
            return new(c.IdCategoria, name, type);
        }
        // Nombre es clave alternativa en Subdivide; PostgreSQL comprueba las referencias.
        var affected = await db.Categoria.Where(x => x.IdCategoria == id).ExecuteUpdateAsync(s => s.SetProperty(x => x.Nombre, name).SetProperty(x => x.Tipo, type), ct);
        if (affected == 0)
            throw new ReglaException(404, "Categoría no encontrada.");
        return new(id.Value, name, type);
    }
    public async Task EliminarCategoria(int id, CancellationToken ct)
    {
        if (await db.Categoria.Where(x => x.IdCategoria == id).ExecuteDeleteAsync(ct) == 0)
            throw new ReglaException(404, "Categoría no encontrada.");
    }
}
