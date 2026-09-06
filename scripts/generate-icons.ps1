Add-Type -AssemblyName System.Drawing

function New-Icon {
    param([int]$Size, [string]$Path, [bool]$Maskable)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $bg = [System.Drawing.Color]::FromArgb(255, 99, 102, 241)

    if ($Maskable) {
        $g.Clear($bg)
    } else {
        $g.Clear([System.Drawing.Color]::White)
        $pad = [int]($Size * 0.18)
        $rect = New-Object System.Drawing.Rectangle($pad, $pad, ($Size - 2 * $pad), ($Size - 2 * $pad))
        $brush = New-Object System.Drawing.SolidBrush($bg)
        $g.FillRectangle($brush, $rect)
        $brush.Dispose()
    }

    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [single]($Size * 0.09))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($pen, [single]($Size * 0.30), [single]($Size * 0.52), [single]($Size * 0.44), [single]($Size * 0.66))
    $g.DrawLine($pen, [single]($Size * 0.44), [single]($Size * 0.66), [single]($Size * 0.72), [single]($Size * 0.34))
    $pen.Dispose()

    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
New-Icon -Size 192 -Path (Join-Path $root "public\icons\icon-192.png") -Maskable $false
New-Icon -Size 512 -Path (Join-Path $root "public\icons\icon-512.png") -Maskable $false
New-Icon -Size 512 -Path (Join-Path $root "public\icons\icon-maskable-512.png") -Maskable $true
Write-Output "Icons generated."
