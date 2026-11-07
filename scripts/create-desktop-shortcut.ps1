$desktopPath = [Environment]::GetFolderPath('Desktop')
$targetExe = "D:\sharief\mouse\release\win-unpacked\MultiLaptop Mouse Controller.exe"
$workingDir = "D:\sharief\mouse\release\win-unpacked"
$iconPath = "D:\sharief\mouse\resources\icon.ico"

$wshShell = New-Object -ComObject WScript.Shell

# Primary Desktop path
$shortcutFile = Join-Path $desktopPath "MultiLaptop Mouse Controller.lnk"
$shortcut = $wshShell.CreateShortcut($shortcutFile)
$shortcut.TargetPath = $targetExe
$shortcut.WorkingDirectory = $workingDir
$shortcut.Description = "MultiLaptop Mouse Controller - Share mouse and keyboard across laptops"
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Save()

Write-Host "Desktop shortcut created with custom icon at: $shortcutFile"

# Also create in local user Desktop if it exists and differs from OneDrive Desktop
$localDesktop = Join-Path $env:USERPROFILE "Desktop"
if ((Test-Path $localDesktop) -and ($localDesktop -ne $desktopPath)) {
    $altShortcutFile = Join-Path $localDesktop "MultiLaptop Mouse Controller.lnk"
    $altShortcut = $wshShell.CreateShortcut($altShortcutFile)
    $altShortcut.TargetPath = $targetExe
    $altShortcut.WorkingDirectory = $workingDir
    $altShortcut.Description = "MultiLaptop Mouse Controller"
    $altShortcut.IconLocation = "$iconPath,0"
    $altShortcut.Save()
    Write-Host "Also created at: $altShortcutFile"
}
