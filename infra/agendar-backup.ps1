<#
.SYNOPSIS
  Agenda a cópia de segurança diária do banco do Coral.

.DESCRIPTION
  Cria uma tarefa no Agendador do Windows que roda `infra/backup.mjs` todo dia
  de madrugada. A tarefa roda mesmo com o computador recém-ligado (se a hora
  passou enquanto ele estava desligado, ela executa assim que possível).

  Precisa ser executado uma única vez, como Administrador:

      powershell -ExecutionPolicy Bypass -File infra\agendar-backup.ps1

  Para remover depois:

      powershell -ExecutionPolicy Bypass -File infra\agendar-backup.ps1 -Remover

.PARAMETER Hora
  Horário da execução, em HH:mm. Padrão 03:30 — fora do horário de expediente,
  quando ninguém está mexendo no painel.

.PARAMETER Remover
  Apaga a tarefa em vez de criá-la.
#>
param(
  [string]$Hora = '03:30',
  [switch]$Remover
)

$ErrorActionPreference = 'Stop'
$NOME = 'Coral - backup do banco'

if ($Remover) {
  if (Get-ScheduledTask -TaskName $NOME -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $NOME -Confirm:$false
    Write-Host "Tarefa removida."
  } else {
    Write-Host "Nao havia tarefa agendada."
  }
  exit 0
}

# Caminhos absolutos: a tarefa roda sem diretorio de trabalho garantido.
$raiz = Split-Path -Parent $PSScriptRoot
$script = Join-Path $PSScriptRoot 'backup.mjs'

if (-not (Test-Path $script)) {
  Write-Error "Nao encontrei $script"
  exit 1
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  Write-Error "Node.js nao esta no PATH. Instale ou ajuste o PATH antes de agendar."
  exit 1
}

$acao = New-ScheduledTaskAction -Execute $node -Argument "`"$script`"" -WorkingDirectory $raiz

$gatilho = New-ScheduledTaskTrigger -Daily -At $Hora

# StartWhenAvailable: se o micro estava desligado na hora marcada, roda depois.
# DontStopOnIdleEnd / AllowStartIfOnBatteries: nao aborta por economia de energia.
$config = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -DontStopOnIdleEnd `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

if (Get-ScheduledTask -TaskName $NOME -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $NOME -Confirm:$false
}

Register-ScheduledTask `
  -TaskName $NOME `
  -Action $acao `
  -Trigger $gatilho `
  -Settings $config `
  -Description 'Copia de seguranca diaria do banco do site da Coral (infra/backup.mjs).' `
  | Out-Null

Write-Host "Tarefa agendada para todo dia as $Hora."
Write-Host ""
Write-Host "Conferir:   Get-ScheduledTask -TaskName '$NOME'"
Write-Host "Rodar ja:   Start-ScheduledTask -TaskName '$NOME'"
Write-Host "Historico:  Get-ScheduledTaskInfo -TaskName '$NOME'"
