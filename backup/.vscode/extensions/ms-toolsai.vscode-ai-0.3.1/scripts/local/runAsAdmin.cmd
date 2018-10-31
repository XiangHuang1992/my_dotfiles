@ echo off

echo Set objShell = CreateObject("Shell.Application") > tmp.vbs
echo Dim bin, args >> tmp.vbs
echo bin = WScript.Arguments.item(0) >> tmp.vbs
echo args = "" >> tmp.vbs
echo For i = 1 to WScript.Arguments.Count - 1 >> tmp.vbs
echo args = args ^& " """ ^& WScript.Arguments.item(i) ^& """" >> tmp.vbs
echo Next >> tmp.vbs
echo objShell.ShellExecute bin, args, , "runas" >> tmp.vbs
cscript tmp.vbs %*
del /q tmp.vbs
