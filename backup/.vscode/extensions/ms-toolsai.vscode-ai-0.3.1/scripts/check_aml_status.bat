@echo off
set AML_HOME=%HOMEDRIVE%%HOMEPATH%\.azureml

if not exist "%AML_HOME%\envs\amlsdk\scripts\activate.bat" (
    echo AzureML environment not installed 1>&2
    exit /b 1
)

call "%AML_HOME%\envs\amlsdk\scripts\activate.bat"

for /f "tokens=2 delims= " %%i in ('python -m pip list ^| findstr azureml-core') do set VERSION_PARTS=%%i
set /p EXPECTED_AML_VERSION=<aml_version.txt

if not "%VERSION_PARTS%"=="%EXPECTED_AML_VERSION%" (
    echo Incorrect AML SDK version. Please run the Azure ML: Install external tools command to install/upgrade. 1>&2
    call "%AML_HOME%\envs\amlsdk\scripts\deactivate.bat"
    exit /b 2
)

call "%AML_HOME%\envs\amlsdk\scripts\deactivate.bat"
exit /b 0
