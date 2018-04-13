/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const azure_storage_1 = require("azure-storage");
const lodash_1 = require("lodash");
const path_1 = require("path");
const interface_1 = require("fileSystem/interface");
/**
 * Azure Blob File System
 */
class AzureBlobFileSystem extends interface_1.BaseFileSystem {
    constructor(account, accountKey, container) {
        super();
        this.placeHolder = '__placeholder__';
        this.service = azure_storage_1.createBlobService(account, accountKey);
        this.container = container;
    }
    async mkdir(dir) {
        await new Promise((resolve, reject) => {
            this.service.createBlockBlobFromText(this.container, path_1.posix.join(dir, this.placeHolder), this.placeHolder, (e) => {
                if (!lodash_1.isNil(e)) {
                    reject(e);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async list(dir) {
        if (dir !== '' && !dir.endsWith(path_1.posix.sep)) {
            dir += path_1.posix.sep;
        }
        return {
            directories: await this.listDirectories(dir),
            files: await this.listBlobs(dir)
        };
    }
    async exist(dir, filename) {
        if (!lodash_1.isNil(filename)) {
            return new Promise((resolve, reject) => {
                this.service.doesBlobExist(this.container, path_1.posix.join(dir, filename), (e, res) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve(res.exists);
                    }
                });
            });
        }
        else {
            if (dir !== '' && !dir.endsWith(path_1.posix.sep)) {
                dir += path_1.posix.sep;
            }
            return !lodash_1.isEmpty(await this.listBlobsRecursive(dir));
        }
    }
    async remove(dir, filename) {
        if (!lodash_1.isNil(filename)) {
            dir = path_1.posix.join(dir, filename);
            await new Promise((resolve, reject) => {
                this.service.deleteBlobIfExists(this.container, dir, (e) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
    }
    async upload(dir, filename, localPath) {
        await new Promise((resolve, reject) => {
            this.service.createBlockBlobFromLocalFile(this.container, path_1.posix.join(dir, filename), localPath, (e) => {
                if (!lodash_1.isNil(e)) {
                    reject(e);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async download(dir, filename, localPath) {
        await new Promise((resolve, reject) => {
            this.service.getBlobToLocalFile(this.container, path_1.posix.join(dir, filename), localPath, (e) => {
                if (!lodash_1.isNil(e)) {
                    reject(e);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async mkdir_r(dir) {
        await this.mkdir(dir);
    }
    async rmdir_r(dir) {
        if (dir !== '' && !dir.endsWith(path_1.posix.sep)) {
            dir += path_1.posix.sep;
        }
        const list = await this.listBlobsRecursive(dir);
        await Promise.all(list.map(async (x) => this.remove(path_1.posix.dirname(x), path_1.posix.basename(x))));
    }
    async listBlobs(dir) {
        return this.listBlobsRecursive(dir).then((res) => res.filter((x) => path_1.posix.dirname(x) === dir));
    }
    async listBlobsRecursive(dir) {
        let res = [];
        let token = null;
        do {
            const response = await new Promise((resolve, reject) => {
                this.service.listBlobsSegmentedWithPrefix(this.container, dir, token, (e, r) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve(r);
                    }
                });
            });
            res = res.concat(response.entries.map((x) => x.name));
            token = response.continuationToken;
        } while (!lodash_1.isNil(token));
        return res;
    }
    async listDirectories(dir) {
        let res = [];
        let token = null;
        do {
            // http://azure.github.io/azure-storage-node/BlobService.html#listBlobDirectoriesSegmentedWithPrefix
            // azure-storage-node's type definition doesn't have this function
            // tslint:disable:no-any
            const response = await new Promise((resolve, reject) => {
                this.service.listBlobDirectoriesSegmentedWithPrefix(this.container, dir, token, (e, r) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve(r);
                    }
                });
            });
            // tslint:enable:no-any
            res = res.concat(response.entries.map((x) => x.name));
            token = response.continuationToken;
        } while (!lodash_1.isNil(token));
        return res;
    }
}
exports.AzureBlobFileSystem = AzureBlobFileSystem;
//# sourceMappingURL=azureBlobFileSystem.js.map