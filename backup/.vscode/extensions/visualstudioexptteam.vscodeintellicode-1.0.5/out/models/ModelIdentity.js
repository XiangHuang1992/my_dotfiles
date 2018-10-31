"use strict";
/*! Copyright (c) Microsoft Corporation. All rights reserved. */
Object.defineProperty(exports, "__esModule", { value: true });
class ModelIdentity {
    constructor(intellicodeModelId, creationTimeUtc) {
        this.intellicodeModelId = intellicodeModelId;
        this.creationTimeUtc = creationTimeUtc;
    }
    static Equals(a, b) {
        try {
            return a.intellicodeModelId === b.intellicodeModelId
                && a.creationTimeUtc === b.creationTimeUtc;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.ModelIdentity = ModelIdentity;
//# sourceMappingURL=ModelIdentity.js.map