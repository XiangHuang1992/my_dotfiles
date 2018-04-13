/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const lodash_1 = require("lodash");
async function getConnectConfig(account) {
    if (!lodash_1.isEmpty(account.account.password)) {
        return {
            host: account.address,
            port: account.port,
            username: account.account.username,
            password: account.account.password
        };
    }
    else {
        return {
            host: account.address,
            port: account.port,
            username: account.account.username,
            privateKey: await fs.readFile(account.account.privateKeyFilePath),
            passphrase: account.account.privateKeyPassphrase
        };
    }
}
exports.getConnectConfig = getConnectConfig;
//# sourceMappingURL=linuxVMUtil.js.map