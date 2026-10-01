param([string]$ProjectName = 'paykar_submission_day3')

# Run from the repository root. Uses a NEW Compose volume; never resets the working DB.
$ErrorActionPreference = 'Stop'
if ($ProjectName -notmatch '^paykar_submission_[a-z0-9_]+$') { throw 'Use a name beginning paykar_submission_.' }
if (-not (Test-Path -LiteralPath '.env')) { throw 'Create and configure root .env first.' }
$volumeName = "${ProjectName}_postgres_data"
$existingVolumes = & docker volume ls --format '{{.Name}}'
if ($LASTEXITCODE -ne 0) { throw 'Docker volume listing failed.' }
if ($existingVolumes -contains $volumeName) { throw "Volume $volumeName already exists. Choose a new -ProjectName; existing data is preserved." }
$overrides = @{
    POSTGRES_DB = 'paykar_submission'
    POSTGRES_PORT = '5434'
    API_PORT = '8082'
    WEB_PORT = '3002'
    WEB_ORIGIN = 'http://localhost:3002'
    NEXT_PUBLIC_API_URL = 'http://localhost:8082/api/v1'
}
$previous = @{}
function Invoke-RehearsalCompose {
    param([string[]]$DockerArguments)
    & docker compose --env-file .env -p $ProjectName @DockerArguments
    if ($LASTEXITCODE -ne 0) { throw "Compose command failed: $($DockerArguments -join ' ')" }
}
try {
    foreach ($entry in $overrides.GetEnumerator()) {
        $previous[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, 'Process')
        [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
    }
    Invoke-RehearsalCompose -DockerArguments @('config', '--quiet')
    Invoke-RehearsalCompose -DockerArguments @('up', '--build', '-d', '--wait', '--wait-timeout', '180')
    Invoke-RehearsalCompose -DockerArguments @('exec', '-T', 'api', 'alembic', 'current')
    Invoke-RehearsalCompose -DockerArguments @('exec', '-T', 'api', 'alembic', 'check')
    Invoke-RehearsalCompose -DockerArguments @('exec', '-T', 'api', 'python', '/seed/seed.py')
    Invoke-RehearsalCompose -DockerArguments @('exec', '-T', 'api', 'python', '/seed/seed.py')
    Invoke-RehearsalCompose -DockerArguments @('ps')
    foreach ($path in @('health', 'health/db')) {
        $response = Invoke-WebRequest -UseBasicParsing "http://localhost:8082/api/v1/$path"
        if ($response.StatusCode -ne 200) { throw "Health check failed: $path" }
        Write-Output "$path : HTTP $($response.StatusCode)"
    }
    $catalog = Invoke-RestMethod 'http://localhost:8082/api/v1/products?page_size=48'
    if ($catalog.total -ne 40) { throw 'Unexpected seeded catalog count.' }
    Write-Output "Fresh stack ready: http://localhost:3002 | 40 products | volume $volumeName"
    Write-Output 'Use the README reviewer demo to verify real routing, order creation and receipt reload.'
} finally {
    foreach ($entry in $previous.GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
    }
}
