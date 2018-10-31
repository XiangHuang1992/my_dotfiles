#!/bin/bash
AML_HOME=$HOME/.azureml
PYTHONBIN=${1:-"python"}

read -p "Enter path to Python3 interpreter [default: $PYTHONBIN]: " input
PYTHONBIN=${input:-$PYTHONBIN}

PYTHON_VERSION=`"$PYTHONBIN" --version 2>&1`

retVal=$?
if [ $retVal -ne 0 ]; then
    echo Could not find a python interpreter. Please install Python 3.5 or greater. 1>&2
    exit 1
fi

IFS=' .' read -r -a VERSION_PARTS <<< "$PYTHON_VERSION"

echo AzureML Settings Directory: $AML_HOME
echo Python version: $PYTHON_VERSION

# check for major/minor version
if (( ${VERSION_PARTS[1]} < 3 || (${VERSION_PARTS[1]} == 3 && ${VERSION_PARTS[2]} < 5) ))
then
    echo Incorrect Python version. Please install Python 3.5 or greater. 1>&2
    exit 2
fi 

AML_VERSION=$(<aml_version.txt)

# create AML virtual environment
"$PYTHONBIN" -m venv "$AML_HOME/envs/amlsdk"
source "$AML_HOME/envs/amlsdk/bin/activate"

python -m pip install --upgrade pip
python -m pip install flask
python -m pip install --upgrade azureml-contrib-server[server]==$AML_VERSION.*

deactivate
