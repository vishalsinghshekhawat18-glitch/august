[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$InputPath,

    [Parameter(Mandatory=$false)]
    [string]$OutputPath,

    [Parameter(Mandatory=$false)]
    [double]$RotateAngle = 0.0,

    [Parameter(Mandatory=$false)]
    [bool]$AutoEditorialCrop = $true,

    [Parameter(Mandatory=$false)]
    [double]$HeadroomCutPercent = 0.05, # percentage of top dead space to trim for portraits

    [Parameter(Mandatory=$false)]
    [string]$Level = "1.5%,98.5%,0.98",

    [Parameter(Mandatory=$false)]
    [string]$SigmoidalContrast = "2.5x50%",

    [Parameter(Mandatory=$false)]
    [string]$Modulate = "102,112,100",

    [Parameter(Mandatory=$false)]
    [string]$Unsharp = "0x1.0+1.2+0.015"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $InputPath)) {
    Write-Error "Input file not found: $InputPath"
    exit 1
}

if (-not $OutputPath) {
    $dir = Split-Path -Parent $InputPath
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($InputPath)
    $ext = [System.IO.Path]::GetExtension($InputPath)
    $outDir = Join-Path $dir "enhanced"
    if (-not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Force -Path $outDir | Out-Null
    }
    $OutputPath = Join-Path $outDir "${baseName}_v1.1_Enhanced${ext}"
}

# 1. Base optical grading command
$magickArgs = @(
    "`"$InputPath`"",
    "-level", $Level,
    "-sigmoidal-contrast", $SigmoidalContrast,
    "-modulate", $Modulate,
    "-unsharp", $Unsharp
)

if ($RotateAngle -ne 0.0) {
    $magickArgs += @("-rotate", $RotateAngle.ToString())
}

if ($AutoEditorialCrop) {
    $tempFile = [System.IO.Path]::GetTempFileName() + ".jpg"
    try {
        $cmd1 = "magick.exe " + ($magickArgs -join " ") + " `"$tempFile`""
        Invoke-Expression $cmd1

        $dimStr = & magick.exe identify -format "%w %h" $tempFile
        $dims = $dimStr.Trim().Split(" ")
        $w = [int]$dims[0]
        $h = [int]$dims[1]

        if ($h -ge $w) {
            # PORTRAIT ORIENTATION: Target 4:5 Aspect Ratio (w : h = 0.8)
            $targetRatio = 0.8
            $currentRatio = [double]$w / [double]$h

            if ($currentRatio -le $targetRatio) {
                # Taller than 4:5 -> crop top headroom
                $newH = [int]($w / $targetRatio)
                $newW = $w
                $offsetY = [int]($h * $HeadroomCutPercent)
                if ($offsetY + $newH -gt $h) { $offsetY = $h - $newH }
                $offsetX = 0
            } else {
                # Wider than 4:5 -> trim sides symmetrically and trim top headroom
                $newH = [int]($h * (1.0 - $HeadroomCutPercent))
                $newW = [int]($newH * $targetRatio)
                if ($newW -gt $w) {
                    $newW = $w
                    $newH = [int]($w / $targetRatio)
                }
                $offsetX = [int](($w - $newW) / 2)
                $offsetY = [int]($h * $HeadroomCutPercent)
                if ($offsetY + $newH -gt $h) { $offsetY = $h - $newH }
            }

            $cropArg = "${newW}x${newH}+${offsetX}+${offsetY}"
            & magick.exe $tempFile -crop $cropArg +repage $OutputPath
        } else {
            # LANDSCAPE ORIENTATION: Preserve wide composition (e.g. groups, vehicles, landscape)
            # Slight cleanup of outer 1% border if rotation occurred
            Copy-Item $tempFile -Destination $OutputPath -Force
        }
    } finally {
        if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
    }
} else {
    $cmd = "magick.exe " + ($magickArgs -join " ") + " `"$OutputPath`""
    Invoke-Expression $cmd
}

Write-Host "Success: $OutputPath"
