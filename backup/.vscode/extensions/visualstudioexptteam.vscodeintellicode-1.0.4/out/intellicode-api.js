"use strict";
/*! Copyright (c) Microsoft Corporation. All rights reserved. */
Object.defineProperty(exports, "__esModule", { value: true });
const ModelProviderFactory_1 = require("./models/ModelProviderFactory");
class IntelliCode {
    constructor(extensionRoot, tags) {
        this.ModelAcquisitionService = new ModelAcquisitionService(extensionRoot, tags);
    }
}
exports.IntelliCode = IntelliCode;
class ModelAcquisitionService {
    constructor(extensionRoot, tags = []) {
        this.extensionRoot = extensionRoot;
        this.globalTags = tags;
    }
    getModelProvider(analyzerName, modelName, minSchemaVersion, maxSchemaVersion, tags) {
        return ModelProviderFactory_1.CreateModelProvider(analyzerName, modelName, minSchemaVersion, maxSchemaVersion, tags.concat(this.globalTags), this.extensionRoot);
    }
}
exports.ModelAcquisitionService = ModelAcquisitionService;
//# sourceMappingURL=intellicode-api.js.map