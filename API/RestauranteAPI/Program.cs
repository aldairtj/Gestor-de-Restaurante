// Reemplaza tu Program.cs con este:
using RestauranteAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. CONFIGURAR LOGGING DETALLADO
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Debug);

// 2. CONFIGURAR CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. AGREGAR CONTEXTOS HTTP PARA LOGGING
builder.Services.AddHttpContextAccessor();

// 4. CONFIGURAR CONTROLADORES
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.DefaultIgnoreCondition = 
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// 5. AGREGAR SERVICIO FIREBIRD
builder.Services.AddScoped<FirebirdDb>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 6. MIDDLEWARE DE MANEJO DE ERRORES DETALLADO
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseCors("AllowAll");

// 7. TEST DE CONEXIÓN A FIREBIRD AL INICIAR
try
{
    var configuration = app.Services.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("FirebirdConnection");
    
    if (string.IsNullOrEmpty(connectionString))
    {
        Console.WriteLine("❌ ERROR: ConnectionString 'FirebirdConnection' no configurado");
    }
    else
    {
        // Enmascarar contraseña para logs
        var csMasked = System.Text.RegularExpressions.Regex.Replace(
            connectionString,
            "(?i)(Password|Pwd)=([^;]+)",
            "$1=****");
        
        Console.WriteLine($"🔌 ConnectionString: {csMasked}");
        
        // Intentar conexión
        using var testCon = new FirebirdSql.Data.FirebirdClient.FbConnection(connectionString);
        testCon.Open();
        Console.WriteLine("✅ Conexión a Firebird exitosa");
        
        // Verificar tablas básicas
        string[] tablasEsperadas = { 
            "MESA", "PLATO", "CLIENTE", "MESERO", "RESERVA", "PEDIDO",
            "FACTURA", "DETALLE_PEDIDO", "INGREDIENTE", "CATEGORIA",
            "ESTADO_MESA", "PLATO_INGREDIENTE"
        };
        foreach (var tabla in tablasEsperadas)
        {
            using var cmd = new FirebirdSql.Data.FirebirdClient.FbCommand(
                $"SELECT COUNT(*) FROM RDB$RELATIONS WHERE RDB$RELATION_NAME = '{tabla.ToUpper()}'", 
                testCon);
            var existe = Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            Console.WriteLine($"   {(existe ? "✅" : "❌")} Tabla {tabla}: {(existe ? "EXISTE" : "NO EXISTE")}");
        }
        testCon.Close();
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ ERROR DE CONEXIÓN FIREBIRD: {ex.Message}");
    Console.WriteLine($"Stack: {ex.StackTrace}");
}

// 8. SWAGGER
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Restaurante API v1");
        c.RoutePrefix = "api-docs";
    });
}

// 9. ARCHIVOS ESTÁTICOS Y RUTAS
app.UseDefaultFiles();
app.UseStaticFiles();

// 10. ENDPOINT DE ERROR GLOBAL
app.Map("/error", () => Results.Problem("Error interno del servidor"));
app.MapControllers();

// Redirección por defecto al login
app.MapGet("/", () => Results.Redirect("/login.html"));

// Servir archivos estáticos
app.UseStaticFiles(new StaticFileOptions
{
    ServeUnknownFileTypes = true,
    DefaultContentType = "text/plain"
});

// 11. RUTA PARA LA PÁGINA PRINCIPAL
app.MapFallbackToFile("index.html");

// 12. URLs PARA ESCUCHAR
app.Urls.Add("http://0.0.0.0:5034");
app.Urls.Add("http://localhost:5034");

Console.WriteLine("\n🚀 Servidor iniciado en:");
Console.WriteLine("   http://localhost:5034/");
Console.WriteLine("   http://localhost:5034/api-docs");
Console.WriteLine("   http://0.0.0.0:5034/");
Console.WriteLine("\n📡 Sistema de Restaurante listo!");
Console.WriteLine("\n📊 Secciones disponibles:");
Console.WriteLine("   • Dashboard - Panel principal");
Console.WriteLine("   • Mesas - Gestión de mesas");
Console.WriteLine("   • Reservas - Reservas de clientes");
Console.WriteLine("   • Pedidos - Órdenes del restaurante");
Console.WriteLine("   • Platos - Menú del restaurante");
Console.WriteLine("   • Clientes - Base de datos de clientes");
Console.WriteLine("   • Facturas - Gestión de facturas");
Console.WriteLine("   • Inventario - Control de ingredientes");
Console.WriteLine("   • Reportes - Reportes y estadísticas");

app.Run();