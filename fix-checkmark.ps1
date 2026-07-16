$path = Resolve-Path "components\binder\Binder.tsx"
$utf8 = [System.Text.Encoding]::UTF8
$content = [System.IO.File]::ReadAllText($path, $utf8)

# Fix "Mark as collected" button - replace anything after "collected" before the closing quote
$checkmark = $utf8.GetString([byte[]]@(0xE2, 0x9C, 0x93))
$fixed = [regex]::Replace($content, '("Mark as collected\s*)[^"]*(")', "`$1$checkmark`$2")

[System.IO.File]::WriteAllText($path, $fixed, $utf8)
Write-Host "Done"
