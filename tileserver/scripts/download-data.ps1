<#
.SYNOPSIS
    Скачивает шрифты (test_data.zip) и векторные MBTiles для TileServer GL.
.DESCRIPTION
    Поддерживаемые регионы: demo, central-america, europe, asia, planet
    Шрифты скачиваются только если папка fonts/ пустая или не содержит Open Sans.
    MBTiles сохраняется как data/map.mbtiles (с поддержкой докачки).
#>
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("demo","central-america","europe","asia","planet")]
    [string]$Region = "demo"
)

$ErrorActionPreference = "Stop"
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $baseDir

$fontsDir = Join-Path $baseDir "fonts"
$dataDir = Join-Path $baseDir "data"
$testDataZip = Join-Path $baseDir "test_data.zip"

# URLs from tileserver_start_guide.md
$testDataUrl = "https://github.com/maptiler/tileserver-gl/releases/download/v1.3.0/test_data.zip"

$mbtilesUrls = @{
    "demo"            = "https://github.com/maptiler/tileserver-gl/releases/download/v1.3.0/zurich_switzerland.mbtiles"
    "central-america" = "https://www.limaps.org/MBTiles/2024-10-08-central-america.osm.mbtiles"
    "europe"          = "https://www.limaps.org/MBTiles/2024-10-08-europe.osm.mbtiles"
    "asia"            = "https://www.limaps.org/MBTiles/2024-10-08-asia.osm.mbtiles"
    "planet"          = "https://object.data.gouv.fr/openmaptiles/planet.mbtiles"
}

$mbtilesFile = Join-Path $dataDir "map.mbtiles"

# 1. Скачиваем шрифты, если нужно
$needsFonts = -not (Test-Path (Join-Path $fontsDir "Open Sans Regular")) -or 
              -not (Get-ChildItem $fontsDir -Recurse -Filter "*.pbf" -ErrorAction SilentlyContinue)

if ($needsFonts) {
    Write-Host "Downloading fonts (test_data.zip)..." -ForegroundColor Cyan
    curl.exe -L -o $testDataZip $testDataUrl

    Write-Host "Extracting fonts..."
    # test_data.zip содержит папку fonts/ на верхнем уровне
    Expand-Archive -Path $testDataZip -DestinationPath $baseDir -Force

    # Иногда архив распаковывается в подкаталог — подстрахуемся
    $extractedFonts = Join-Path $baseDir "fonts"
    if (Test-Path $extractedFonts) {
        Write-Host "Fonts extracted to $extractedFonts"
    }

    Remove-Item $testDataZip -Force -ErrorAction SilentlyContinue
    Write-Host "Fonts ready." -ForegroundColor Green
} else {
    Write-Host "Fonts already present, skipping download." -ForegroundColor Yellow
}

# 2. Скачиваем MBTiles
$url = $mbtilesUrls[$Region]
Write-Host "Downloading MBTiles for region '$Region' from $url ..." -ForegroundColor Cyan
Write-Host "Target: $mbtilesFile (resume supported)"

# Создаём папку data на всякий случай
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

curl.exe -L -C - -o $mbtilesFile $url

if (Test-Path $mbtilesFile) {
    $size = (Get-Item $mbtilesFile).Length / 1MB
    Write-Host "MBTiles downloaded: $([math]::Round($size,1)) MB -> $mbtilesFile" -ForegroundColor Green
} else {
    Write-Error "Failed to download MBTiles"
}

# 3. Применяем name overrides (если скрипт есть)
$applyScript = Join-Path $baseDir "scripts\apply-name-overrides.ps1"
if (Test-Path $applyScript) {
    Write-Host "Applying name overrides..."
    & $applyScript
}

Write-Host "Done. Now you can run: docker compose up -d" -ForegroundColor Green
Write-Host "Open: http://localhost:8080  (style: borders-labels or basic)" -ForegroundColor Green