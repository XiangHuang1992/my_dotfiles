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
const crypto = require("crypto");
const path = require("path");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const logger_1 = require("./logger");
function shortHashPII(value) {
    const hash = crypto.createHash('sha256');
    hash.update(value);
    return hash.digest('hex').substr(0, 8);
}
function removePath(filePath) {
    return filePath.replace(/([A-Z]:)?[\\\/](.*[\\\/])*/gi, '');
}
class Telemetry {
    constructor() {
        const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
        const { name, version, aiKey } = require(packageJsonPath);
        this.reporter = new vscode_extension_telemetry_1.default(name, version, aiKey);
        this.contextProperties = {};
    }
    static get Instance() {
        if (!Telemetry.singleton) {
            Telemetry.singleton = new Telemetry();
        }
        return Telemetry.singleton;
    }
    addContextProperty(property, value, isPII = false) {
        if (value === undefined) {
            return;
        }
        const valueString = String(value);
        if (isPII && !Telemetry.canCollectPII) {
            this.contextProperties[property] = shortHashPII(valueString);
        }
        else {
            this.contextProperties[property] = valueString;
        }
    }
    removeContextProperty(property) {
        delete this.contextProperties[property];
    }
    sendTelemetryEvent(eventName, properties, measures) {
        if (this.reporter === undefined) {
            logger_1.Instance.write("Tried to send a telemetry event but the reporter has been disposed.");
            return;
        }
        this.reporter.sendTelemetryEvent(eventName, this.addContextPropertiesToObject(properties), measures);
    }
    sendFault(eventName, type, details, exception, correlatedEvent) {
        (new Fault(eventName, type, details, exception, correlatedEvent)).send();
    }
    addContextPropertiesToObject(properties) {
        return Object.assign({}, this.contextProperties, properties);
    }
    setCorrelationEvent(correlationEvent) {
        this.correlationEvent = correlationEvent;
    }
    removeCorrelationEvent(correlationEvent) {
        if (this.correlationEvent === correlationEvent) {
            this.correlationEvent = undefined;
        }
    }
    startTimedEvent(eventName, correlate = false) {
        return new TimedEvent(eventName, correlate);
    }
    correlate(telemetryEvent) {
        if (this.correlationEvent) {
            telemetryEvent.correlateWith(this.correlationEvent);
        }
    }
}
Telemetry.canCollectPII = false;
exports.Telemetry = Telemetry;
const Instance = Telemetry.Instance;
exports.Instance = Instance;
class TelemetryEvent {
    constructor(eventName, correlate = false) {
        this.eventName = eventName;
        this.properties = {};
        this.measures = {};
        this.correlationId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        if (correlate) {
            Instance.correlate(this);
        }
    }
    static create(property, data) {
        const correlate = data ? !!data.correlate : false;
        const telemetryEvent = new TelemetryEvent(property, correlate);
        if (data.properties) {
            let properties = data.properties;
            Object.keys(data.properties)
                .forEach(key => telemetryEvent.addProperty(TelemetryPropertyNames.FEATURE_NAME + key, properties[key]));
        }
        if (data.measures) {
            let measures = data.measures;
            Object.keys(data.measures)
                .forEach(key => telemetryEvent.addMeasure(TelemetryPropertyNames.FEATURE_NAME + key, measures[key]));
        }
        return telemetryEvent;
    }
    addProperty(property, value, isPII = false) {
        if (value === undefined) {
            return;
        }
        const valueString = String(value);
        if (isPII && !Telemetry.canCollectPII) {
            this.properties[property] = shortHashPII(valueString);
        }
        else {
            this.properties[property] = valueString;
        }
    }
    propertyExists(property) {
        return property in this.properties;
    }
    addMeasure(measure, value) {
        this.measures[measure] = value;
    }
    getCorrelationId() {
        return this.correlationId;
    }
    correlateWith(otherEvent) {
        this.correlationId = otherEvent.getCorrelationId();
    }
    correlateWithId(correlationId) {
        this.correlationId = correlationId;
    }
    send() {
        return __awaiter(this, void 0, void 0, function* () {
            this.addMeasure(TelemetryPropertyNames.CORRELATION_ID, this.correlationId);
            Instance.sendTelemetryEvent(this.eventName, this.properties, this.measures);
        });
    }
}
exports.TelemetryEvent = TelemetryEvent;
class Fault extends TelemetryEvent {
    constructor(eventName, type, details, exception, correlatedEvent) {
        super(eventName);
        this.addProperty(TelemetryPropertyNames.FAULT_TYPE, FaultType[type]);
        if (details) {
            this.addProperty(TelemetryPropertyNames.EVENT_MESSAGE, removePath(details));
        }
        let exceptionStack = '';
        if (exception && exception.stack && typeof exception.stack === 'string') {
            exceptionStack += removePath(exception.stack);
        }
        if (!exceptionStack) {
            exceptionStack = 'No Stack';
        }
        this.addProperty(TelemetryPropertyNames.EVENT_EXCEPTION_STACK, exceptionStack);
        if (correlatedEvent) {
            this.correlateWith(correlatedEvent);
        }
    }
}
exports.Fault = Fault;
class TimedEvent extends TelemetryEvent {
    constructor(eventName, correlate = false) {
        super(eventName, correlate);
        this.startTime = (new Date()).getTime();
        this.lastMarkTime = this.startTime;
    }
    markTime(markName, fromStart = false) {
        let currentTime = (new Date()).getTime();
        let duration = fromStart ? (currentTime - this.startTime) : (currentTime - this.lastMarkTime);
        this.lastMarkTime = currentTime;
        this.addMeasure(markName, duration);
    }
    end(result, message, sendNow = true) {
        this.addProperty(TelemetryPropertyNames.EVENT_RESULT, TelemetryResult[result]);
        if (message) {
            this.addProperty(TelemetryPropertyNames.EVENT_MESSAGE, removePath(message));
        }
        this.markTime(TelemetryPropertyNames.EVENT_DURATION, true);
        Instance.removeCorrelationEvent(this);
        if (sendNow) {
            this.send();
        }
    }
}
exports.TimedEvent = TimedEvent;
var FaultType;
(function (FaultType) {
    FaultType[FaultType["Error"] = 0] = "Error";
    FaultType[FaultType["User"] = 1] = "User";
    FaultType[FaultType["Unknown"] = 2] = "Unknown";
})(FaultType = exports.FaultType || (exports.FaultType = {}));
var TelemetryResult;
(function (TelemetryResult) {
    TelemetryResult[TelemetryResult["Cancel"] = 0] = "Cancel";
    TelemetryResult[TelemetryResult["Success"] = 1] = "Success";
    TelemetryResult[TelemetryResult["Failure"] = 2] = "Failure";
    TelemetryResult[TelemetryResult["UserFailure"] = 3] = "UserFailure";
    TelemetryResult[TelemetryResult["IndeterminateFailure"] = 4] = "IndeterminateFailure";
})(TelemetryResult = exports.TelemetryResult || (exports.TelemetryResult = {}));
class TelemetryEventNames {
}
TelemetryEventNames.COMPLETION_ITEM_SELECTED = 'completion-item-selected';
TelemetryEventNames.DOWNLOAD_BLOB = 'download-blob';
TelemetryEventNames.DOWNLOAD_BLOB_FAULT = 'download-blob-fault';
TelemetryEventNames.DOWNLOAD_BLOB_FILESYSTEM_FAULT = 'download-blob-filesystem-fault';
TelemetryEventNames.DOWNLOAD_BLOB_MKDIR_FAULT = 'download-blob-mkdir-fault';
TelemetryEventNames.INTELLICODE_SERVICE_GET_LATEST_MODEL = 'intellicode-service-get-latest-model';
TelemetryEventNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_FAULT = 'intellicode-service-get-latest-model-fault';
TelemetryEventNames.INTELLICODE_SERVICE_GET_REPO_ID_NOT_IMPLEMENTED = 'intellicode-service-get-repo-id-not-implemented';
TelemetryEventNames.MODEL_PROVIDER_LOAD_NO_MATCH = 'model-provider-load-no-match';
TelemetryEventNames.MODEL_CACHE_STORE_FROM_BLOB = 'model-cache-store-from-blob';
TelemetryEventNames.MODEL_REQUEST_END_TO_END = 'model-request-end-to-end';
TelemetryEventNames.MODEL_REQUEST_END_TO_END_FAULT = 'model-request-end-to-end-fault';
TelemetryEventNames.MODEL_CACHE_HIT_FRESH = 'model-cache-hit-fresh';
TelemetryEventNames.MODEL_CACHE_HIT_STALE_CURRENT = 'model-cache-hit-stale-current';
TelemetryEventNames.MODEL_CACHE_MISS_OR_STALE_OUTDATED = 'model-cache-miss-or-stale-outdated';
TelemetryEventNames.EXTENSION_ACTIVATED = 'extension-activated';
TelemetryEventNames.LANGUAGE_ACTIVATED = 'language-activated';
TelemetryEventNames.LANGUAGE_ACTIVATION_FAULT = 'language-activation-fault';
TelemetryEventNames.USER_CONFIG_REQUIRED_CANNOT_ACTIVATE = 'user-config-required-cannot-activate';
TelemetryEventNames.USER_CONFIG_FAILED_TO_APPLY = 'user-config-failed-to-apply';
TelemetryEventNames.USER_CONFIG_APPLIED = 'user-config-applied';
TelemetryEventNames.USER_CONFIG_DECLINED = 'user-config-declined';
TelemetryEventNames.USER_CONFIG_INTELLICODE_PYTHON_COMPLETIONS_DISABLED = 'user-config-intellicode-python-completions-disabled';
TelemetryEventNames.USER_CONFIG_INTELLICODE_JAVA_COMPLETIONS_DISABLED = 'user-config-intellicode-java-completions-disabled';
exports.TelemetryEventNames = TelemetryEventNames;
class TelemetryPropertyNames {
}
TelemetryPropertyNames.FEATURE_NAME = 'intellicode.';
TelemetryPropertyNames.CORRELATION_ID = TelemetryPropertyNames.FEATURE_NAME + 'CorrelationId';
TelemetryPropertyNames.EVENT_RESULT = TelemetryPropertyNames.FEATURE_NAME + 'Result';
TelemetryPropertyNames.EVENT_MESSAGE = TelemetryPropertyNames.FEATURE_NAME + 'Message';
TelemetryPropertyNames.EVENT_DURATION = TelemetryPropertyNames.FEATURE_NAME + 'Duration';
TelemetryPropertyNames.EVENT_EXCEPTION_STACK = TelemetryPropertyNames.FEATURE_NAME + 'ExceptionStack';
TelemetryPropertyNames.EVENT_EXCEPTION_CODE = TelemetryPropertyNames.FEATURE_NAME + 'ExceptionCode';
TelemetryPropertyNames.FAULT_TYPE = TelemetryPropertyNames.FEATURE_NAME + 'FaultType';
TelemetryPropertyNames.OS_PLATFORM = TelemetryPropertyNames.FEATURE_NAME + 'OSPlatform';
TelemetryPropertyNames.OS_ARCH = TelemetryPropertyNames.FEATURE_NAME + 'OSArch';
TelemetryPropertyNames.DOWNLOAD_RECEIVED = TelemetryPropertyNames.FEATURE_NAME + 'DownloadReceived';
TelemetryPropertyNames.DOWNLOAD_TOTAL = TelemetryPropertyNames.FEATURE_NAME + 'DownloadTotal';
TelemetryPropertyNames.INTELLICODE_SERVICE_ENDPOINT = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceEndpoint';
TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_RESULT_ID = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceGetLatestModelResultId';
TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_RESULT_CREATION_TIME = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceGetLatestModelResultCreationTime';
TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_RESULT_SCHEMA_VERSION = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceGetLatestModelResultSchemaVersion';
TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_RESULT_BLOB_URI = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceGetLatestModelResultBlobUri';
TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_ANALYZER_NAME = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceGetLatestModelAnalyzerName';
TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_DECLARED_NAME = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceGetLatestModelDeclaredName';
TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_MIN_SCHEMA_VERSION = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceGetLatestModelMinSchemaVersion';
TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_MAX_SCHEMA_VERSION = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceGetLatestModelMaxSchemaVersion';
TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_TAGS = TelemetryPropertyNames.FEATURE_NAME + 'IntelliCodeServiceGetLatestModelTags';
TelemetryPropertyNames.CACHE_SIZE_ON_DISK = TelemetryPropertyNames.FEATURE_NAME + 'CacheSizeOnDisk';
TelemetryPropertyNames.LANGUAGE = TelemetryPropertyNames.FEATURE_NAME + 'Language';
TelemetryPropertyNames.LANGUAGE_EXTENSION_VERSIONS = TelemetryPropertyNames.FEATURE_NAME + 'LanguageExtensionVersions';
exports.TelemetryPropertyNames = TelemetryPropertyNames;
//# sourceMappingURL=telemetry.js.map