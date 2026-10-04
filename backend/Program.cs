var builder = WebApplication.CreateBuilder(args);

// Configuramos CORS para darle permiso a Vite
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173") 
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Activamos CORS antes de los controladores
app.UseCors("PermitirReact");
app.UseAuthorization();
app.MapControllers();

app.Run();