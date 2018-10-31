@echo off
setlocal
set AML_HOME=%HOMEDRIVE%%HOMEPATH%\.azureml

rem These statements need to be on separate single lines in order to handle
rem parenthesis in file names.
if [%1]==[] set PYTHONBIN=python else 
if not [%1]==[] set PYTHONBIN=%~1

set /p PYTHONBIN="Enter path to Python3 interpreter [default: %PYTHONBIN%]: "

for /f "tokens=2 delims= " %%i in ('call "%PYTHONBIN%" --version 2^>^&1') do set PYTHON_VERSION=%%i

call "%PYTHONBIN%" --version
if "%ERRORLEVEL%" neq "0" (
    echo Could not find a python interpreter. Please install Python 3.5 or greater. 1>&2
    exit /b 1
)

echo AzureML settings Directory: %AML_HOME%
echo Python version: %PYTHON_VERSION%

if "%PYTHON_VERSION%" lss "3.5" (
    echo Incorrect Python version. Please install Python 3.5 or greater. 1>&2
    exit /b 2
) 

set /p AML_VERSION=<aml_version.txt

REM create AML virtual environment
call "%PYTHONBIN%" -m venv "%AML_HOME%\envs\amlsdk"
call "%AML_HOME%\envs\amlsdk\scripts\activate.bat"

python -m pip install --upgrade pip
python -m pip install flask
python -m pip install --upgrade --extra-index-url https://azuremlsdktestpypi.azureedge.net/sdk-release/master/588E708E0DF342C4A80BD954289657CF azureml-core==%AML_VERSION%
python -m pip install --upgrade --extra-index-url https://azuremlsdktestpypi.azureedge.net/sdk-release/master/588E708E0DF342C4A80BD954289657CF azureml-contrib-server[server]==%AML_VERSION%

call "%AML_HOME%\envs\amlsdk\scripts\deactivate.bat"
