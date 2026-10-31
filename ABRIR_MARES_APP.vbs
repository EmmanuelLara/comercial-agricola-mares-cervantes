Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Comercial Agricola Mares Crevantes"

' 1. Iniciar MongoDB si no esta corriendo
On Error Resume Next
WshShell.Run "net start MongoDB", 0, True
Err.Clear

' 2. Verificar e Iniciar Servidor Node en segundo plano
Dim http
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.setTimeouts 500, 500, 500, 500
http.Open "GET", "http://127.0.0.1:3000", False
http.Send
If Err.Number <> 0 Then
    Err.Clear
    WshShell.Run """C:\Program Files\nodejs\node.exe"" ""D:\Comercial Agricola Mares Crevantes\app.js""", 0, False
    WScript.Sleep 2500
End If
On Error GoTo 0

' 3. Abrir ventana de aplicacion limpia
Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
If fso.FileExists("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") Then
    WshShell.Run """C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"" --app=http://127.0.0.1:3000 --window-size=1280,820", 1, False
ElseIf fso.FileExists("C:\Program Files\Google\Chrome\Application\chrome.exe") Then
    WshShell.Run """C:\Program Files\Google\Chrome\Application\chrome.exe"" --app=http://127.0.0.1:3000 --window-size=1280,820", 1, False
Else
    WshShell.Run "http://127.0.0.1:3000", 1, False
End If
