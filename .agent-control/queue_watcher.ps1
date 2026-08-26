# WEB FACTOR — Queue Watcher & Autonomous Resume with Execution Bridge (PowerShell Runtime)
param (
    [switch]$SingleRun,
    [switch]$CheckNow,
    [string]$StatePath = "$PSScriptRoot/STATE.md",
    [string]$QueuePath = "$PSScriptRoot/QUEUE.md",
    [string]$LogPath = "$PSScriptRoot/watcher.log",
    [string]$LockPath = "$PSScriptRoot/.claim.lock",
    [string]$SignalPath = "$PSScriptRoot/DISPATCH.json",
    [string]$ConfigPath = "$PSScriptRoot/runner_config.json"
)

function Write-WatcherLog([string]$Message) {
    $timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $logEntry = "[$timestamp] [QUEUE_WATCHER_PS] $Message"
    try {
        Add-Content -Path $LogPath -Value $logEntry -Encoding UTF8
    } catch {}
    return $logEntry
}

function Acquire-ClaimLock([string]$TaskId, [string]$Path, [int]$TimeoutMs = 30000) {
    if (Test-Path $Path) {
        try {
            $lockData = Get-Content -Path $Path -Raw | ConvertFrom-Json
            $age = ((Get-Date).ToUniversalTime() - [DateTime]::Parse($lockData.timestamp)).TotalMilliseconds
            if ($age -lt $TimeoutMs -and $lockData.taskId -eq $TaskId) {
                Write-WatcherLog "Lock already held for task $TaskId by PID $($lockData.pid)."
                return $false
            }
        } catch {}
    }

    $claim = @{
        taskId = $TaskId
        pid = $PID
        timestamp = (Get-Date).ToString("o")
    }

    try {
        $claim | ConvertTo-Json | Set-Content -Path $Path -Encoding UTF8
        return $true
    } catch {
        Write-WatcherLog "Failed to acquire lock: $_"
        return $false
    }
}

function Release-ClaimLock([string]$Path) {
    try {
        if (Test-Path $Path) {
            Remove-Item -Path $Path -Force -ErrorAction SilentlyContinue
        }
    } catch {}
}

function Invoke-AgentExecutionBridge([hashtable]$Task, [string]$TargetSignalPath) {
    $signalPayload = @{
        event = "DISPATCH_ORCHESTRATOR"
        taskId = $Task.Id
        taskType = $Task.Type
        timestamp = (Get-Date).ToString("o")
        state = "IN_PROGRESS"
        action = "Start $($Task.Id) with Developer"
        runtimeIntegrationStatus = "EVENT_DISPATCHED_AWAITING_RUNNER_INTEGRATION"
    }

    $signalPayload | ConvertTo-Json | Set-Content -Path $TargetSignalPath -Encoding UTF8
    Write-WatcherLog "Written dispatch signal to $TargetSignalPath for task $($Task.Id)"
    return @{
        Dispatched = $true
        Strategy = "signal"
        TaskId = $Task.Id
        SignalPath = $TargetSignalPath
    }
}

function Get-StateData([string]$Path) {
    if (-not (Test-Path $Path)) { return $null }
    $content = Get-Content -Path $Path -Raw
    $state = @{
        CurrentTask = ""
        State = ""
        Blocker = ""
    }
    if ($content -match 'CURRENT_TASK:\s*(.+)') { $state.CurrentTask = $matches[1].Trim() }
    if ($content -match 'STATE:\s*(.+)') { $state.State = $matches[1].Trim() }
    if ($content -match 'BLOCKER:\s*(.+)') { $state.Blocker = $matches[1].Trim() }
    return $state
}

function Get-QueueTasks([string]$Path) {
    if (-not (Test-Path $Path)) { return @() }
    $lines = Get-Content -Path $Path
    $tasks = @()
    $current = $null

    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed -match '^#{2,3}\s+([A-Za-z0-9_\-\.]+)') {
            $id = $matches[1]
            if ($id -notmatch '(?i)queue|active') {
                if ($current) { $tasks += $current }
                $current = @{
                    Id = $id
                    Status = 'UNKNOWN'
                    Type = 'UNKNOWN'
                    Dependencies = @()
                }
                continue
            }
        }
        if (-not $current) { continue }
        if ($trimmed -match '^STATUS:\s*(.+)') {
            $current.Status = $matches[1].Trim()
        } elseif ($trimmed -match '^TYPE:\s*(.+)') {
            $current.Type = $matches[1].Trim()
        } elseif ($trimmed -match '^DEPENDENCIES:\s*(.+)') {
            $depStr = $matches[1].Trim()
            if ($depStr -and $depStr -ne 'NONE') {
                $current.Dependencies = @($depStr -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
            }
        }
    }
    if ($current) { $tasks += $current }
    return $tasks
}

function Invoke-QueueEvaluation {
    $state = Get-StateData -Path $StatePath
    if (-not $state -or $state.State -ne 'WAITING') {
        return @{ Action = 'NONE'; Reason = "STATE_NOT_WAITING ($($state.State))" }
    }

    $tasks = Get-QueueTasks -Path $QueuePath
    $completed = @($tasks | Where-Object { $_.Status -eq 'COMPLETE' } | ForEach-Object { $_.Id })

    $nextTask = $null
    foreach ($t in $tasks) {
        if ($t.Status -eq 'READY') {
            $depsOk = $true
            foreach ($dep in $t.Dependencies) {
                if ($completed -notcontains $dep) {
                    $depsOk = $false
                    break
                }
            }
            if ($depsOk) {
                $nextTask = $t
                break
            }
        }
    }

    if (-not $nextTask) {
        return @{ Action = 'NONE'; Reason = 'NO_EXECUTABLE_READY_TASKS' }
    }

    $lockOk = Acquire-ClaimLock -TaskId $nextTask.Id -Path $LockPath
    if (-not $lockOk) {
        return @{ Action = 'NONE'; Reason = "TASK_ALREADY_CLAIMED ($($nextTask.Id))" }
    }

    try {
        $newState = @"
# WEB FACTOR — AGENT CONTROL STATE

SYSTEM: WEB FACTOR AGENT CONTROL
VERSION: 0.1
MODE: TEST

CURRENT_TASK: $($nextTask.Id)
STATE: IN_PROGRESS

LAST_AGENT: ORCHESTRATOR
RETRY_COUNT: 0

DEVELOPER_STATUS: NOT_STARTED
AUDITOR_STATUS: NOT_STARTED
ARCHITECT_STATUS: NOT_REQUIRED

LAST_HANDOFF: QUEUE_WATCHER_AUTO_RESUME
LAST_DECISION: RESUME_FROM_WAITING
BLOCKER: NONE

NEXT_ACTION:
Start $($nextTask.Id) with Developer.

HUMAN_REVIEW_REQUIRED: NO
"@

        Set-Content -Path $StatePath -Value $newState -Encoding UTF8
        Write-WatcherLog "Resumed Orchestrator from WAITING for task $($nextTask.Id)."

        $dispatch = Invoke-AgentExecutionBridge -Task $nextTask -TargetSignalPath $SignalPath

        return @{
            Action = 'RESUMED'
            Task = $nextTask.Id
            PreviousState = 'WAITING'
            NewState = 'IN_PROGRESS'
            DispatchResult = $dispatch
        }
    } finally {
        Release-ClaimLock -Path $LockPath
        Write-WatcherLog "Released lock for $($nextTask.Id)."
    }
}

if ($SingleRun -or $CheckNow) {
    $result = Invoke-QueueEvaluation
    $result | ConvertTo-Json
    exit 0
}

Write-Host "[QUEUE_WATCHER_PS] Continuous watch active..."
while ($true) {
    Start-Sleep -Seconds 1
    $res = Invoke-QueueEvaluation
    if ($res.Action -eq 'RESUMED') {
        Write-Host "[QUEUE_WATCHER_PS] $($res.Task) automatically resumed and dispatched."
    }
}
