# Stops everything started by start.ps1.
# Usage:  .\stop.ps1          stop the 5 services
#         .\stop.ps1 -Db      also stop the Docker MongoDB container
param([switch]$Db)
Set-Location $PSScriptRoot
$pidFile = Join-Path $PSScriptRoot '.run\pids.json'

# 1. Kill the process trees we recorded (npm -> node -> vite/nodemon children)
if (Test-Path $pidFile) {
  $pids = Get-Content $pidFile | ConvertFrom-Json
  foreach ($prop in $pids.PSObject.Properties) {
    taskkill /PID $prop.Value /T /F 2>$null | Out-Null
    Write-Host "Stopped $($prop.Name) (PID $($prop.Value))"
  }
  Remove-Item $pidFile -Force
}

# 2. Safety net: anything still listening on our ports (only node processes)
foreach ($port in 5001, 5002, 5173, 5174, 5500) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -match '^node') {
      taskkill /PID $proc.Id /T /F 2>$null | Out-Null
      Write-Host "Freed port $port (PID $($proc.Id))"
    }
  }
}

if ($Db -and (Get-Command docker -ErrorAction SilentlyContinue)) { docker compose down }
Write-Host 'Stopped.' -ForegroundColor Green
