@echo off
set AML_HOME=%HOMEDRIVE%%HOMEPATH%\.azureml

rmdir /s /q %AML_HOME%\envs\amlsdk
