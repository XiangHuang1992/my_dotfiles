/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const lodash_1 = require("lodash");
const pEvent = require("p-event");
const path = require("path");
const ssh2_1 = require("ssh2");
const component = require("common/component");
const logger_1 = require("common/logger");
const sftpFileSystem_1 = require("fileSystem/sftpFileSystem");
async function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
exports.delay = delay;
async function exec(command, options) {
    return new Promise((resolve, reject) => {
        const opt = (lodash_1.isNil(options) ? {} : options);
        opt.encoding = 'utf8';
        cp.exec(command, opt, (e, stdout, stderr) => {
            if (!lodash_1.isNil(e)) {
                if (!lodash_1.isNil(e.code)) {
                    resolve({ code: e.code, stdout, stderr });
                }
                else {
                    void component.get(logger_1.Logger).error(e, { command, options });
                    reject(e);
                }
            }
            else {
                resolve({ code: 0, stdout, stderr });
            }
        });
    });
}
exports.exec = exec;
async function execFile(file, args, options) {
    return new Promise((resolve, reject) => {
        const opt = (lodash_1.isNil(options) ? {} : options);
        opt.encoding = 'utf8';
        cp.execFile(file, args, opt, (e, stdout, stderr) => {
            if (!lodash_1.isNil(e)) {
                if (!lodash_1.isNil(e.code)) {
                    resolve({ code: e.code, stdout, stderr });
                }
                else {
                    void component.get(logger_1.Logger).error(e, { file, args, options });
                    reject(e);
                }
            }
            else {
                resolve({ code: 0, stdout, stderr });
            }
        });
    });
}
exports.execFile = execFile;
function spawn(command, options) {
    options.shell = true;
    return cp.spawn(command, [], options).on('error', (e) => {
        void component.get(logger_1.Logger).error(e, { command });
    });
}
exports.spawn = spawn;
async function scp(connectConfig, localFile, remoteDir) {
    const fs = new sftpFileSystem_1.SFTPFileSystem(connectConfig);
    await fs.upload(remoteDir, path.basename(localFile), localFile);
}
exports.scp = scp;
async function ssh(connectConfig, command) {
    const client = new ssh2_1.Client();
    client.connect(connectConfig);
    await pEvent(client, 'ready');
    const ret = { code: 0, stdout: '', stderr: '' };
    await new Promise((resolve, reject) => {
        client.exec(command, (e, stream) => {
            if (!lodash_1.isNil(e)) {
                reject(e);
            }
            stream.on('close', (code) => {
                ret.code = code;
                client.end();
                resolve();
            }).on('data', (data) => {
                ret.stdout += data;
            }).stderr.on('data', (data) => {
                ret.stderr += data;
            });
        });
    });
    if (ret.code !== 0) {
        await component.get(logger_1.Logger).error('ssh failed', { command });
        throw new Error(`ssh failed, exit code: ${ret.code}`);
    }
    return ret.stdout;
}
exports.ssh = ssh;
function base64encode(buffer) {
    return buffer.toString('base64');
}
exports.base64encode = base64encode;
function btoa(raw) {
    return base64encode(new Buffer(raw));
}
exports.btoa = btoa;
function base64decode(value) {
    return new Buffer(value, 'base64');
}
exports.base64decode = base64decode;
function atob(base64) {
    return base64decode(base64).toString();
}
exports.atob = atob;
//# sourceMappingURL=util.js.map