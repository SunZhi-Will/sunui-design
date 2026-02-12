# Close all open PRs: merge PR #25 (next 15.3.8), close PR #26 (next 16 - declined).
# Requires: $env:GITHUB_TOKEN with repo scope
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

# Merge PR #25 (next 15.3.8 security upgrade)
try {
    $mergeBody = @{ commit_title = "Merge pull request #25 from SunZhi-Will/snyk-fix - next 15.3.8" } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/pulls/25/merge" -Method Post -Headers $headers -Body $mergeBody -ContentType "application/json"
    Write-Host "PR #25 merged."
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 405) {
        Write-Host "PR #25: already merged or not mergeable (405)."
    } else {
        Write-Host "PR #25 merge failed: $_"
    }
}

# Close PR #26 (next 16 - we stay on 15.x)
try {
    $closeBody = @{ state = "closed" } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/issues/26" -Method Patch -Headers $headers -Body $closeBody -ContentType "application/json"
    Write-Host "PR #26 closed."
} catch {
    Write-Host "PR #26 close failed: $_"
}

Write-Host "Done."
