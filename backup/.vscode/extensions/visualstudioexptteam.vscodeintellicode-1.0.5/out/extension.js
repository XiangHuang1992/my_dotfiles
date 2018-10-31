"use strict";
/*! Copyright (c) Microsoft Corporation. All rights reserved. */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vsip = require("@vsintellicode/vscode-intellicode-python");
const semver = require("semver");
const intellicode_api_1 = require("./intellicode-api");
const logger_1 = require("./util/logger");
const telemetry_1 = require("./util/telemetry");
const config_1 = require("./util/config");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config_1.ConfigUtil.checkIfIntelliCodeEnabled()) {
            telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.USER_CONFIG_INTELLICODE_PYTHON_COMPLETIONS_DISABLED);
            return;
        }
        context.subscriptions.push(telemetry_1.Instance.reporter);
        let activateTelemetryEvent = telemetry_1.Instance.startTimedEvent(telemetry_1.TelemetryEventNames.EXTENSION_ACTIVATED, true);
        activateTelemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.LANGUAGE_EXTENSION_VERSIONS, getInstalledExtensionVersions());
        let disposableItemSelectedCommand = vscode.commands.registerCommand('vsintellicode.completionItemSelected', (data) => {
            telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.COMPLETION_ITEM_SELECTED, data);
        });
        context.subscriptions.push(disposableItemSelectedCommand);
        let api = new intellicode_api_1.IntelliCode(context.extensionPath, []);
        let editorLanguages = vscode.window.visibleTextEditors.map((editor) => editor.document.languageId);
        let uniqueLanguages = editorLanguages.filter((lang, index, self) => index === self.indexOf(lang));
        let languageTelemetryEvent = telemetry_1.Instance.startTimedEvent(telemetry_1.TelemetryEventNames.LANGUAGE_ACTIVATED, true);
        if (uniqueLanguages.indexOf("python") >= 0) {
            languageTelemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.LANGUAGE, "python");
            let pythonSupport = new vsip.PythonSupport();
            if (checkPythonExtensionInstalled() && config_1.ConfigUtil.promptConfigsIfNeeded(pythonSupport.getRequestedConfig())) {
                try {
                    yield pythonSupport.activate(api, (str) => logger_1.Instance.write(str));
                }
                catch (_a) {
                    vscode.window.showErrorMessage("Sorry, something went wrong activating IntelliCode support for Python. Please check the \"VS IntelliCode\" output window for details.");
                }
            }
        }
        languageTelemetryEvent.end(telemetry_1.TelemetryResult.Success);
        activateTelemetryEvent.end(telemetry_1.TelemetryResult.Success);
    });
}
exports.activate = activate;
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        return telemetry_1.Instance.reporter.dispose();
    });
}
exports.deactivate = deactivate;
function getInstalledExtensionVersions() {
    let extensionVersions = {};
    const interestingExtensionIds = ["ms-python.python"];
    for (let id of interestingExtensionIds) {
        try {
            let ext = vscode.extensions.getExtension(id);
            if (ext === undefined) {
                extensionVersions[id] = "NOT_INSTALLED";
            }
            else {
                let version = ext.packageJSON.version;
                extensionVersions[id] = version;
            }
        }
        catch (_a) {
            extensionVersions[id] = "UNKNOWN";
        }
    }
}
function checkPythonExtensionInstalled() {
    let pyExt = vscode.extensions.getExtension("ms-python.python");
    if (pyExt === undefined) {
        vscode.window.showErrorMessage("Please install the Python extension to enable IntelliCode.");
        return false;
    }
    if (semver.lt(pyExt.packageJSON.version, "2018.9.0")) {
        vscode.window.showErrorMessage(`Please update the Python extension to enable IntelliCode.\nIntelliCode requires version 2018.9.0 or newer.`);
        return false;
    }
    return true;
}
//# sourceMappingURL=extension.js.map