# Starts MongoDB check, installs deps (first time), creates .env files, seeds (first time) and launches all 5 services.
# Usage:  .\start.ps1          (or double-click start.cmd)
#         .\start.ps1 -Seed    (force re-seed)
param([switch]$Seed)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$run = Join-Path $PSScriptRoot '.run'; $logs = Join-Path $run 'logs'
New-Item -ItemType Directory -Force $logs | Out-Null

function Test-Port([int]$Port) {
  $c = New-Object Net.Sockets.TcpClient
  try { $c.Connect('127.0.0.1', $Port); return $true } catch { return $false } finally { $c.Close() }
}

# 1. Node
$nodeMajor = [int](node -v).TrimStart('v').Split('.')[0]
if ($nodeMajor -lt 20) { throw "Node 20+ required (found $(node -v))" }

# 2. Ports must be free
$ports = @{ 'task-api' = 5001; 'task-web' = 5173; 'store-api' = 5002; 'store-web' = 5174; 'portfolio' = 5500 }
$busy = $ports.GetEnumerator() | Where-Object { Test-Port $_.Value }
if ($busy) {
  Write-Host "These ports are already in use: $(($busy | ForEach-Object { $_.Value }) -join ', ')" -ForegroundColor Yellow
  throw 'Run .\stop.ps1 first (or free the ports).'
}

# 3. MongoDB
if (-not (Test-Port 27017)) {
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host 'MongoDB not running - starting it with Docker...'
    docker compose up -d mongo
    for ($i = 0; $i -lt 30 -and -not (Test-Port 27017); $i++) { Start-Sleep 1 }
  }
  if (-not (Test-Port 27017)) { throw 'MongoDB is not reachable on 127.0.0.1:27017. Start MongoDB (service or Docker) and retry.' }
}
Write-Host 'MongoDB OK' -ForegroundColor Green

# 4. Dependencies
if (-not (Test-Path 'node_modules')) {
  Write-Host 'Installing dependencies (first run can take several minutes)...'
  npm install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
}

# 5. .env files (never overwrites existing ones)
foreach ($d in 'apps/task-dashboard/server', 'apps/task-dashboard/client', 'apps/store/server', 'apps/store/client') {
  $env = Join-Path $d '.env'
  if (-not (Test-Path $env)) {
    $lines = Get-Content (Join-Path $d '.env.example')
    if ($d -eq 'apps/store/server') {
      $jwt = node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
      $lines = $lines -replace '^JWT_SECRET=.*$', "JWT_SECRET=$jwt"
    }
    Set-Content $env $lines
    Write-Host "Created $env"
  }
}

# 6. Seed on first run (or with -Seed)
$marker = Join-Path $run 'seeded'
if ($Seed -or -not (Test-Path $marker)) {
  Write-Host 'Seeding sample tasks and products...'
  npm run seed
  if ($LASTEXITCODE -ne 0) { throw 'seed failed' }
  Set-Content $marker (Get-Date)
}

# 7. Launch services in the background, logs in .run\logs
$services = @(
  @{ n = 'task-api';   w = 'apps/task-dashboard/server' },
  @{ n = 'task-web';   w = 'apps/task-dashboard/client' },
  @{ n = 'store-api';  w = 'apps/store/server' },
  @{ n = 'store-web';  w = 'apps/store/client' },
  @{ n = 'portfolio';  w = 'apps/portfolio' }
)
$pids = @{}
foreach ($s in $services) {
  $p = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev', '-w', $s.w) -WorkingDirectory $PSScriptRoot `
        -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $logs "$($s.n).out.log") -RedirectStandardError (Join-Path $logs "$($s.n).err.log")
  $pids[$s.n] = $p.Id
}
$pids | ConvertTo-Json | Set-Content (Join-Path $run 'pids.json')

# 8. Wait until everything answers
Write-Host 'Waiting for services...'
$deadline = (Get-Date).AddSeconds(120)
$pending = @($ports.Keys)
while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
  $pending = @($pending | Where-Object { -not (Test-Port $ports[$_]) })
  if ($pending.Count) { Start-Sleep 2 }
}
if ($pending.Count) {
  Write-Host "NOT UP: $($pending -join ', ') - check .run\logs\<name>.err.log / .out.log" -ForegroundColor Red
} else {
  Write-Host ''
  Write-Host 'All services are up:' -ForegroundColor Green
}
Write-Host '  Portfolio        http://localhost:5500'
Write-Host '  Task dashboard   http://localhost:5173   (API http://localhost:5001/api)'
Write-Host '  Store            http://localhost:5174   (API http://localhost:5002/api)'
Write-Host '  Logs             .run\logs'
Write-Host '  Stop everything  .\stop.ps1'
$sk = (Get-Content 'apps/store/server/.env' | Where-Object { $_ -match '^STRIPE_SECRET_KEY=' }) -replace '^STRIPE_SECRET_KEY=', ''
if ($sk -notmatch '^sk_(test|live)_[A-Za-z0-9]{10,}') {
  Write-Host 'Note: no Stripe key configured - browsing, login and cart work, but checkout/payment will not.' -ForegroundColor Yellow
}
