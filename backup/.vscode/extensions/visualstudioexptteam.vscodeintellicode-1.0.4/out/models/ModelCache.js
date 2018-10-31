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
const ModelIdentity_1 = require("./ModelIdentity");
const ModelInfo_1 = require("./ModelInfo");
const uuidv4 = require("uuid/v4");
const logger_1 = require("../util/logger");
const telemetry_1 = require("../util/telemetry");
const fs = require("async-file");
class ModelCache {
    constructor(store, blobStore) {
        this.store = store;
        this.blobStore = blobStore;
    }
    ContainsAsync(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let matches = yield this.FindModelsAndUpdateLastAccessTimeAsync(m => ModelIdentity_1.ModelIdentity.Equals(m.identity, id));
            return matches.length > 0;
        });
    }
    FindAsync(repoUri, analyzerName, modelName, minSchemaVersion, maxSchemaVersion, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            let matches = yield this.FindModelsAndUpdateLastAccessTimeAsync(m => {
                return m.repoUri === repoUri
                    && m.analyzerName === analyzerName
                    && m.modelName === modelName
                    && m.schemaVersion >= minSchemaVersion
                    && m.schemaVersion <= maxSchemaVersion
                    && this.areTagsSame(this.getUniqueTags(m.tags), this.getUniqueTags(tags));
            });
            return matches.map(m => m.identity);
        });
    }
    LoadAsync(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let matches = yield this.FindModelsAndUpdateLastAccessTimeAsync(m => ModelIdentity_1.ModelIdentity.Equals(m.identity, id));
            if (matches.length === 0) {
                telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.MODEL_PROVIDER_LOAD_NO_MATCH);
                throw new Error("Unable to load model from cache");
            }
            let topMatch = matches[0];
            return {
                modelPath: topMatch.filePath,
                repoUri: topMatch.repoUri,
                schemaVersion: topMatch.schemaVersion,
                tags: topMatch.tags
            };
        });
    }
    StoreFromBlobAsync(modelInfo, blobUri) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileName = uuidv4();
            let filePath = this.store.GetSystemFilePath([ModelCache.ModelFolderName, fileName]);
            try {
                yield this.blobStore.DownloadBlobToFileAsync(blobUri, filePath);
            }
            catch (err) {
                logger_1.Instance.write(`Failed to download model: ${logger_1.Instance.formatErrorForLogging(err)}`);
                throw err;
            }
            let createNewModelInfo = () => [new PersistedModelInfo(modelInfo.analyzerName, modelInfo.modelName, modelInfo.repoUri, modelInfo.identity, modelInfo.schemaVersion, modelInfo.tags, filePath, new Date())];
            let updateModelInfo = (info) => info.concat(createNewModelInfo());
            yield this.store.CreateOrUpdateAsync([ModelCache.ModelFolderName, ModelCache.ModelInfoFileName], createNewModelInfo, updateModelInfo);
            let modelCacheSize = yield this.getModelCacheSize();
            telemetry_1.Instance.sendTelemetryEvent(telemetry_1.TelemetryEventNames.MODEL_CACHE_STORE_FROM_BLOB, undefined, {
                [telemetry_1.TelemetryPropertyNames.CACHE_SIZE_ON_DISK]: modelCacheSize
            });
        });
    }
    FindModelsAndUpdateLastAccessTimeAsync(isMatch) {
        return __awaiter(this, void 0, void 0, function* () {
            let matches = [];
            yield this.store.UpdateAsync([ModelCache.ModelFolderName, ModelCache.ModelInfoFileName], (info) => {
                matches = info.filter(isMatch);
                for (let match of matches) {
                    match.lastAccessTimeUtc = new Date();
                }
                return info;
            });
            return matches;
        });
    }
    getModelCacheSize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let cachePath = this.store.GetSystemFilePath([ModelCache.ModelFolderName]);
                let files = yield fs.readdir(cachePath);
                let size = 0;
                for (let file of files) {
                    let fileStat = yield fs.stat(this.store.GetSystemFilePath([ModelCache.ModelFolderName, file]));
                    size += fileStat.size;
                }
                return size;
            }
            catch (_a) {
                return -1;
            }
        });
    }
    getUniqueTags(tags) {
        return [...new Set(tags)].sort();
    }
    areTagsSame(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
}
ModelCache.ModelInfoFileName = "IntellicodeModels.json";
ModelCache.ModelFolderName = "IntellicodeModels";
exports.ModelCache = ModelCache;
class PersistedModelInfo extends ModelInfo_1.ModelInfo {
    constructor(analyzerName, modelName, repoUri, identity, schemaVersion, tags, filePath, lastAccessTimeUtc) {
        super(analyzerName, modelName, repoUri, identity, schemaVersion, tags);
        this.filePath = filePath;
        this.lastAccessTimeUtc = lastAccessTimeUtc;
    }
}
//# sourceMappingURL=ModelCache.js.map