"use strict";
/*! Copyright (c) Microsoft Corporation. All rights reserved. */
Object.defineProperty(exports, "__esModule", { value: true });
const blobStore_1 = require("./blobStore");
const ModelProvider_1 = require("./ModelProvider");
const filesystemJsonStore_1 = require("./filesystemJsonStore");
const ModelCache_1 = require("./ModelCache");
const IntellicodeServiceProxy_1 = require("./IntellicodeServiceProxy");
function CreateModelProvider(analyzerName, modelName, minSchemaVersion, maxSchemaVersion, tags, extensionRoot) {
    let blobStore = new blobStore_1.BlobStore();
    let intellicodeService = new IntellicodeServiceProxy_1.IntellicodeServiceProxy();
    let fileStore = new filesystemJsonStore_1.FilesystemJsonStore(extensionRoot);
    let modelCache = new ModelCache_1.ModelCache(fileStore, blobStore);
    return new ModelProvider_1.ModelProvider(analyzerName, modelName, minSchemaVersion, maxSchemaVersion, tags, intellicodeService, modelCache);
}
exports.CreateModelProvider = CreateModelProvider;
//# sourceMappingURL=ModelProviderFactory.js.map