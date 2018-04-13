/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const pEvent = require("p-event");
const path_1 = require("path");
const ssh2_1 = require("ssh2");
const interface_1 = require("fileSystem/interface");
/**
 * SFTP Client
 * need to be disposed manually
 */
class SFTPClient {
    constructor(config) {
        this.initializePromise = this.initialize(config);
    }
    async mkdir(dir) {
        await this.initializePromise;
        let flag;
        await new Promise((resolve, reject) => {
            flag = this.sftp.mkdir(dir, (e) => {
                if (!lodash_1.isNil(e)) {
                    reject(e);
                }
                else {
                    resolve();
                }
            });
        });
        if (!flag) {
            await pEvent(this.client, 'continue');
        }
        await this.chmod(dir, '777');
    }
    async chmod(dir, mode) {
        await this.initializePromise;
        let flag;
        await new Promise((resolve, reject) => {
            flag = this.sftp.chmod(dir, mode, (e) => {
                if (!lodash_1.isNil(e)) {
                    reject(e);
                }
                else {
                    resolve();
                }
            });
        });
        if (!flag) {
            await pEvent(this.client, 'continue');
        }
    }
    async list(dir) {
        await this.initializePromise;
        let flag;
        const res = await new Promise((resolve, reject) => {
            flag = this.sftp.readdir(dir, (e, list) => {
                if (!lodash_1.isNil(e)) {
                    reject(e);
                }
                else {
                    const directories = list.filter((x) => x.longname.startsWith('d')).map((x) => path_1.posix.join(dir, x.filename));
                    const files = list.filter((x) => x.longname.startsWith('-')).map((x) => path_1.posix.join(dir, x.filename));
                    resolve({
                        directories,
                        files
                    });
                }
            });
        });
        if (!flag) {
            await pEvent(this.client, 'continue');
        }
        return res;
    }
    async exist(dir, filename) {
        await this.initializePromise;
        if (!lodash_1.isNil(filename)) {
            dir = path_1.posix.join(dir, filename);
        }
        let flag;
        const res = await new Promise((resolve, reject) => {
            flag = this.sftp.stat(dir, (e) => {
                if (!lodash_1.isNil(e)) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
        if (!flag) {
            await pEvent(this.client, 'continue');
        }
        return res;
    }
    async remove(dir, filename) {
        await this.initializePromise;
        let flag;
        await new Promise((resolve, reject) => {
            if (lodash_1.isNil(filename)) {
                flag = this.sftp.rmdir(dir, (e) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve();
                    }
                });
            }
            else {
                flag = this.sftp.unlink(path_1.posix.join(dir, filename), (e) => {
                    if (!lodash_1.isNil(e)) {
                        reject(e);
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
        if (!flag) {
            await pEvent(this.client, 'continue');
        }
    }
    async upload(dir, filename, localPath) {
        await this.initializePromise;
        if (!lodash_1.isNil(filename)) {
            dir = path_1.posix.join(dir, filename);
        }
        await new Promise((resolve, reject) => {
            this.sftp.fastPut(localPath, dir, (e) => {
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
        await this.initializePromise;
        if (!lodash_1.isNil(filename)) {
            dir = path_1.posix.join(dir, filename);
        }
        await new Promise((resolve, reject) => {
            this.sftp.fastGet(dir, localPath, (e) => {
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
        if (!await this.exist(dir)) {
            await this.mkdir_r(path_1.posix.dirname(dir));
            await this.mkdir(dir);
        }
    }
    async rmdir_r(dir) {
        const res = await this.list(dir);
        await Promise.all([
            ...res.files.map(async (x) => this.remove(dir, path_1.posix.basename(x))),
            ...res.directories.map(async (x) => this.rmdir_r(x))
        ]);
        await this.remove(dir);
    }
    dispose() {
        this.client.end();
    }
    async initialize(config) {
        this.client = new ssh2_1.Client();
        this.client.connect(config);
        await pEvent(this.client, 'ready');
        let flag = true;
        this.sftp = await new Promise((resolve, reject) => {
            flag = this.client.sftp((e, sftp) => {
                if (!lodash_1.isNil(e)) {
                    reject(e);
                }
                else {
                    resolve(sftp);
                }
            });
        });
        if (!flag) {
            await pEvent(this.client, 'continue');
        }
    }
}
exports.SFTPClient = SFTPClient;
/**
 * SFTP File System
 * Create & Dispose a SFTPClient instance on executing each method
 */
class SFTPFileSystem extends interface_1.BaseFileSystem {
    constructor(config, root = '') {
        super();
        this.config = config;
        this.root = root;
    }
    async mkdir(dir) {
        dir = path_1.posix.join(this.root, dir);
        let client;
        try {
            client = new SFTPClient(this.config);
            await client.mkdir(dir);
        }
        finally {
            client.dispose();
        }
    }
    async list(dir) {
        dir = path_1.posix.join(this.root, dir);
        let client;
        try {
            client = new SFTPClient(this.config);
            const list = await client.list(dir);
            list.directories = list.directories.map((x) => path_1.posix.relative(this.root, x));
            list.files = list.files.map((x) => path_1.posix.relative(this.root, x));
            return list;
        }
        finally {
            client.dispose();
        }
    }
    async exist(dir, filename) {
        dir = path_1.posix.join(this.root, dir);
        let client;
        try {
            client = new SFTPClient(this.config);
            return await client.exist(dir);
        }
        finally {
            client.dispose();
        }
    }
    async remove(dir, filename) {
        dir = path_1.posix.join(this.root, dir);
        let client;
        try {
            client = new SFTPClient(this.config);
            await client.remove(dir, filename);
        }
        finally {
            client.dispose();
        }
    }
    async upload(dir, filename, localPath) {
        dir = path_1.posix.join(this.root, dir);
        let client;
        try {
            client = new SFTPClient(this.config);
            await client.upload(dir, filename, localPath);
        }
        finally {
            client.dispose();
        }
    }
    async download(dir, filename, localPath) {
        dir = path_1.posix.join(this.root, dir);
        let client;
        try {
            client = new SFTPClient(this.config);
            await client.download(dir, filename, localPath);
        }
        finally {
            client.dispose();
        }
    }
    async mkdir_r(dir) {
        dir = path_1.posix.join(this.root, dir);
        let client;
        try {
            client = new SFTPClient(this.config);
            await client.mkdir_r(dir);
        }
        finally {
            client.dispose();
        }
    }
    async rmdir_r(dir) {
        dir = path_1.posix.join(this.root, dir);
        let client;
        try {
            client = new SFTPClient(this.config);
            await client.rmdir_r(dir);
        }
        finally {
            client.dispose();
        }
    }
}
exports.SFTPFileSystem = SFTPFileSystem;
//# sourceMappingURL=sftpFileSystem.js.map