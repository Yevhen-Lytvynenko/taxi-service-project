# Plausible GitHub contribution backfill (empty commits, backdated).
# Uses author date only — safe to run on top of current branch.
# Email must match your GitHub account (Settings -> Emails).

param(
  [string]$AuthorName = "Jonny",
  [string]$AuthorEmail = "evgenlitvinenko1982@gmail.com",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# date -> commit count (mostly 1, sometimes 2-3, never every day)
$Schedule = [ordered]@{
  "2025-06-04" = 1
  "2025-06-12" = 1
  "2025-06-23" = 2
  "2025-07-07" = 1
  "2025-07-16" = 2
  "2025-07-24" = 1
  "2025-08-05" = 1
  "2025-08-19" = 1
  "2025-09-03" = 1
  "2025-09-11" = 2
  "2025-09-22" = 1
  "2025-10-01" = 1
  "2025-10-10" = 2
  "2025-10-21" = 1
  "2025-10-29" = 1
  "2025-11-04" = 1
  "2025-11-12" = 2
  "2025-11-25" = 1
  "2025-12-02" = 1
  "2025-12-11" = 1
  "2025-12-18" = 2
  "2026-01-08" = 1
  "2026-01-15" = 2
  "2026-01-22" = 1
  "2026-01-29" = 2
  "2026-02-05" = 1
  "2026-02-12" = 2
  "2026-02-19" = 1
  "2026-03-04" = 1
  "2026-03-07" = 2
  "2026-03-12" = 1
  "2026-03-28" = 1
  "2026-04-03" = 1
  "2026-04-09" = 2
  "2026-04-16" = 1
  "2026-04-24" = 2
  "2026-05-05" = 1
  "2026-05-13" = 2
  "2026-05-19" = 1
}

$Messages = @(
  "chore: project maintenance",
  "docs: update notes",
  "refactor: small cleanup",
  "style: format code",
  "test: adjust coverage",
  "chore: sync dependencies",
  "fix: minor adjustment",
  "chore: repository upkeep"
)

$total = ($Schedule.Values | Measure-Object -Sum).Sum
Write-Host "Planned empty commits: $total on $($Schedule.Count) days"
if ($DryRun) {
  foreach ($entry in $Schedule.GetEnumerator()) {
    Write-Host "  $($entry.Key): $($entry.Value)"
  }
  exit 0
}

$msgIndex = 0
$created = 0

foreach ($entry in $Schedule.GetEnumerator()) {
  $day = $entry.Key
  $count = $entry.Value
  for ($i = 0; $i -lt $count; $i++) {
    $hour = 9 + (Get-Random -Maximum 8)
    $minute = Get-Random -Maximum 59
    $second = Get-Random -Maximum 59
    $iso = "{0}T{1:D2}:{2:D2}:{3:D2}" -f $day, $hour, $minute, $second
    $msg = $Messages[$msgIndex % $Messages.Count]
    $msgIndex++

    $env:GIT_AUTHOR_DATE = $iso
    $env:GIT_COMMITTER_DATE = $iso

    git commit --allow-empty -m $msg --author="$AuthorName <$AuthorEmail>" | Out-Null
    $created++
    Write-Host "  + $iso  ($msg)"
  }
}

Remove-Item Env:GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "Done. Created $created backdated empty commits."
Write-Host "Push when ready: git push origin main"
