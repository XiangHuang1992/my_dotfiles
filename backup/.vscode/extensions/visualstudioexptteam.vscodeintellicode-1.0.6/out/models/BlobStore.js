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
const fs = require("async-file");
const path = require("path");
const request = require("request");
const requestProgress = require("request-progress");
const vscode = require("vscode");
const logger_1 = require("../util/logger");
const telemetry_1 = require("../util/telemetry");
class BlobStore {
    DownloadBlobToFileAsync(blobUri, destinationFilePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let downloadTelemetryEvent = telemetry_1.Instance.startTimedEvent(telemetry_1.TelemetryEventNames.DOWNLOAD_BLOB, true);
            let options = {
                uri: blobUri,
                encoding: null
            };
            logger_1.Instance.write(`Starting download of ${blobUri}`);
            const title = "Downloading IntelliCode models";
            let dirName = path.dirname(destinationFilePath);
            yield fs.mkdirp(dirName).catch((err) => {
                telemetry_1.Instance.sendFault(telemetry_1.TelemetryEventNames.DOWNLOAD_BLOB_MKDIR_FAULT, telemetry_1.FaultType.Error, "Couldn't mkdirp", err);
                throw err;
            });
            const fileStream = fs.createWriteStream(destinationFilePath);
            fileStream.on('finish', () => {
                fileStream.close();
            })
                .on('error', (err) => {
                telemetry_1.Instance.sendFault(telemetry_1.TelemetryEventNames.DOWNLOAD_BLOB_FILESYSTEM_FAULT, telemetry_1.FaultType.Error, "Error writing model to file", err);
                throw err;
            });
            let received = -1;
            let total = -1;
            return yield vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: title
            }, (progress) => {
                return new Promise((resolve, reject) => {
                    requestProgress(request.get(options))
                        .on('progress', (state) => {
                        received = Math.round(state.size.transferred / 1024);
                        total = Math.round(state.size.total / 1024);
                        const percentage = Math.round(100 * state.percent);
                        progress.report({
                            message: `${title}: ${received} of ${total} KB (${percentage}%)`
                        });
                    })
                        .on('error', (err) => {
                        telemetry_1.Instance.sendFault(telemetry_1.TelemetryEventNames.DOWNLOAD_BLOB_FAULT, telemetry_1.FaultType.Unknown, "Error while downloading model", err);
                        downloadTelemetryEvent.addMeasure(telemetry_1.TelemetryPropertyNames.DOWNLOAD_RECEIVED, received);
                        downloadTelemetryEvent.addMeasure(telemetry_1.TelemetryPropertyNames.DOWNLOAD_TOTAL, total);
                        downloadTelemetryEvent.end(telemetry_1.TelemetryResult.IndeterminateFailure, "Error while downloading model: " + logger_1.Instance.formatErrorForLogging(err));
                        throw new Error(err);
                    })
                        .on('end', () => {
                        downloadTelemetryEvent.addMeasure(telemetry_1.TelemetryPropertyNames.DOWNLOAD_TOTAL, total);
                        downloadTelemetryEvent.end(telemetry_1.TelemetryResult.Success);
                        logger_1.Instance.write("Download complete.");
                        resolve();
                    })
                        .pipe(fileStream);
                });
            });
        });
    }
}
exports.BlobStore = BlobStore;
//# sourceMappingURL=BlobStore.js.map