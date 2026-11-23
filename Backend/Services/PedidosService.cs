using Microsoft.EntityFrameworkCore;
using TiendaMultiplaza.API.Data;
using TiendaMultiplaza.API.DTOs;
using TiendaMultiplaza.API.Models;

namespace TiendaMultiplaza.API.Services;
public sealed class PedidosService(TiendaMultiplazaContext db, CatalogoService catalogo)
{
    public async Task<PedidoDto> Confirmar(string run, ConfirmarPedidoDto dto, CancellationToken ct)
    {
        if (dto.ClaveIdempotencia == Guid.Empty)
            throw new ReglaException(400, "Debes enviar una claveIdempotencia UUID no vacía.");
        var address = Reglas.Texto(dto.DireccionEntrega, "Dirección");
        if (address.Length < 10)
            throw new ReglaException(400, "La dirección debe tener al menos 10 caracteres.");
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await DbOperaciones.BloquearUsuario(db, run, ct);
        var previous = await db.Pedido.AsNoTracking().SingleOrDefaultAsync(x => x.UsuarioRun == run && x.ClaveIdempotencia == dto.ClaveIdempotencia, ct);
        if (previous is not null)
        {
            if (previous.DireccionEntrega != address)
                throw new ReglaException(409, "La clave de operación ya se utilizó con otra dirección.");
            await tx.CommitAsync(ct);
            return await Obtener(previous.VentaId, run, false, ct);
        }
        var cart = await db.Carrito_Detalle.Where(x => x.UsuarioRun == run).OrderBy(x => x.ProductoId).ToListAsync(ct);
        if (cart.Count == 0)
            throw new ReglaException(409, "El carrito está vacío.");
        var skus = cart.Select(x => x.ProductoId).ToArray();
        // Todas las escrituras de catálogo de esta API toman los mismos bloqueos.
        var products = await db.Producto.FromSqlInterpolated($"SELECT * FROM public.producto WHERE sku=ANY({skus}) ORDER BY sku FOR UPDATE").ToDictionaryAsync(x => x.Sku, ct);
        var stockIds = products.Values.Select(x => x.StockId).Distinct().Order().ToArray();
        var stocks = await db.Stock.FromSqlInterpolated($"SELECT * FROM public.stock WHERE id_stock=ANY({stockIds}) ORDER BY id_stock FOR UPDATE").ToDictionaryAsync(x => x.IdStock, ct);
        var birth = await db.Usuario.Where(x => x.Run == run).Select(x => x.FechaNacimiento).SingleAsync(ct);
        var prices = await catalogo.Precios(skus, ct);
        var lines = new List<Pedido_Detalle>();
        foreach (var item in cart)
        {
            if (!products.TryGetValue(item.ProductoId, out var p) || p.Visible != true)
                throw new ReglaException(409, $"El producto {item.ProductoId} ya no está disponible.");
            if (p.RestriccionEdad && birth > Reglas.Hoy.AddYears(-18))
                throw new ReglaException(403, "El carrito contiene productos para mayores de edad.");
            var price = prices.GetValueOrDefault(p.Sku, []).SingleOrDefault(x => x.VendedorRun == item.VendedorRun) ?? throw new ReglaException(409, "Un vendedor o precio del carrito ya no está disponible.");
            var stock = stocks[p.StockId];
            if (stock.Cantidad < item.Cantidad)
                throw new ReglaException(409, $"Stock insuficiente para {p.Nombre}.");
            stock.Cantidad -= item.Cantidad;
            lines.Add(new Pedido_Detalle { ProductoId = p.Sku, VendedorRun = item.VendedorRun, Nombre = p.Nombre, Cantidad = item.Cantidad, PrecioUnitario = price.PrecioFinal });
        }
        var subtotal = lines.Sum(x => (long)x.PrecioUnitario * x.Cantidad);
        // El esquema original usa INT y calcula IVA multiplicando el subtotal por 19.
        if (subtotal > 100_000_000)
            throw new ReglaException(400, "El pedido supera el máximo permitido de 100.000.000 netos.");
        var iva = subtotal * 19 / 100;
        var total = subtotal + iva;
        var id = await DbOperaciones.SiguienteId(db, "venta", ct);
        var sale = new Venta { IdVenta = id, CodigoTransferencia = id, Estado = "Pendiente", Pagada = false, Fecha = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified) };
        db.Venta.Add(sale);
        db.Venta_Datos.Add(new Venta_Datos { IdVenta = id, IdVentaNavigation = sale, Cantidad = lines.Sum(x => x.Cantidad), PrecioSinIva = (int)subtotal, TotalIva = (int)iva, PrecioTotal = (int)total, Fecha = Reglas.Hoy, TotalCalculado = total, Descuento = 0 });
        db.Compra.Add(new Compra { Usuario = run, VentaId = id, Venta = sale, Fecha = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified), DescuentoAplicado = 0, Nota = "Pedido API" });
        foreach (var line in lines)
        {
            var price = prices[line.ProductoId].Single(x => x.VendedorRun == line.VendedorRun);
            db.Incluye.Add(new Incluye { ProductoId = line.ProductoId, VentaId = id, Venta = sale, UsuarioId = run, Cantidad = line.Cantidad, PrecioOriginal = price.PrecioBase, DescuentoOferta = price.DescuentoPorcentaje, PrecioFinal = line.PrecioUnitario });
        }
        // Guardar primero Venta para satisfacer la FK de Pedido, no modelada en las clases generadas.
        await db.SaveChangesAsync(ct);
        var order = new Pedido { VentaId = id, UsuarioRun = run, ClaveIdempotencia = dto.ClaveIdempotencia, DireccionEntrega = address, Detalles = lines };
        foreach (var line in lines)
            line.VentaId = id;
        db.Pedido.Add(order);
        db.Carrito_Detalle.RemoveRange(cart);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return await Obtener(id, run, false, ct);
    }
    public async Task<PedidoDto> Obtener(int id, string run, bool admin, CancellationToken ct)
    {
        var query = db.Compra.AsNoTracking().Where(x => x.VentaId == id && (admin || x.Usuario == run));
        var purchase = await query.Select(x => new { x.Usuario, x.Venta.Pagada }).FirstOrDefaultAsync(ct) ?? throw new ReglaException(404, "Pedido no encontrado.");
        var order = await db.Pedido.AsNoTracking().Include(x => x.Detalles).SingleOrDefaultAsync(x => x.VentaId == id, ct);
        var amounts = await db.Venta_Datos.AsNoTracking().SingleOrDefaultAsync(x => x.IdVenta == id, ct) ?? throw new ReglaException(409, "La venta histórica no tiene importes completos.");
        List<PedidoLineaDto> items;
        if (order is not null)
            items = order.Detalles.OrderBy(x => x.ProductoId).Select(x => new PedidoLineaDto(x.ProductoId, x.Nombre, x.VendedorRun, x.Cantidad, x.PrecioUnitario, (long)x.Cantidad * x.PrecioUnitario)).ToList();
        else
        {
            var old = await db.Incluye.AsNoTracking().Where(x => x.VentaId == id).Select(x => new { x.ProductoId, x.Producto.Nombre, x.Cantidad, x.PrecioFinal }).ToListAsync(ct);
            items = old.Select(x => new PedidoLineaDto(x.ProductoId, x.Nombre, "", x.Cantidad ?? amounts.Cantidad, (int)(x.PrecioFinal ?? 0), (long)(x.Cantidad ?? amounts.Cantidad) * (int)(x.PrecioFinal ?? 0))).ToList();
        }
        return new(id, purchase.Usuario, order?.Estado ?? "Historico", order?.CreadoEn ?? amounts.Fecha.ToDateTime(TimeOnly.MinValue), order?.DireccionEntrega, amounts.PrecioSinIva, amounts.TotalIva, amounts.PrecioTotal, purchase.Pagada == true, items);
    }
    public async Task<PaginaDto<PedidoDto>> Listar(string run, bool admin, int pagina, int tamano, CancellationToken ct)
    {
        var offset = Reglas.Offset(pagina, tamano);
        var query = db.Compra.AsNoTracking().Where(x => admin || x.Usuario == run).Select(x => x.VentaId).Distinct();
        var total = await query.CountAsync(ct);
        var ids = await query.OrderByDescending(x => x).Skip(offset).Take(tamano).ToListAsync(ct);
        var data = new List<PedidoDto>();
        foreach (var id in ids)
            data.Add(await Obtener(id, run, admin, ct));
        return new(data, pagina, tamano, total);
    }
    public async Task<PedidoDto> CambiarEstado(int id, string run, bool admin, string estado, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var order = await db.Pedido.FromSqlInterpolated($"SELECT * FROM public.pedido WHERE venta_id={id} FOR UPDATE").SingleOrDefaultAsync(ct) ?? throw new ReglaException(404, "Pedido de la API no encontrado.");
        if (!admin && order.UsuarioRun != run)
            throw new ReglaException(404, "Pedido no encontrado.");
        if (!admin && estado != "Cancelado")
            throw new ReglaException(403, "Solo administración puede cambiar este estado.");
        if (order.Estado == estado)
        {
            await tx.CommitAsync(ct);
            return await Obtener(id, run, admin, ct);
        }
        var allowed = order.Estado switch
        {
            "Pendiente" => estado is "Confirmado" or "Cancelado",
            "Confirmado" => estado == "EnPreparacion",
            "EnPreparacion" => estado == "Despachado",
            "Despachado" => estado == "Entregado",
            _ => false
        };
        if (!allowed)
            throw new ReglaException(409, "Transición de estado inválida. Solo los pedidos pendientes pueden cancelarse.");
        if (estado == "Cancelado")
        {
            var lines = await db.Pedido_Detalle.Where(x => x.VentaId == id).ToListAsync(ct);
            var skus = lines.Select(x => x.ProductoId).ToArray();
            var products = await db.Producto.AsNoTracking().Where(x => skus.Contains(x.Sku)).ToDictionaryAsync(x => x.Sku, ct);
            var ids = products.Values.Select(x => x.StockId).Distinct().Order().ToArray();
            var stocks = await db.Stock.FromSqlInterpolated($"SELECT * FROM public.stock WHERE id_stock=ANY({ids}) ORDER BY id_stock FOR UPDATE").ToDictionaryAsync(x => x.IdStock, ct);
            foreach (var line in lines)
                stocks[products[line.ProductoId].StockId].Cantidad = checked(stocks[products[line.ProductoId].StockId].Cantidad + line.Cantidad);
        }
        order.Estado = estado;
        order.ActualizadoEn = DateTime.UtcNow;
        var sale = await db.Venta.SingleAsync(x => x.IdVenta == id, ct);
        sale.Estado = estado;
        // Confirmado es una confirmación manual de administración; no se procesa dinero.
        if (estado == "Confirmado")
            sale.Pagada = true;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return await Obtener(id, run, admin, ct);
    }
}
