/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const BatchAIManagementClient = require("azure-arm-batchai"); // tslint:disable-line
const ComputeManagementClient = require("azure-arm-compute"); // tslint:disable-line
const azure_arm_resource_1 = require("azure-arm-resource");
const StorageManagementClient = require("azure-arm-storage"); // tslint:disable-line
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const path = require("path");
const vscode = require("vscode");
const component = require("common/component");
const batchAIAccount_1 = require("configurations/batchAI/batchAIAccount");
const batchAIStorageCredentials_1 = require("configurations/batchAI/batchAIStorageCredentials");
const linuxUtil = require("configurations/linuxVM/linuxVMUtil");
const azureBlobFileSystem_1 = require("fileSystem/azureBlobFileSystem");
const azureFileShareFileSystem_1 = require("fileSystem/azureFileShareFileSystem");
const sftpFileSystem_1 = require("fileSystem/sftpFileSystem");
const outputChannel_1 = require("uiToolkits/outputChannel");
const quickPickerToolkit_1 = require("uiToolkits/quickPickerToolkit");
const vmSizeBlackList = [
    /STANDARD_A0/i,
    /STANDARD_GS/i,
    /STANDARD_DS/i
];
function getResourceClient() {
    const account = component.get(batchAIAccount_1.BatchAIAccount);
    if (lodash_1.isNil(account.subscription)) {
        throw new Error('Batch AI: Please login first');
    }
    return new azure_arm_resource_1.ResourceManagementClient(account.credentials, account.subscriptionId);
}
exports.getResourceClient = getResourceClient;
function getBatchAIClient() {
    const account = component.get(batchAIAccount_1.BatchAIAccount);
    if (lodash_1.isNil(account.subscription)) {
        throw new Error('Batch AI: Please login first');
    }
    return new BatchAIManagementClient(account.credentials, account.subscriptionId);
}
exports.getBatchAIClient = getBatchAIClient;
function getComputeClient() {
    const account = component.get(batchAIAccount_1.BatchAIAccount);
    if (lodash_1.isNil(account.subscription)) {
        throw new Error('Batch AI: Please login first');
    }
    return new ComputeManagementClient(account.credentials, account.subscriptionId);
}
exports.getComputeClient = getComputeClient;
function getStorageClient() {
    const account = component.get(batchAIAccount_1.BatchAIAccount);
    if (lodash_1.isNil(account.subscription)) {
        throw new Error('Batch AI: Please login first');
    }
    return new StorageManagementClient(account.credentials, account.subscriptionId);
}
exports.getStorageClient = getStorageClient;
async function getStorageAccountKey(name) {
    const client = getStorageClient();
    const accounts = await client.storageAccounts.list();
    const target = accounts.find((x) => x.name === name);
    if (!lodash_1.isNil(target)) {
        const keys = (await client.storageAccounts.listKeys(getResourceGroupFromId(target.id), target.name)).keys;
        return keys.find((k) => k.permissions === 'Full').value;
    }
}
exports.getStorageAccountKey = getStorageAccountKey;
function getSubscriptionFromId(id) {
    const res = id.match(/\/subscriptions\/([^\/]+)(\/)?/);
    if (res.length < 2) {
        return;
    }
    else {
        return res[1];
    }
}
exports.getSubscriptionFromId = getSubscriptionFromId;
function getResourceGroupFromId(id) {
    const res = id.match(/\/resourceGroups\/([^\/]+)(\/)?/);
    if (res.length < 2) {
        return;
    }
    else {
        return res[1];
    }
}
exports.getResourceGroupFromId = getResourceGroupFromId;
function getJobNameFromId(id) {
    const res = id.match(/\/providers\/Microsoft.BatchAI\/jobs\/([^\/]+)(\/)?/);
    if (res.length < 2) {
        return;
    }
    else {
        return res[1];
    }
}
exports.getJobNameFromId = getJobNameFromId;
function getFileServerNameFromId(id) {
    const res = id.match(/\/providers\/Microsoft.BatchAI\/fileservers\/([^\/]+)(\/)?/);
    if (res.length < 2) {
        return;
    }
    else {
        return res[1];
    }
}
exports.getFileServerNameFromId = getFileServerNameFromId;
async function getResourceGroups() {
    return getResourceClient().resourceGroups.list();
}
exports.getResourceGroups = getResourceGroups;
async function selectResourceGroups() {
    const item = await quickPickerToolkit_1.showQuickPick(getResourceGroups().then((res) => res.map((x) => ({
        label: x.id,
        description: x.name,
        context: x
    }))), 'Select a Resource Group');
    if (lodash_1.isNil(item)) {
        return;
    }
    return item.context;
}
exports.selectResourceGroups = selectResourceGroups;
async function loadLocalVMSizeList() {
    const file = path.join(component.getContext().extensionPath, 'batchai_vmsize.json');
    return (await fs.readJson(file));
}
async function getVMSizeList(location) {
    let res = await getComputeClient().virtualMachineSizes.list(location);
    res = res.filter((x) => vmSizeBlackList.every((reg) => !reg.test(x.name)));
    return res;
}
exports.getVMSizeList = getVMSizeList;
async function selectVMSize(location) {
    const local = await loadLocalVMSizeList();
    const item = await quickPickerToolkit_1.showQuickPick(getVMSizeList(location).then((res) => res.map((x) => {
        let descList = [
            `Cores: ${x.numberOfCores};`,
            `RAM: ${lodash_1.round(x.memoryInMB / 1024, 1)}GB;`,
            `Disk: ${lodash_1.round(x.resourceDiskSizeInMB / 1024, 1)}GB;`
        ];
        const key = x.name.toLowerCase();
        if (!lodash_1.isNil(local.VMs[key]) && Number(local.VMs[key].GPU) !== 0) {
            descList = descList.concat([
                `GPU_Type: ${local.VMs[key].GPU_Type};`,
                `GPU: ${local.VMs[key].GPU};`
            ]);
        }
        return {
            label: x.name,
            description: descList.join(' '),
            context: x.name
        };
    })), 'Select a VM Size');
    if (lodash_1.isNil(item)) {
        return;
    }
    return item.context;
}
exports.selectVMSize = selectVMSize;
exports.azureBlobKey = 'Azure Blob File System';
exports.azureFileKey = 'Azure File Share';
exports.azureVMFSKey = 'Azure VM File Server';
exports.mountRoot = '$AZ_BATCHAI_MOUNT_ROOT';
function getVolumeQuickPickItemsFromCluster(cluster) {
    let result = [];
    if (!lodash_1.isNil(cluster.nodeSetup) && !lodash_1.isNil(cluster.nodeSetup.mountVolumes)) {
        const volumes = cluster.nodeSetup.mountVolumes;
        if (!lodash_1.isNil(volumes.azureBlobFileSystems)) {
            result = result.concat(volumes.azureBlobFileSystems.map((x) => ({
                label: x.containerName,
                description: exports.azureBlobKey,
                detail: path.posix.join(exports.mountRoot, x.relativeMountPath),
                context: x
            })));
        }
        if (!lodash_1.isNil(volumes.azureFileShares)) {
            result = result.concat(volumes.azureFileShares.map((x) => ({
                label: x.azureFileUrl,
                description: exports.azureFileKey,
                detail: path.posix.join(exports.mountRoot, x.relativeMountPath),
                context: x
            })));
        }
        if (!lodash_1.isNil(volumes.fileServers)) {
            result = result.concat(volumes.fileServers.map((x) => ({
                label: getFileServerNameFromId(x.fileServer.id),
                description: exports.azureVMFSKey,
                detail: path.posix.join(exports.mountRoot, x.relativeMountPath),
                context: x
            })));
        }
    }
    return result;
}
exports.getVolumeQuickPickItemsFromCluster = getVolumeQuickPickItemsFromCluster;
async function getAzureStorageAccountKey(accountName) {
    component.get(outputChannel_1.OutputChannel).appendLine('Try to get storage account key from current subscription...');
    try {
        const key = await getStorageAccountKey(accountName);
        if (!lodash_1.isNil(key)) {
            component.get(outputChannel_1.OutputChannel).appendLine('Get storage account key succeeded');
            return key;
        }
    }
    catch (_a) {
        // pass
    }
    component.get(outputChannel_1.OutputChannel).appendLine('Try to get storage account key from stored storage credentials...');
    let list = await component.get(batchAIStorageCredentials_1.BatchAIStorageCredentials).get();
    let target = list.azureStorage.find((x) => x.name === accountName);
    while (lodash_1.isNil(target)) {
        // tslint:disable-next-line:max-line-length
        void vscode.window.showWarningMessage(`Azure storage account ${accountName} not found. Please edit the BatchAI storage credentials`);
        // tslint:disable-next-line:max-line-length
        component.get(outputChannel_1.OutputChannel).appendLine(`Azure storage account ${accountName} not found. Please edit the BatchAI storage credentials`);
        const ret = await component.get(batchAIStorageCredentials_1.BatchAIStorageCredentials).edit();
        if (ret.continue) {
            list = ret.object;
            target = list.azureStorage.find((x) => x.name === accountName);
        }
        else {
            component.get(outputChannel_1.OutputChannel).appendLine('Azure storage account not found. BatchAI job submission canceled.');
            throw new Error('Azure storage account not found. BatchAI job submission canceled.');
        }
    }
    component.get(outputChannel_1.OutputChannel).appendLine('Get storage account key succeeded');
    return target.key;
}
async function getFileServerConnectConfig(server) {
    const ip = server.mountSettings.fileServerPublicIP;
    component.get(outputChannel_1.OutputChannel).appendLine('Try to get file server account from stored storage credentials...');
    let list = await component.get(batchAIStorageCredentials_1.BatchAIStorageCredentials).get();
    let target = list.linuxVM.find((x) => x.address === ip);
    while (lodash_1.isNil(target)) {
        // tslint:disable-next-line:max-line-length
        void vscode.window.showWarningMessage(`File server ssh account for ${ip} not found. Please edit the BatchAI storage credentials`);
        component.get(outputChannel_1.OutputChannel).appendLine(`File server ssh account for ${ip} not found. Please edit the BatchAI storage credentials`);
        const ret = await component.get(batchAIStorageCredentials_1.BatchAIStorageCredentials).edit();
        if (ret.continue) {
            list = ret.object;
            target = list.linuxVM.find((x) => x.address === ip);
        }
        else {
            component.get(outputChannel_1.OutputChannel).appendLine('File server ssh account not found. BatchAI job submission canceled.');
            throw new Error('File server ssh account not found. BatchAI job submission canceled.');
        }
    }
    component.get(outputChannel_1.OutputChannel).appendLine('Get file server ssh account succeeded');
    return linuxUtil.getConnectConfig(target);
}
async function getFileSytemFromMountPath(volumes, mountPath) {
    if (!lodash_1.isNil(volumes.azureBlobFileSystems)) {
        const azureBlob = volumes.azureBlobFileSystems.find((x) => !path.relative(x.relativeMountPath, mountPath).startsWith('..'));
        if (!lodash_1.isNil(azureBlob)) {
            return {
                fs: new azureBlobFileSystem_1.AzureBlobFileSystem(azureBlob.accountName, await getAzureStorageAccountKey(azureBlob.accountName), azureBlob.containerName),
                type: exports.azureBlobKey,
                relativePath: path.posix.relative(azureBlob.relativeMountPath, mountPath)
            };
        }
    }
    if (!lodash_1.isNil(volumes.azureFileShares)) {
        const azureFile = volumes.azureFileShares.find((x) => !path.relative(x.relativeMountPath, mountPath).startsWith('..'));
        if (!lodash_1.isNil(azureFile)) {
            return {
                fs: new azureFileShareFileSystem_1.AzureFileShareFileSystem(azureFile.accountName, await getAzureStorageAccountKey(azureFile.accountName), azureFile.azureFileUrl),
                type: exports.azureFileKey,
                relativePath: path.posix.relative(azureFile.relativeMountPath, mountPath)
            };
        }
    }
    if (!lodash_1.isNil(volumes.fileServers)) {
        const azureVMFS = volumes.fileServers.find((x) => !path.relative(x.relativeMountPath, mountPath).startsWith('..'));
        if (!lodash_1.isNil(azureVMFS)) {
            const server = await getBatchAIClient().fileServers.get(getResourceGroupFromId(azureVMFS.fileServer.id), getFileServerNameFromId(azureVMFS.fileServer.id));
            return {
                fs: new sftpFileSystem_1.SFTPFileSystem(await getFileServerConnectConfig(server), path.posix.join(server.mountSettings.mountPoint, lodash_1.isNil(azureVMFS.sourceDirectory) ? '' : azureVMFS.sourceDirectory)),
                type: exports.azureVMFSKey,
                relativePath: path.posix.relative(azureVMFS.relativeMountPath, mountPath)
            };
        }
    }
}
exports.getFileSytemFromMountPath = getFileSytemFromMountPath;
//# sourceMappingURL=batchAIUtil.js.map