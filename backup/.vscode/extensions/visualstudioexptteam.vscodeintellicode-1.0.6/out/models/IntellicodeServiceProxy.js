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
const ModelQueryResult_1 = require("./ModelQueryResult");
const rpn = require("request-promise-native");
const ModelIdentity_1 = require("./ModelIdentity");
const ModelInfo_1 = require("./ModelInfo");
const logger_1 = require("../util/logger");
const telemetry_1 = require("../util/telemetry");
class IntellicodeServiceProxy {
    constructor() {
    }
    GetLatestModelAsync(repoUri, analyzerName, declaredName, minSchemaVersion, maxSchemaVersion, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            let tagsQueryString = tags.reduce((prevTags, tag) => prevTags + `&tag=${tag}`, "");
            let subPath = `analyzers/${analyzerName}/models/latest?declaredName=${declaredName}&minSchemaVersion=${minSchemaVersion}&maxSchemaVersion=${maxSchemaVersion}${tagsQueryString}`;
            let repoId;
            if (repoUri !== undefined) {
                repoId = yield this.GetRepoIdAsync(repoUri);
            }
            let uri = repoId !== undefined
                ? `${IntellicodeServiceProxy.Endpoint}/repos/${repoId}/${subPath}`
                : `${IntellicodeServiceProxy.Endpoint}/repoAgnostic/${subPath}`;
            let options = {
                uri: uri,
            };
            let telemetryEvent = telemetry_1.Instance.startTimedEvent(telemetry_1.TelemetryEventNames.INTELLICODE_SERVICE_GET_LATEST_MODEL, true);
            logger_1.Instance.write("Querying IntelliCode service for available models.");
            logger_1.Instance.write(`Endpoint: ${uri}`);
            telemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.INTELLICODE_SERVICE_ENDPOINT, uri);
            telemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_ANALYZER_NAME, analyzerName);
            telemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_MIN_SCHEMA_VERSION, minSchemaVersion);
            telemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_MAX_SCHEMA_VERSION, maxSchemaVersion);
            telemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_TAGS, tags);
            return rpn.get(options)
                .then((body) => {
                let fileshare;
                let identity;
                try {
                    fileshare = JSON.parse(body);
                    identity = new ModelIdentity_1.ModelIdentity(fileshare.id, fileshare.creationTimeUtc);
                }
                catch (err) {
                    telemetry_1.Instance.sendFault(telemetry_1.TelemetryEventNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_FAULT, telemetry_1.FaultType.Error, "Couldn't parse json or missing properties", err);
                    telemetryEvent.end(telemetry_1.TelemetryResult.Failure, "Result returned from service was not parseable");
                    logger_1.Instance.write("Result returned from service was not parseable");
                    throw err;
                }
                let info = new ModelInfo_1.ModelInfo(analyzerName, fileshare.provenance.declaredName, repoUri, identity, fileshare.provenance.schemaVersion, tags);
                telemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_RESULT_ID, fileshare.id);
                telemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_RESULT_CREATION_TIME, fileshare.creationTimeUtc);
                telemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_RESULT_SCHEMA_VERSION, fileshare.provenance.schemaVersion);
                telemetryEvent.addProperty(telemetry_1.TelemetryPropertyNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_RESULT_BLOB_URI, fileshare.blobUri);
                telemetryEvent.end(telemetry_1.TelemetryResult.Success);
                return Promise.resolve(new ModelQueryResult_1.ModelQueryResult(info, fileshare.blobUri));
            })
                .catch((err) => {
                telemetry_1.Instance.sendFault(telemetry_1.TelemetryEventNames.INTELLICODE_SERVICE_GET_LATEST_MODEL_FAULT, telemetry_1.FaultType.Error, "Missing property in model info", err);
                telemetryEvent.end(telemetry_1.TelemetryResult.IndeterminateFailure);
                throw err;
            });
        });
    }
    GetRepoIdAsync(repoUri) {
        return __awaiter(this, void 0, void 0, function* () {
            telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.INTELLICODE_SERVICE_GET_REPO_ID_NOT_IMPLEMENTED);
            return undefined;
        });
    }
}
IntellicodeServiceProxy.Endpoint = "https://ppe.intellicode.vsengsaas.visualstudio.com/api/v2";
exports.IntellicodeServiceProxy = IntellicodeServiceProxy;
//# sourceMappingURL=IntellicodeServiceProxy.js.map