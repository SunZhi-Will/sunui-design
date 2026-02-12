# Close ALL open pull requests.
# Requires: $env:GITHUB_TOKEN with repo scope (Issues: read & write)
# Usage: .\scripts\close-open-prs.ps1

$ErrorActionPreference = "Stop"
$owner = "SunZhi-Will"
$repo = "sunui-design"
$headers = @{
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}
if ($env:GITHUB_TOKEN) {
    $headers["Authorization"] = "Bearer $env:GITHUB_TOKEN"
} else {
    Write-Error "Set GITHUB_TOKEN environment variable (repo scope) and run again."
    exit 1
}

# Get all open PRs
$prs = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/pulls?state=open&per_page=100" -Headers $headers
if (-not $prs -or $prs.Count -eq 0) {
    Write-Host "No open PRs."
    exit 0
}
if (-not $prs.Count) { $prs = @($prs) }

Write-Host "Found $($prs.Count) open PR(s). Closing..."
$closeBody = @{ state = "closed" } | ConvertTo-Json
foreach ($pr in $prs) {
    $num = $pr.number
    try {
        Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/issues/$num" -Method Patch -Headers $headers -Body $closeBody -ContentType "application/json" | Out-Null
        Write-Host "  PR #$num closed."
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "  PR #$num failed: $code"
    }
}
Write-Host "Done."
