namespace Backend_GrupoA.DTOs;

public record CatalogItemDto(string Id, string Sku, string Name, string Type,
 string CompanyId, string Seller, string Brand, int? Price, int? OriginalPrice,
 int Discount, int Stock, bool AdultOnly, int DurationMinutes,
 string[] CategoryIds, string Category, string Characteristics, bool Available);
public record CategoryDto(string Id, string Name, string Type, string[] ParentIds);
public record PageDto<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
public record LoginDto(string Identifier, string Password, bool Remember = false);
public record StockDto(int Quantity, int ExpectedQuantity);
public record EditProductDto(string Name, string Brand, bool AdultOnly, int? Price);
