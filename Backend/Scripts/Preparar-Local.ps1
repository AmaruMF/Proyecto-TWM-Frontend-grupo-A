param(
    [string]$CredencialesPath = '',
    [switch]$SoloConfigurar
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$projectFile = Join-Path $projectRoot 'TiendaMultiplaza.API.csproj'
[xml]$project = Get-Content -Raw -LiteralPath $projectFile
$secretId = [string]$project.Project.PropertyGroup.UserSecretsId
$secretFile = Join-Path ([Environment]::GetFolderPath('ApplicationData')) "Microsoft\UserSecrets\$secretId\secrets.json"
$settings = if (Test-Path -LiteralPath $secretFile) { Get-Content -Raw -LiteralPath $secretFile | ConvertFrom-Json -AsHashtable } else { @{} }
if (-not $settings['ConnectionStrings:DefaultConnection']) {
    throw 'Configura primero ConnectionStrings:DefaultConnection con dotnet user-secrets o la variable de entorno correspondiente.'
}
if (-not $settings['Jwt:Key']) {
    $jwtKey = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
    dotnet user-secrets set 'Jwt:Key' $jwtKey --project $projectFile | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo guardar la clave JWT.' }
}
if (-not $settings['Bootstrap:Clave']) {
    $adminPassword = 'Local9-' + [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    dotnet user-secrets set 'Bootstrap:Clave' $adminPassword --project $projectFile | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo guardar la clave inicial.' }
} else { $adminPassword = [string]$settings['Bootstrap:Clave'] }
$adminRun = if ($settings['Bootstrap:Run']) { [string]$settings['Bootstrap:Run'] } else { 'ADMINLOCAL' }
if (-not $CredencialesPath) { $CredencialesPath = Join-Path $projectRoot '.local\Acceso-local.txt' }
$parent = Split-Path -Parent ([IO.Path]::GetFullPath($CredencialesPath))
New-Item -ItemType Directory -Path $parent -Force | Out-Null
@"
ACCESO INICIAL A TIENDA MULTIPLAZA

Swagger: http://localhost:5079/swagger
Usuario (run): $adminRun
Clave inicial: $adminPassword

En Swagger, usa POST /api/auth/login con run y clave.
Copia accessToken y pégalo en Authorize.
Puedes cambiar la contraseña en PUT /api/auth/clave; después debes iniciar sesión otra vez.
Esta clave corresponde a la creación inicial; reejecutar el script no restablece una clave cambiada.
Este archivo contiene una credencial local. No debe incorporarse al repositorio ni compartirse.
"@ | Set-Content -Encoding utf8 -LiteralPath $CredencialesPath
Write-Output "Configuración local preparada. Credenciales iniciales en: $CredencialesPath"
if (-not $SoloConfigurar) {
    Push-Location $projectRoot
    try {
        dotnet run --no-build --launch-profile http -- --inicializar-db
        if ($LASTEXITCODE -ne 0) { throw 'Falló la inicialización de la base.' }
    } finally { Pop-Location }
}
