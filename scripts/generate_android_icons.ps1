Add-Type -AssemblyName System.Drawing

$projectRoot = Get-Location
$sourceIconPath = Join-Path $projectRoot "public\expenso-icon.png"

if (-not (Test-Path $sourceIconPath)) {
    Write-Error "Source icon not found at: $sourceIconPath"
    exit 1
}

$sourceImg = [System.Drawing.Image]::FromFile($sourceIconPath)
$resPath = Join-Path $projectRoot "android\app\src\main\res"

function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$DestinationPath,
        [bool]$RoundClip = $false
    )

    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    if ($RoundClip) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $Width, $Height)
        $g.SetClip($path)
    }

    $g.DrawImage($Image, 0, 0, $Width, $Height)
    $g.Dispose()

    $bitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Write-Output "Generated: $DestinationPath ($Width x $Height)"
}

function Generate-AdaptiveForeground {
    param(
        [System.Drawing.Image]$Image,
        [int]$CanvasSize,
        [string]$DestinationPath
    )

    $bitmap = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # In Android adaptive icons, safe emblem area is centered at ~68% of canvas
    $iconSize = [int]($CanvasSize * 0.68)
    $offset = [int](($CanvasSize - $iconSize) / 2)

    $g.DrawImage($Image, $offset, $offset, $iconSize, $iconSize)
    $g.Dispose()

    $bitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Write-Output "Generated Adaptive Foreground: $DestinationPath ($CanvasSize x $CanvasSize)"
}

# Icon definitions for each mipmap density
$densities = @(
    @{ Folder = "mipmap-mdpi"; LauncherSize = 48; ForegroundSize = 108 },
    @{ Folder = "mipmap-hdpi"; LauncherSize = 72; ForegroundSize = 162 },
    @{ Folder = "mipmap-xhdpi"; LauncherSize = 96; ForegroundSize = 216 },
    @{ Folder = "mipmap-xxhdpi"; LauncherSize = 144; ForegroundSize = 324 },
    @{ Folder = "mipmap-xxxhdpi"; LauncherSize = 192; ForegroundSize = 432 }
)

foreach ($d in $densities) {
    $targetDir = Join-Path $resPath $d.Folder
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    }

    # Standard ic_launcher.png
    Resize-Image -Image $sourceImg -Width $d.LauncherSize -Height $d.LauncherSize -DestinationPath (Join-Path $targetDir "ic_launcher.png")

    # Round ic_launcher_round.png
    Resize-Image -Image $sourceImg -Width $d.LauncherSize -Height $d.LauncherSize -DestinationPath (Join-Path $targetDir "ic_launcher_round.png") -RoundClip $true

    # Adaptive ic_launcher_foreground.png
    Generate-AdaptiveForeground -Image $sourceImg -CanvasSize $d.ForegroundSize -DestinationPath (Join-Path $targetDir "ic_launcher_foreground.png")
}

# Notification icon in drawable (white silhouette / crisp emblem for Android status bar)
$drawableDir = Join-Path $resPath "drawable"
if (-not (Test-Path $drawableDir)) {
    New-Item -ItemType Directory -Force -Path $drawableDir | Out-Null
}
Resize-Image -Image $sourceImg -Width 96 -Height 96 -DestinationPath (Join-Path $drawableDir "ic_stat_expenso.png")

# Splash screen replacement with sleek dark branding
$splashFiles = Get-ChildItem -Path $resPath -Recurse -Filter "splash.png"
foreach ($splash in $splashFiles) {
    # Generate splash image with centered logo on dark background
    $orig = [System.Drawing.Image]::FromFile($splash.FullName)
    $w = $orig.Width
    $h = $orig.Height
    $orig.Dispose()

    $splashBitmap = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($splashBitmap)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    # Expenso dark slate background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 10, 14, 26))
    $g.FillRectangle($bgBrush, 0, 0, $w, $h)
    $bgBrush.Dispose()

    $logoDim = [Math]::Min($w, $h)
    $logoSize = [int]($logoDim * 0.38)
    if ($logoSize -lt 96) { $logoSize = 96 }
    $posX = [int](($w - $logoSize) / 2)
    $posY = [int](($h - $logoSize) / 2)

    $g.DrawImage($sourceImg, $posX, $posY, $logoSize, $logoSize)
    $g.Dispose()

    $splashBitmap.Save($splash.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
    $splashBitmap.Dispose()
    Write-Output "Updated Splash: $($splash.FullName) ($w x $h)"
}

$sourceImg.Dispose()
Write-Output "All Android icons and splash assets successfully generated!"
