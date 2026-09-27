$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$dir = "C:\Users\Nikita\.tools"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir }
$exe = "$dir\cloudflared.exe"

Write-Host "Downloading cloudflared.exe..."
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/download/2024.2.1/cloudflared-windows-amd64.exe" -OutFile $exe
Write-Host "Done! Size:" (Get-Item $exe).Length
