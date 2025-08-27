
param(
  [string]$RepoPath = "F:\Xotten.com",
  [string]$Message = ""
)

if (-not (Test-Path $RepoPath)) {
  Write-Host "RepoPath not found: $RepoPath" -ForegroundColor Red
  exit 1
}

Set-Location $RepoPath

$git = (Get-Command git -ErrorAction SilentlyContinue)
if (-not $git) {
  Write-Host "git not found. Install Git for Windows first." -ForegroundColor Red
  exit 1
}

git add -A | Out-Null

if ([string]::IsNullOrWhiteSpace($Message)) {
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm"
  $Message = "Update site $ts"
}

$changes = git status --porcelain
if ($changes) {
  git commit -m "$Message"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git push
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "✅ Published to Netlify via GitHub." -ForegroundColor Green
} else {
  Write-Host "No changes to commit." -ForegroundColor Yellow
}
