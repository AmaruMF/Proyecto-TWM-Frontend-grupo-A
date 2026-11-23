using Microsoft.EntityFrameworkCore;
using TiendaMultiplaza.API.Data;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Models;

namespace TiendaMultiplaza.API.Services;
public sealed class CarritoService(TiendaMultiplazaContext db, CatalogoService catalogo)
{
    public async Task<CarritoDto> Obtener(string run, CancellationToken ct)
    {
        var rows = await db.Carrito_Detalle.AsNoTracking().Where(x => x.UsuarioRun == run).OrderBy(x => x.ProductoId).ToListAsync(ct);
        var skus = rows.Select(x => x.ProductoId).ToArray();
        var products = await db.Producto.AsNoTracking().Include(x => x.Stock).Where(x => skus.Contains(x.Sku)).ToDictionaryAsync(x => x.Sku, ct);
        var prices = await catalogo.Precios(skus, ct);
        var items = rows.Select(row =>
        {
            var p = products[row.ProductoId];
            var price = prices.GetValueOrDefault(p.Sku, []).FirstOrDefault(x => x.VendedorRun == row.VendedorRun);
            return new CarritoLineaDto(p.Sku, p.Nombre, row.VendedorRun, row.Cantidad, p.Stock.Cantidad, price?.PrecioFinal ?? 0, (long)(price?.PrecioFinal ?? 0) * row.Cantidad, p.Visible == true && p.Stock.Cantidad >= row.Cantidad && price is not null);
        }).ToList();
        var subtotal = items.Sum(x => x.Subtotal);
        var iva = subtotal * 19 / 100;
        return new(items, subtotal, iva, subtotal + iva);
    }
    public async Task Guardar(string run, CarritoItemDto dto, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await DbOperaciones.BloquearUsuario(db, run, ct);
        var seller = Reglas.Run(dto.VendedorRun);
        var product = await db.Producto.AsNoTracking().Include(x => x.Stock).SingleOrDefaultAsync(x => x.Sku == dto.Sku && x.Visible == true, ct) ?? throw new ReglaException(404, "Producto no disponible.");
        if (product.Stock.Cantidad < dto.Cantidad)
            throw new ReglaException(409, "Stock insuficiente.");
        var birth = await db.Usuario.Where(x => x.Run == run).Select(x => x.FechaNacimiento).SingleAsync(ct);
        if (product.RestriccionEdad && birth > Reglas.Hoy.AddYears(-18))
            throw new ReglaException(403, "Este producto requiere ser mayor de 18 años.");
        var prices = await catalogo.Precios([dto.Sku], ct);
        if (!prices.GetValueOrDefault(dto.Sku, []).Any(x => x.VendedorRun == seller))
            throw new ReglaException(400, "Ese vendedor no tiene un precio disponible para el producto.");
        var cart = await db.Carrito.SingleOrDefaultAsync(x => x.UsuarioRun == run, ct);
        if (cart is null)
        {
            cart = new Carrito { UsuarioRun = run };
            db.Carrito.Add(cart);
        }
        var line = await db.Carrito_Detalle.SingleOrDefaultAsync(x => x.UsuarioRun == run && x.ProductoId == dto.Sku, ct);
        if (line is null)
        {
            if (await db.Carrito_Detalle.CountAsync(x => x.UsuarioRun == run, ct) >= 100)
                throw new ReglaException(400, "El carrito admite hasta 100 productos distintos.");
            line = new Carrito_Detalle { UsuarioRun = run, ProductoId = dto.Sku, Carrito = cart };
            db.Carrito_Detalle.Add(line);
        }
        line.VendedorRun = seller;
        line.Cantidad = dto.Cantidad;
        cart.ActualizadoEn = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }
    public async Task Cantidad(string run, string sku, int cantidad, CancellationToken ct)
    {
        // Guardar adquiere el bloqueo y revalida stock; la actualización usa el vendedor actual.
        var line = await db.Carrito_Detalle.AsNoTracking().SingleOrDefaultAsync(x => x.UsuarioRun == run && x.ProductoId == sku, ct) ?? throw new ReglaException(404, "Producto no encontrado en el carrito.");
        await Guardar(run, new CarritoItemDto(sku, line.VendedorRun, cantidad), ct);
    }
    public async Task Eliminar(string run, string? sku, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await DbOperaciones.BloquearUsuario(db, run, ct);
        await db.Carrito_Detalle.Where(x => x.UsuarioRun == run && (sku == null || x.ProductoId == sku)).ExecuteDeleteAsync(ct);
        await tx.CommitAsync(ct);
    }
}
