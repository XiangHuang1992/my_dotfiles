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
const telemetry_1 = require("./telemetry");
class ConfigUtil {
    static checkIfIntelliCodeEnabled(language) {
        return this.getFlagValue("vsintellicode", `${language}.completionsEnabled`) === true;
    }
    static promptConfigsIfNeeded(requestedConfigs) {
        let okToActivate = true;
        for (let requestedConfig of requestedConfigs) {
            if (this.getFlagValue(requestedConfig.scopeName, requestedConfig.settingName) !== requestedConfig.desiredValue) {
                vscode.window.showErrorMessage(requestedConfig.notificationMessage, requestedConfig.actionLabel, "Later")
                    .then((selectedOption) => __awaiter(this, void 0, void 0, function* () {
                    if (selectedOption !== requestedConfig.actionLabel) {
                        telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.USER_CONFIG_DECLINED);
                        return;
                    }
                    let result = yield this.ensureConfig(requestedConfig);
                    if (!result) {
                        vscode.window.showErrorMessage(`IntelliCode wasn't able to apply the user setting '${requestedConfig.scopeName}.${requestedConfig.settingName}': '${requestedConfig.desiredValue}' automatically, please manually set it.`);
                        telemetry_1.Instance.sendFault(telemetry_1.TelemetryEventNames.USER_CONFIG_FAILED_TO_APPLY, telemetry_1.FaultType.Error, `Couldn't set ${requestedConfig.scopeName}.${requestedConfig.settingName} to ${requestedConfig.desiredValue}`);
                        return;
                    }
                    telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.USER_CONFIG_APPLIED);
                    if (requestedConfig.reloadWindowAfterApplying) {
                        vscode.commands.executeCommand("workbench.action.reloadWindow");
                    }
                }));
                if (requestedConfig.required) {
                    okToActivate = false;
                }
            }
        }
        if (!okToActivate) {
            telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.USER_CONFIG_REQUIRED_CANNOT_ACTIVATE);
        }
        return okToActivate;
    }
    static getFlagValue(scopeName, settingName) {
        return vscode.workspace.getConfiguration(scopeName, null).get(settingName);
    }
    static ensureConfig(requestedConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let configuration = vscode.workspace.getConfiguration(requestedConfig.scopeName, null);
            if (!configuration) {
                return false;
            }
            let details = configuration.inspect(requestedConfig.settingName);
            if (!details || !details.defaultValue) {
                return false;
            }
            if (this.getFlagValue(requestedConfig.scopeName, requestedConfig.settingName) === requestedConfig.desiredValue) {
                return true;
            }
            for (let scope of requestedConfig.scopesToTry) {
                yield configuration.update(requestedConfig.settingName, requestedConfig.desiredValue, scope);
                configuration = vscode.workspace.getConfiguration(requestedConfig.scopeName, null);
                if (this.getFlagValue(requestedConfig.scopeName, requestedConfig.settingName) === requestedConfig.desiredValue) {
                    return true;
                }
            }
            return false;
        });
    }
}
exports.ConfigUtil = ConfigUtil;
//# sourceMappingURL=config.js.map