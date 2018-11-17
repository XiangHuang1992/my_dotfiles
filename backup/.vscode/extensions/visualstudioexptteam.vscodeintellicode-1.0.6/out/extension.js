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
const vsij = require("@vsintellicode/vscode-intellicode-java");
const semver = require("semver");
const intellicode_api_1 = require("./intellicode-api");
const logger_1 = require("./util/logger");
const telemetry_1 = require("./util/telemetry");
const config_1 = require("./util/config");
const LANG_PYTHON = "python";
const LANG_JAVA = "java";
var apiInstance;
var seenLanguages = [];
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        context.subscriptions.push(telemetry_1.Instance.reporter);
        let activateTelemetryEvent = telemetry_1.Instance.startTimedEvent(telemetry_1.TelemetryEventNames.EXTENSION_ACTIVATED, true);
        activateTelemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.LANGUAGE_EXTENSION_VERSIONS, getInstalledExtensionVersions());
        let disposableItemSelectedCommand = vscode.commands.registerCommand('vsintellicode.completionItemSelected', (data) => {
            telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.COMPLETION_ITEM_SELECTED, data);
        });
        context.subscriptions.push(disposableItemSelectedCommand);
        apiInstance = new intellicode_api_1.IntelliCode(context.extensionPath, []);
        yield activateLanguages(getLanguagesFromEditors(vscode.window.visibleTextEditors));
        vscode.workspace.onDidOpenTextDocument(handleOpenedDocument);
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
function activateLanguages(languageIds) {
    return __awaiter(this, void 0, void 0, function* () {
        let newLanguageIds = languageIds.filter((lang) => seenLanguages.indexOf(lang) < 0);
        if (newLanguageIds.length === 0) {
            return;
        }
        if (newLanguageIds.indexOf(LANG_PYTHON) >= 0) {
            if (!config_1.ConfigUtil.checkIfIntelliCodeEnabled(LANG_PYTHON)) {
                telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.USER_CONFIG_INTELLICODE_PYTHON_COMPLETIONS_DISABLED);
            }
            else {
                let languageTelemetryEvent = telemetry_1.Instance.startTimedEvent(telemetry_1.TelemetryEventNames.LANGUAGE_ACTIVATED, true);
                languageTelemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.LANGUAGE, LANG_PYTHON);
                let pythonSupport = new vsip.PythonSupport();
                if (checkPythonExtensionInstalled() && config_1.ConfigUtil.promptConfigsIfNeeded(pythonSupport.getRequestedConfig())) {
                    try {
                        yield pythonSupport.activate(apiInstance, (str) => logger_1.Instance.write(str));
                        languageTelemetryEvent.end(telemetry_1.TelemetryResult.Success);
                    }
                    catch (e) {
                        vscode.window.showErrorMessage("Sorry, something went wrong activating IntelliCode support for Python. Please check the \"Python\" and \"VS IntelliCode\" output windows for details.");
                        logger_1.Instance.write(`Error while activating Python: ${JSON.stringify(e)}`);
                        telemetry_1.Instance.sendFault(telemetry_1.TelemetryEventNames.LANGUAGE_ACTIVATION_FAULT, telemetry_1.FaultType.Error, "Error thrown while trying to activate Python", e);
                        languageTelemetryEvent.end(telemetry_1.TelemetryResult.Failure);
                    }
                }
            }
        }
        if (newLanguageIds.indexOf(LANG_JAVA) >= 0) {
            if (!config_1.ConfigUtil.checkIfIntelliCodeEnabled(LANG_JAVA)) {
                telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.USER_CONFIG_INTELLICODE_JAVA_COMPLETIONS_DISABLED);
            }
            else {
                let languageTelemetryEvent = telemetry_1.Instance.startTimedEvent(telemetry_1.TelemetryEventNames.LANGUAGE_ACTIVATED, true);
                languageTelemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.LANGUAGE, LANG_JAVA);
                let javaSupport = new vsij.JavaSupport();
                if (checkJavaExtensionInstalled() && config_1.ConfigUtil.promptConfigsIfNeeded(javaSupport.getRequestedConfig())) {
                    try {
                        yield javaSupport.activate(apiInstance, (str) => logger_1.Instance.write(str));
                        languageTelemetryEvent.end(telemetry_1.TelemetryResult.Success);
                    }
                    catch (e) {
                        vscode.window.showErrorMessage("Sorry, something went wrong activating IntelliCode support for Java. Please check the \"Language Support for Java\" and \"VS IntelliCode\" output windows for details.");
                        logger_1.Instance.write(`Error while activating Java: ${JSON.stringify(e)}. If vscode-java failed to activate, try these troubleshooting steps: https://github.com/redhat-developer/vscode-java/wiki/Troubleshooting`);
                        telemetry_1.Instance.sendFault(telemetry_1.TelemetryEventNames.LANGUAGE_ACTIVATION_FAULT, telemetry_1.FaultType.Error, "Error thrown while trying to activate Java", e);
                        languageTelemetryEvent.end(telemetry_1.TelemetryResult.Failure);
                    }
                }
            }
        }
        seenLanguages = seenLanguages.concat(newLanguageIds);
    });
}
function handleOpenedDocument(document) {
    activateLanguages([document.languageId]);
}
function getLanguagesFromEditors(editors) {
    let editorLanguages = editors.map((editor) => editor.document.languageId);
    let uniqueLanguages = editorLanguages.filter((lang, index, self) => index === self.indexOf(lang));
    return uniqueLanguages;
}
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
    const minimumPythonVersion = "2018.10.0";
    if (semver.lt(pyExt.packageJSON.version, minimumPythonVersion)) {
        vscode.window.showErrorMessage(`Please update the Python extension to enable IntelliCode.\nIntelliCode requires version ${minimumPythonVersion} or newer.`);
        return false;
    }
    return true;
}
function checkJavaExtensionInstalled() {
    let javaExt = vscode.extensions.getExtension("redhat.java");
    if (javaExt === undefined) {
        vscode.window.showErrorMessage("Please install the Java extension to enable IntelliCode.");
        return false;
    }
    const minimumJavaVersion = "0.32.0";
    if (semver.lt(javaExt.packageJSON.version, minimumJavaVersion)) {
        vscode.window.showErrorMessage(`Please update the Java extension to enable IntelliCode.\nIntelliCode requires version ${minimumJavaVersion} or newer.`);
        return false;
    }
    return true;
}
//# sourceMappingURL=extension.js.map