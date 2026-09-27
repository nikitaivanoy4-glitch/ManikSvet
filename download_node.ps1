$tools = "C:\Users\Nikita\.tools"
if (!(Test-Path $tools)) { New-Item -ItemType Directory -Path $tools }
$zip = "$tools\node.zip"
$target = "$tools\node-v20.11.1-win-x64\node.exe"

if (!(Test-Path $target)) {
    Write-Host "Downloading Node.js..."
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip" -OutFile $zip
    Write-Host "Unpacking Node.js..."
    Expand-Archive -Path $zip -DestinationPath $tools -Force
    Remove-Item $zip
}
Write-Host "Node.js ready at C:\Users\Nikita\.tools\node-v20.11.1-win-x64\node.exe"
