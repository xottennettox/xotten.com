
param(
  [string]$RepoPath = "F:\Xotten.com"
)
if (-not (Test-Path $RepoPath)) {
  Write-Host "RepoPath not found: $RepoPath" -ForegroundColor Red
  exit 1
}
Set-Location $RepoPath
npm run dev
