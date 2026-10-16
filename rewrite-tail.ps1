$path = "d:\zt lounge\zt-lounge-demo\zt-lounge\MEMBERSHIP_UI_DATAFLOW_AUDIT.md"
$lines = Get-Content $path

$heads = @{}
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^## (\d+)\. ') { $heads[[int]$matches[1]] = $i }
}

$sec = @{}
$cur = $null
$curLines = @()
foreach ($l in $lines) {
    if ($l -match '^## (\d+)\. ') {
        if ($cur -ne $null) { $sec[$cur] = $curLines }
        $cur = [int]$matches[1]
        $curLines = @($l)
    } else {
        if ($cur -ne $null) { $curLines += $l }
    }
}
if ($cur -ne $null) { $sec[$cur] = $curLines }

$ordered = @()
foreach ($n in 11,12,13,14,15,16,17,18) { $ordered += ,$sec[$n] }
$newTail = $ordered -join [Environment]::NewLine

$idx = $heads[13]
$cnt = $lines.Count - $idx
for ($i = 0; $i -lt $cnt; $i++) {
    if ($i -lt $newTail.Count) { $lines[$idx + $i] = $newTail[$i] } else { $lines[$idx + $i] = '' }
}
Set-Content -Path $path -Value $lines -Encoding UTF8
Write-Host "TAIL_REORDERED"
