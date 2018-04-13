"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// tslint:disable
const adal = require('adal-node');
const MemoryCache = adal.MemoryCache;
const AuthenticationContext = adal.AuthenticationContext;
const CacheDriver = require('adal-node/lib/cache-driver');
const createLogContext = require('adal-node/lib/log').createLogContext;
const ms_rest_azure_1 = require("ms-rest-azure");
const azure_arm_resource_1 = require("azure-arm-resource");
const opn = require("open");
const copypaste = require("copy-paste");
const nls = require("vscode-nls");
const cp = require("child_process");
const vscode_1 = require("vscode");
const localize = nls.loadMessageBundle();
const keytar = undefined;
const logVerbose = false;
const defaultEnvironment = ms_rest_azure_1.AzureEnvironment.Azure;
const commonTenantId = 'common';
const authorityHostUrl = defaultEnvironment.activeDirectoryEndpointUrl; // Testing: 'https://login.windows-ppe.net/'
const clientId = 'aebc6443-996d-45c2-90f0-388ff96faa56'; // VSC: 'aebc6443-996d-45c2-90f0-388ff96faa56'
const validateAuthority = true;
const authorityUrl = `${authorityHostUrl}${commonTenantId}`;
const resource = defaultEnvironment.activeDirectoryResourceId;
const credentialsService = 'VSCode Public Azure';
const credentialsAccount = 'Refresh Token';
class AzureLoginError extends Error {
    constructor(message, _reason) {
        super(message);
        this._reason = _reason;
    }
}
class AzureLoginHelper {
    constructor(context) {
        this.onStatusChanged = new vscode_1.EventEmitter();
        this.onSessionsChanged = new vscode_1.EventEmitter();
        this.subscriptions = Promise.resolve([]);
        this.onSubscriptionsChanged = new vscode_1.EventEmitter();
        this.filters = Promise.resolve([]);
        this.onFiltersChanged = new vscode_1.EventEmitter();
        this.tokenCache = new MemoryCache();
        this.api = {
            status: 'Initializing',
            onStatusChanged: this.onStatusChanged.event,
            waitForLogin: () => this.waitForLogin(),
            sessions: [],
            onSessionsChanged: this.onSessionsChanged.event,
            subscriptions: [],
            onSubscriptionsChanged: this.onSubscriptionsChanged.event,
            waitForSubscriptions: () => this.waitForSubscriptions(),
            filters: [],
            onFiltersChanged: this.onFiltersChanged.event,
            waitForFilters: () => this.waitForFilters(),
        };
        const subscriptions = context.subscriptions;
        subscriptions.push(this.api.onSessionsChanged(() => this.updateSubscriptions().catch(console.error)));
        subscriptions.push(this.api.onSubscriptionsChanged(() => this.updateFilters().catch(console.error)));
        this.initialize()
            .catch(console.error);
        if (logVerbose) {
            const outputChannel = vscode_1.window.createOutputChannel('Azure Account');
            subscriptions.push(outputChannel);
            this.enableLogging(outputChannel);
        }
    }
    enableLogging(channel) {
        const log = adal.Logging;
        log.setLoggingOptions({
            level: log.LOGGING_LEVEL.VERBOSE,
            log: (level, message, error) => {
                if (message) {
                    channel.appendLine(message);
                }
                if (error) {
                    channel.appendLine(error);
                }
            }
        });
    }
    async login() {
        try {
            this.beginLoggingIn();
            const deviceLogin = await deviceLogin1();
            const message = this.showDeviceCodeMessage(deviceLogin);
            const login2 = deviceLogin2(deviceLogin);
            const tokenResponse = await Promise.race([login2, message.then(() => login2)]);
            const refreshToken = tokenResponse.refreshToken;
            const tokenResponses = await tokensFromToken(tokenResponse);
            if (keytar) {
                await keytar.setPassword(credentialsService, credentialsAccount, refreshToken);
            }
            await this.updateSessions(tokenResponses);
        }
        finally {
            this.updateStatus();
        }
    }
    async showDeviceCodeMessage(deviceLogin) {
        const copyAndOpen = { title: localize('azure-account.copyAndOpen', "Copy & Open") };
        const open = { title: localize('azure-account.open', "Open") };
        const close = { title: localize('azure-account.close', "Close"), isCloseAffordance: true };
        const canCopy = process.platform !== 'linux' || (await exitCode('xclip', '-version')) === 0;
        const response = await vscode_1.window.showInformationMessage(deviceLogin.message, canCopy ? copyAndOpen : open, close);
        if (response === copyAndOpen) {
            copypaste.copy(deviceLogin.userCode);
            opn(deviceLogin.verificationUrl);
        }
        else if (response === open) {
            opn(deviceLogin.verificationUrl);
            await this.showDeviceCodeMessage(deviceLogin);
        }
        else if (response === close) {
            return Promise.reject(null);
        }
    }
    async logout() {
        await this.api.waitForLogin();
        if (keytar) {
            await keytar.deletePassword(credentialsService, credentialsAccount);
        }
        await this.updateSessions([]);
        this.updateStatus();
    }
    async initialize() {
        try {
            const refreshToken = keytar && await keytar.getPassword(credentialsService, credentialsAccount);
            if (refreshToken) {
                this.beginLoggingIn();
                const tokenResponse = await tokenFromRefreshToken(refreshToken);
                const tokenResponses = await tokensFromToken(tokenResponse);
                await this.updateSessions(tokenResponses);
            }
        }
        catch (err) {
            if (!(err instanceof AzureLoginError)) {
                throw err;
            }
        }
        finally {
            this.updateStatus();
        }
    }
    beginLoggingIn() {
        if (this.api.status !== 'LoggedIn') {
            this.api.status = 'LoggingIn';
            this.onStatusChanged.fire(this.api.status);
        }
    }
    updateStatus() {
        const status = this.api.sessions.length ? 'LoggedIn' : 'LoggedOut';
        if (this.api.status !== status) {
            this.api.status = status;
            this.onStatusChanged.fire(this.api.status);
        }
    }
    async updateSessions(tokenResponses) {
        await clearTokenCache(this.tokenCache);
        for (const tokenResponse of tokenResponses) {
            await addTokenToCache(this.tokenCache, tokenResponse);
        }
        const sessions = this.api.sessions;
        sessions.splice(0, sessions.length, ...tokenResponses.map(tokenResponse => ({
            environment: defaultEnvironment,
            userId: tokenResponse.userId,
            tenantId: tokenResponse.tenantId,
            credentials: new ms_rest_azure_1.DeviceTokenCredentials({ username: tokenResponse.userId, clientId, tokenCache: this.tokenCache, domain: tokenResponse.tenantId })
        })));
        this.onSessionsChanged.fire();
    }
    async waitForSubscriptions() {
        if (!(await this.api.waitForLogin())) {
            return false;
        }
        await this.subscriptions;
        return true;
    }
    async updateSubscriptions() {
        await this.api.waitForLogin();
        this.subscriptions = this.loadSubscriptions();
        this.api.subscriptions.splice(0, this.api.subscriptions.length, ...await this.subscriptions);
        this.onSubscriptionsChanged.fire();
    }
    async askForLogin() {
        if (this.api.status === 'LoggedIn') {
            return;
        }
        const login = { title: localize('azure-account.login', "Sign In") };
        const cancel = { title: 'Cancel', isCloseAffordance: true };
        const result = await vscode_1.window.showInformationMessage(localize('azure-account.loginFirst', "Not signed in, sign in first."), login, cancel);
        return result === login && vscode_1.commands.executeCommand('azure-account.login');
    }
    async selectSubscriptions() {
        if (!(await this.waitForSubscriptions())) {
            return vscode_1.commands.executeCommand('azure-account.askForLogin');
        }
        const azureConfig = vscode_1.workspace.getConfiguration('azure');
        const resourceFilter = azureConfig.get('resourceFilter') || ['all'];
        let changed = false;
        const subscriptions = this.subscriptions
            .then(list => this.asSubscriptionItems(list, resourceFilter));
        const items = subscriptions.then(list => {
            if (!list.length) {
                return [
                    {
                        type: 'noSubscriptions',
                        label: localize('azure-account.noSubscriptionsSignUpFree', "No subscriptions found, select to sign up for a free account."),
                        description: '',
                    }
                ];
            }
            return [
                {
                    type: 'selectAll',
                    get label() {
                        const selected = resourceFilter[0] === 'all' || !list.find(item => {
                            const { session, subscription } = item.subscription;
                            return resourceFilter.indexOf(`${session.tenantId}/${subscription.subscriptionId}`) === -1;
                        });
                        return `${getCheckmark(selected)} Select All`;
                    },
                    description: '',
                },
                {
                    type: 'deselectAll',
                    get label() {
                        return `${getCheckmark(!resourceFilter.length)} Deselect All`;
                    },
                    description: '',
                },
                ...list
            ];
        });
        for (let pick = await vscode_1.window.showQuickPick(items); pick; pick = await vscode_1.window.showQuickPick(items)) {
            if (pick.type === 'noSubscriptions') {
                vscode_1.commands.executeCommand('azure-account.createAccount');
                break;
            }
            changed = true;
            switch (pick.type) {
                case 'selectAll':
                    if (resourceFilter[0] !== 'all') {
                        for (const subscription of await subscriptions) {
                            if (subscription.selected) {
                                this.removeFilter(resourceFilter, subscription);
                            }
                        }
                        resourceFilter.push('all');
                    }
                    break;
                case 'deselectAll':
                    if (resourceFilter[0] === 'all') {
                        resourceFilter.splice(0, 1);
                    }
                    else {
                        for (const subscription of await subscriptions) {
                            if (subscription.selected) {
                                this.removeFilter(resourceFilter, subscription);
                            }
                        }
                    }
                    break;
                case 'item':
                    if (resourceFilter[0] === 'all') {
                        resourceFilter.splice(0, 1);
                        for (const subscription of await subscriptions) {
                            this.addFilter(resourceFilter, subscription);
                        }
                    }
                    if (pick.selected) {
                        this.removeFilter(resourceFilter, pick);
                    }
                    else {
                        this.addFilter(resourceFilter, pick);
                    }
                    break;
            }
        }
        if (changed) {
            await this.updateConfiguration(azureConfig, resourceFilter);
        }
    }
    addFilter(resourceFilter, item) {
        const { session, subscription } = item.subscription;
        resourceFilter.push(`${session.tenantId}/${subscription.subscriptionId}`);
        item.selected = true;
    }
    removeFilter(resourceFilter, item) {
        const { session, subscription } = item.subscription;
        const remove = resourceFilter.indexOf(`${session.tenantId}/${subscription.subscriptionId}`);
        resourceFilter.splice(remove, 1);
        item.selected = false;
    }
    async loadSubscriptions() {
        const subscriptions = [];
        for (const session of this.api.sessions) {
            const credentials = session.credentials;
            const client = new azure_arm_resource_1.SubscriptionClient(credentials);
            const list = await listAll(client.subscriptions, client.subscriptions.list());
            const items = list.map(subscription => ({
                session,
                subscription,
            }));
            subscriptions.push(...items);
        }
        subscriptions.sort((a, b) => a.subscription.displayName.localeCompare(b.subscription.displayName));
        return subscriptions;
    }
    asSubscriptionItems(subscriptions, resourceFilter) {
        return subscriptions.map(subscription => {
            const selected = resourceFilter.indexOf(`${subscription.session.tenantId}/${subscription.subscription.subscriptionId}`) !== -1;
            return {
                type: 'item',
                get label() {
                    let selected = this.selected;
                    if (!selected) {
                        selected = resourceFilter[0] === 'all';
                    }
                    return `${getCheckmark(selected)} ${this.subscription.subscription.displayName}`;
                },
                description: subscription.subscription.subscriptionId,
                subscription,
                selected,
            };
        });
    }
    async updateConfiguration(azureConfig, resourceFilter) {
        const resourceFilterConfig = azureConfig.inspect('resourceFilter');
        let target = vscode_1.ConfigurationTarget.Global;
        if (resourceFilterConfig) {
            if (resourceFilterConfig.workspaceFolderValue) {
                target = vscode_1.ConfigurationTarget.WorkspaceFolder;
            }
            else if (resourceFilterConfig.workspaceValue) {
                target = vscode_1.ConfigurationTarget.Workspace;
            }
            else if (resourceFilterConfig.globalValue) {
                target = vscode_1.ConfigurationTarget.Global;
            }
        }
        await azureConfig.update('resourceFilter', resourceFilter[0] !== 'all' ? resourceFilter : undefined, target);
    }
    async updateFilters(configChange = false) {
        const azureConfig = vscode_1.workspace.getConfiguration('azure');
        let resourceFilter = azureConfig.get('resourceFilter');
        if (configChange && JSON.stringify(resourceFilter) === this.oldResourceFilter) {
            return;
        }
        this.filters = (async () => {
            await this.waitForSubscriptions();
            this.oldResourceFilter = JSON.stringify(resourceFilter);
            if (resourceFilter && !Array.isArray(resourceFilter)) {
                resourceFilter = [];
            }
            const filters = resourceFilter && resourceFilter.reduce((f, s) => {
                if (typeof s === 'string') {
                    f[s] = true;
                }
                return f;
            }, {});
            const subscriptions = await this.subscriptions;
            const newFilters = filters ? subscriptions.filter(s => filters[`${s.session.tenantId}/${s.subscription.subscriptionId}`]) : subscriptions;
            this.api.filters.splice(0, this.api.filters.length, ...newFilters);
            this.onFiltersChanged.fire();
            return this.api.filters;
        })();
    }
    async waitForLogin() {
        switch (this.api.status) {
            case 'LoggedIn':
                return true;
            case 'LoggedOut':
                return false;
            case 'Initializing':
            case 'LoggingIn':
                return new Promise(resolve => {
                    const subscription = this.api.onStatusChanged(() => {
                        subscription.dispose();
                        resolve(this.waitForLogin());
                    });
                });
            default:
                const status = this.api.status;
                throw new Error(`Unexpected status '${status}'`);
        }
    }
    async waitForFilters() {
        if (!(await this.waitForSubscriptions())) {
            return false;
        }
        await this.filters;
        return true;
    }
}
exports.AzureLoginHelper = AzureLoginHelper;
async function deviceLogin1() {
    return new Promise((resolve, reject) => {
        const cache = new MemoryCache();
        const context = new AuthenticationContext(authorityUrl, validateAuthority, cache);
        context.acquireUserCode(resource, clientId, 'en-us', function (err, response) {
            if (err) {
                reject(new AzureLoginError(localize('azure-account.userCodeFailed', "Acquiring user code failed"), err));
            }
            else {
                resolve(response);
            }
        });
    });
}
async function deviceLogin2(deviceLogin) {
    return new Promise((resolve, reject) => {
        const tokenCache = new MemoryCache();
        const context = new AuthenticationContext(authorityUrl, validateAuthority, tokenCache);
        context.acquireTokenWithDeviceCode(resource, clientId, deviceLogin, function (err, tokenResponse) {
            if (err) {
                reject(new AzureLoginError(localize('azure-account.tokenFailed', "Acquiring token with device code failed"), err));
            }
            else {
                resolve(tokenResponse);
            }
        });
    });
}
async function tokenFromRefreshToken(refreshToken, tenantId = commonTenantId) {
    return new Promise((resolve, reject) => {
        const tokenCache = new MemoryCache();
        const context = new AuthenticationContext(`${authorityHostUrl}${tenantId}`, validateAuthority, tokenCache);
        context.acquireTokenWithRefreshToken(refreshToken, clientId, null, function (err, tokenResponse) {
            if (err) {
                reject(new AzureLoginError(localize('azure-account.tokenFromRefreshTokenFailed', "Acquiring token with refresh token failed"), err));
            }
            else {
                resolve(tokenResponse);
            }
        });
    });
}
async function tokensFromToken(firstTokenResponse) {
    const tokenResponses = [firstTokenResponse];
    const tokenCache = new MemoryCache();
    await addTokenToCache(tokenCache, firstTokenResponse);
    const credentials = new ms_rest_azure_1.DeviceTokenCredentials({ username: firstTokenResponse.userId, clientId, tokenCache });
    const client = new azure_arm_resource_1.SubscriptionClient(credentials);
    const tenants = await listAll(client.tenants, client.tenants.list());
    for (const tenant of tenants) {
        if (tenant.tenantId !== firstTokenResponse.tenantId) {
            const tokenResponse = await tokenFromRefreshToken(firstTokenResponse.refreshToken, tenant.tenantId);
            tokenResponses.push(tokenResponse);
        }
    }
    return tokenResponses;
}
async function addTokenToCache(tokenCache, tokenResponse) {
    return new Promise((resolve, reject) => {
        const driver = new CacheDriver({ _logContext: createLogContext('') }, `${authorityHostUrl}${tokenResponse.tenantId}`, tokenResponse.resource, clientId, tokenCache, (entry, resource, callback) => {
            callback(null, entry);
        });
        driver.add(tokenResponse, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
async function clearTokenCache(tokenCache) {
    await new Promise((resolve, reject) => {
        tokenCache.find({}, (err, entries) => {
            if (err) {
                reject(err);
            }
            else {
                tokenCache.remove(entries, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    });
}
async function listAll(client, first) {
    const all = [];
    for (let list = await first; list.length || list.nextLink; list = list.nextLink ? await client.listNext(list.nextLink) : []) {
        all.push(...list);
    }
    return all;
}
exports.listAll = listAll;
function getCheckmark(selected) {
    // Check box: '\u2611' : '\u2610'
    // Check mark: '\u2713' : '\u2003'
    // Check square: '\u25A3' : '\u25A1'
    return selected ? '\u2713' : '\u2003';
}
async function exitCode(command, ...args) {
    return new Promise(resolve => {
        cp.spawn(command, args)
            .on('error', err => resolve())
            .on('exit', code => resolve(code));
    });
}
//# sourceMappingURL=azure-account.js.map