<#
.SYNOPSIS
    Применяет правила подмены названий (из data/name-overrides.json) к стилям в styles/.
.DESCRIPTION
    Выполняет поиск/замену в текстовых полях (в первую очередь text-field) и по всему JSON.
    Это позволяет показывать "Астана" вместо "Нур-Султан" и т.п. без изменения MBTiles.
#>
$ErrorActionPreference = "Stop"

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $baseDir

$overridesFile = Join-Path $baseDir "data\name-overrides.json"
$stylesDir = Join-Path $baseDir "styles"

if (-not (Test-Path $overridesFile)) {
    Write-Error "Overrides file not found: $overridesFile"
    exit 1
}

$overrides = (Get-Content $overridesFile -Raw | ConvertFrom-Json).overrides

if (-not $overrides -or $overrides.Count -eq 0) {
    Write-Host "No overrides defined. Nothing to do." -ForegroundColor Yellow
    exit 0
}

Write-Host "Loaded $($overrides.Count) override rule(s)."

function Replace-InObject($obj, $old, $new) {
    if ($obj -is [string]) {
        return $obj -replace [regex]::Escape($old), $new
    } elseif ($obj -is [System.Collections.IEnumerable] -and -not ($obj -is [string])) {
        $newList = @()
        foreach ($item in $obj) {
            $newList += Replace-InObject $item $old $new
        }
        return $newList
    } elseif ($obj -is [pscustomobject]) {
        $newObj = [ordered]@{}
        foreach ($prop in $obj.PSObject.Properties) {
            $newObj[$prop.Name] = Replace-InObject $prop.Value $old $new
        }
        return [pscustomobject]$newObj
    }
    return $obj
}

function Apply-NameOverrideToTextField($textField, $overrides) {
    # Если text-field - это coalesce для имён (["coalesce", ["get","name:ru"], ...])
    # то оборачиваем первые два get'а (name:ru и name) в match-выражения для подмены.
    if ($textField -is [System.Collections.IEnumerable] -and -not ($textField -is [string])) {
        $arr = @($textField)
        if ($arr.Count -gt 0 -and $arr[0] -eq "coalesce") {
            $newArr = @("coalesce")
            for ($i = 1; $i -lt $arr.Count; $i++) {
                $part = $arr[$i]
                $handled = $false
                if ($part -is [System.Collections.IEnumerable] -and $part.Count -eq 2 -and $part[0] -eq "get") {
                    $prop = $part[1]
                    if ($prop -eq "name:ru" -or $prop -eq "name") {
                        # Строим match для всех оверрайдов
                        $matchExpr = @("match", @("get", $prop))
                        foreach ($rule in $overrides) {
                            $display = $rule.display
                            if ($prop -eq "name:ru" -and $rule.match.'name:ru') {
                                foreach ($old in $rule.match.'name:ru') {
                                    $matchExpr += $old
                                    $matchExpr += $display
                                }
                            }
                            if ($prop -eq "name" -and $rule.match.name) {
                                foreach ($old in $rule.match.name) {
                                    $matchExpr += $old
                                    $matchExpr += $display
                                }
                            }
                        }
                        $matchExpr += @("get", $prop)   # fallback
                        $newArr += ,$matchExpr
                        $handled = $true
                    }
                }
                if (-not $handled) {
                    $newArr += ,$part
                }
            }
            return $newArr
        }
    }
    return $textField
}

function Apply-OverridesToStyle($style, $overrides) {
    if ($style -is [System.Collections.IEnumerable] -and -not ($style -is [string])) {
        if ($style -is [System.Collections.IList]) {
            $newList = @()
            foreach ($item in $style) {
                $newList += Apply-OverridesToStyle $item $overrides
            }
            return $newList
        }
    }
    if ($style -is [pscustomobject]) {
        $newObj = [ordered]@{}
        foreach ($prop in $style.PSObject.Properties) {
            if ($prop.Name -eq "text-field") {
                $newObj[$prop.Name] = Apply-NameOverrideToTextField $prop.Value $overrides
            } else {
                $newObj[$prop.Name] = Apply-OverridesToStyle $prop.Value $overrides
            }
        }
        return [pscustomobject]$newObj
    }
    if ($style -is [string]) {
        # fallback на старую строковую замену (для статических текстов)
        $result = $style
        foreach ($rule in $overrides) {
            $display = $rule.display
            if ($rule.match.name) {
                foreach ($oldName in $rule.match.name) {
                    $result = $result -replace [regex]::Escape($oldName), $display
                }
            }
            if ($rule.match.'name:ru') {
                foreach ($oldName in $rule.match.'name:ru') {
                    $result = $result -replace [regex]::Escape($oldName), $display
                }
            }
        }
        return $result
    }
    return $style
}

Get-ChildItem $stylesDir -Filter *.json | ForEach-Object {
    $stylePath = $_.FullName
    Write-Host "Processing $($_.Name)..." -NoNewline

    try {
        $style = Get-Content $stylePath -Raw | ConvertFrom-Json

        $style = Apply-OverridesToStyle $style $overrides

        $style | ConvertTo-Json -Depth 50 | Set-Content $stylePath -Encoding UTF8
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERROR: $_" -ForegroundColor Red
    }
}

Write-Host "Name overrides applied to all styles." -ForegroundColor Green
Write-Host "Restart the container: docker compose restart" -ForegroundColor Yellow