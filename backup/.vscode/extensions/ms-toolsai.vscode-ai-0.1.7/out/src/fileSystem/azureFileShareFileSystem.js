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
const url = require("url");
const interface_1 = require("fileSystem/interface");
/**
 * Azure File Share File System
 */
class AzureFileShareFileSystem extends interface_1.BaseFileSystem {
    constructor(account, accountKey, uri) {
        super();
        this.service = azure_storage_1.createFileService(account, accountKey);
        const pathname = url.parse(uri, false).pathname;
        const matches = pathname.match(/^\/([^/]+)(\/.*)?$/);
        this.share = matches[1];
        this.root = matches[2];
        if (lodash_1.isNil(this.root)) {
            this.root = '';
        }
    }
    async mkdir(dir) {
        dir = path_1.posix.join(this.root, dir);
        await new Promise((resolve, reject) => {
            this.service.createDirectoryIfNotExists(this.share, dir, (e) => {
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
        dir = path_1.posix.join(this.root, dir);
        const res = {
            directories: [],
            files: []
        };
        let token = null;
        do {
            const list = await new Promise((resolve, reject) => {
                this.service.listFilesAndDirectoriesSegmented(this.share, dir, token, (e, r) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve(r);
                    }
                });
            });
            res.directories = res.directories.concat(list.entries.directories.map((x) => path_1.posix.join(dir, x.name)));
            res.files = res.files.concat(list.entries.files.map((x) => path_1.posix.join(dir, x.name)));
            token = list.continuationToken;
        } while (!lodash_1.isEmpty(token));
        return res;
    }
    async exist(dir, filename) {
        dir = path_1.posix.join(this.root, dir);
        return new Promise((resolve, reject) => {
            if (lodash_1.isNil(filename)) {
                this.service.doesDirectoryExist(this.share, dir, (e, r) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve(r.exists);
                    }
                });
            }
            else {
                this.service.doesFileExist(this.share, dir, filename, (e, r) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve(r.exists);
                    }
                });
            }
        });
    }
    async remove(dir, filename) {
        dir = path_1.posix.join(this.root, dir);
        await new Promise((resolve, reject) => {
            if (lodash_1.isNil(filename)) {
                this.service.deleteDirectoryIfExists(this.share, dir, (e) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve();
                    }
                });
            }
            else {
                this.service.deleteFileIfExists(this.share, dir, filename, (e) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    }
    async upload(dir, filename, localPath) {
        dir = path_1.posix.join(this.root, dir);
        await new Promise((resolve, reject) => {
            this.service.createFileFromLocalFile(this.share, dir, filename, localPath, (e) => {
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
        dir = path_1.posix.join(this.root, dir);
        await new Promise((resolve, reject) => {
            this.service.getFileToLocalFile(this.share, dir, filename, localPath, (e) => {
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
exports.AzureFileShareFileSystem = AzureFileShareFileSystem;
//# sourceMappingURL=azureFileShareFileSystem.js.map