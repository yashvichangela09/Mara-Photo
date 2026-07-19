@echo off
if not exist "%~dp0backend\mongodb_data" mkdir "%~dp0backend\mongodb_data"
"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "%~dp0backend\mongodb_data" > "%~dp0mongo_log.txt" 2>&1
