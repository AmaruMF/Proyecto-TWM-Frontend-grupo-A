using System.ComponentModel.DataAnnotations;
namespace Backend_GrupoA.DTOs;
public record RegisterDto([Required,MaxLength(15)] string Run, [Required,MaxLength(100)] string Name,
 DateOnly Birthday, [Required,EmailAddress,MaxLength(255)] string Email, [Required,MinLength(8),MaxLength(128)] string Password);
public record ProfileEditDto([Required,MaxLength(100)] string Name, [Required,EmailAddress,MaxLength(255)] string Email);
public record PasswordDto([Required] string CurrentPassword, [Required,MinLength(8),MaxLength(128)] string NewPassword);
public record CompanyDto([Required,MaxLength(15)] string Rut,[Required,MaxLength(100)] string Name);
public record NewProductDto([Required,RegularExpression("[A-Za-z0-9_-]{1,50}")] string Sku,
 [Required,MaxLength(100)] string Name,[Required,MaxLength(50)] string Brand,
 [Required] string CompanyId, int CategoryId,[Range(0,10000000)] int Price,[Range(0,999999)] int Stock,bool AdultOnly);
public record CartDto([Range(1,999)] int Quantity);
public record OrderDto([Required] string CompanyId, Guid RequestId);
public record CategoryWriteDto([Required,MaxLength(100)] string Name,[Required] string Type);
public record UserStatusDto(bool Disabled);
public record OrderStateDto([Required] string State);
