# Strum Taxi - запуск усіх частин проекту в окремих вікнах
# Запуск: .\scripts\start-all.ps1  або  powershell -File scripts/start-all.ps1

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Strum Taxi - запуск проекту..." -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:4000" -ForegroundColor Gray
Write-Host "Admin:    http://localhost:5173" -ForegroundColor Gray
Write-Host "Client:   Expo (порт 8081)" -ForegroundColor Gray
Write-Host "Driver:   Expo (порт 8082)" -ForegroundColor Gray
Write-Host ""

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run backend"
Start-Sleep -Seconds 1

# Web Admin
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run admin"
Start-Sleep -Seconds 1

# App Client (Expo)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run client"
Start-Sleep -Seconds 1

# App Driver (Expo)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run driver"

Write-Host "Усі сервіси запущено в окремих вікнах." -ForegroundColor Green
Write-Host "Для Expo (client/driver) оберіть платформу: a - Android, i - iOS, w - Web" -ForegroundColor Cyan
