/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("common/util");
const httpntlm = require("httpntlm");
async function httpGet(url, userName, domain, credential) {
    return new Promise((resolve, reject) => {
        const passwordArray = util.base64decode(credential);
        httpntlm.get({
            url: url,
            username: userName,
            lm_password: passwordArray.slice(0, 16),
            nt_password: passwordArray.slice(16),
            domain: domain,
            rejectUnauthorized: false
        }, 
        // tslint:disable-next-line:typedef
        (err, res) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(res.body);
            }
        });
    });
}
exports.httpGet = httpGet;
function createNTLMCredential(password) {
    const lm = httpntlm.ntlm.create_LM_hashed_password(password);
    const nt = httpntlm.ntlm.create_NT_hashed_password(password);
    const combined = new Buffer(lm.length + nt.length);
    combined.set(lm);
    combined.set(nt, lm.length);
    return util.base64encode(combined);
}
exports.createNTLMCredential = createNTLMCredential;
//# sourceMappingURL=http.js.map