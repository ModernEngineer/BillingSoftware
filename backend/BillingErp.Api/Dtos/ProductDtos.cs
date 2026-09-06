namespace BillingErp.Api.Dtos;

public record ProductCreateRequest(
    string Name,
    string Sku,
    string? Barcode,
    int? CategoryId,
    int? BrandId,
    int UnitId,
    string? HsnCode,
    decimal PurchasePrice,
    decimal SellingPrice,
    decimal? Mrp,
    decimal? GstRate,
    decimal? OpeningStock,
    decimal? MinimumStock,
    decimal? MaximumStock,
    string? Description,
    string? Image,
    bool? Status);

public record ProductUpdateRequest(
    string? Name,
    string? Sku,
    string? Barcode,
    int? CategoryId,
    int? BrandId,
    int? UnitId,
    string? HsnCode,
    decimal? PurchasePrice,
    decimal? SellingPrice,
    decimal? Mrp,
    decimal? GstRate,
    decimal? MinimumStock,
    decimal? MaximumStock,
    string? Description,
    string? Image,
    bool? Status);
