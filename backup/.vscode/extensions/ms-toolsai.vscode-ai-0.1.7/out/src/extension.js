/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const app_module_path_1 = require("app-module-path");
app_module_path_1.addPath(__dirname);
// tslint:disable
if (Reflect.metadata === undefined) {
    require('reflect-metadata');
}
const component = require("common/component");
const telemetryManager_1 = require("common/telemetryManager");
const registerProvider_1 = require("interfaces/registerProvider");
const editorToolkit_1 = require("uiToolkits/editorToolkit");
const webServer_1 = require("webServer");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
async function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    component.initialize(context);
    const providers = await component.imports(registerProvider_1.RegisterProvider);
    for (const provider of providers) {
        await provider.register();
    }
    await component.get(webServer_1.WebServer).start();
    component.get(telemetryManager_1.TelemetryManager).enqueueTelemetryMsg('Extension', { Name: 'activate' });
}
exports.activate = activate;
// this method is called when your extension is deactivated
async function deactivate() {
    component.get(telemetryManager_1.TelemetryManager).enqueueTelemetryMsg('Extension', { Name: 'deactivate' });
    await component.get(editorToolkit_1.EditorToolkit).cleanUp();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map