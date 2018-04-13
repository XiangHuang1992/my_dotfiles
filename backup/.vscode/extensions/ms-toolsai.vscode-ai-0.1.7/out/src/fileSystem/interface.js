/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
/**
 * Base File System
 */
class BaseFileSystem {
    async mkdir_r(dir) {
        if (!await this.exist(dir)) {
            await this.mkdir_r(path.dirname(dir));
            await this.mkdir(dir);
        }
    }
    async rmdir_r(dir) {
        const res = await this.list(dir);
        await Promise.all([
            ...res.files.map(async (x) => this.remove(dir, path.posix.basename(x))),
            ...res.directories.map(async (x) => this.rmdir_r(x))
        ]);
        await this.remove(dir);
    }
    async upload_r(local, remoteParent) {
        const stats = await fs.stat(local);
        if (stats.isFile()) {
            await this.upload(remoteParent, path.basename(local), local);
        }
        else if (stats.isDirectory()) {
            const newDest = path.posix.join(remoteParent, path.basename(local));
            await this.mkdir(newDest);
            const list = await fs.readdir(local);
            await Promise.all(list.map(async (f) => this.upload_r(path.join(local, f), newDest)));
        }
    }
    async download_r(remote, localParent, isFolder = true) {
        if (!isFolder) {
            const dir = path.posix.dirname(remote);
            const base = path.posix.basename(remote);
            await this.download(dir, base, path.join(localParent, base));
        }
        else {
            const newDest = path.join(localParent, path.posix.basename(remote));
            await fs.ensureDir(newDest);
            const list = await this.list(remote);
            await Promise.all(list.files.map(async (f) => this.download(path.posix.dirname(f), path.posix.basename(f), newDest)));
            await Promise.all(list.directories.map(async (d) => this.download_r(d, newDest)));
        }
    }
}
exports.BaseFileSystem = BaseFileSystem;
//# sourceMappingURL=interface.js.map