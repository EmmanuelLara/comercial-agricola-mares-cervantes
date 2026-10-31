Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Comercial Agricola Mares Crevantes"
WshShell.Run "node app.js", 0, False
