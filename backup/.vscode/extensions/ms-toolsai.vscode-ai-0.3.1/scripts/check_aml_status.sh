AML_HOME=$HOME/.azureml

if [ ! -e "$AML_HOME/envs/amlsdk/bin/activate" ]
then
    echo AzureML environment not installed 1>&2
    exit 1
fi

EXPECTED_AML_VERSION=$(<aml_version.txt)

source "$AML_HOME/envs/amlsdk/bin/activate"

IFS=' ' read -r -a VERSION_PARTS <<< `python -m pip list | grep azureml-core`

if [ "${VERSION_PARTS[1]}" -ne "${EXPECTED_AML_VERSION}" ]
then
    echo Incorrect AML SDK version. Please run the Azure ML: Install external tools command to install/upgrade. 1>&2
    deactivate
    exit 2
fi

deactivate
