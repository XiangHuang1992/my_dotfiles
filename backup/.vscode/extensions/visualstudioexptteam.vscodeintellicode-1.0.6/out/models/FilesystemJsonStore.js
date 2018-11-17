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
const path = require("path");
const fs = require("async-file");
class FilesystemJsonStore {
    constructor(userDataFolderPath) {
        this.userDataFolderPath = path.join(userDataFolderPath);
    }
    LoadAsync(jsonPath, defaultValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let path = this.GetSystemFilePath(jsonPath);
            return fs.readFile(path, 'utf8')
                .then((f) => {
                return JSON.parse(f);
            })
                .catch(() => defaultValue);
        });
    }
    CreateOrUpdateAsync(jsonPath, createFunc, updateFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileSystemPath = this.GetSystemFilePath(jsonPath);
            const folder = path.dirname(fileSystemPath);
            if (!(yield fs.exists(folder))) {
                fs.createDirectory(folder);
            }
            yield this.CreateOrUpdateAsyncImpl(fileSystemPath, createFunc, updateFunc);
        });
    }
    CreateOrUpdateAsyncImpl(fileSystemPath, createFunc, updateFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            let output;
            let mode;
            if (yield fs.exists(fileSystemPath)) {
                let stats = yield fs.stat(fileSystemPath);
                mode = stats.size > 0 ? OperationMode.Update : OperationMode.Create;
            }
            else {
                mode = OperationMode.Create;
            }
            switch (mode) {
                case OperationMode.Update:
                    try {
                        let contents = yield fs.readFile(fileSystemPath, "utf8");
                        let deserialized = JSON.parse(contents);
                        output = updateFunc(deserialized);
                    }
                    catch (_a) {
                        output = createFunc();
                    }
                    break;
                case OperationMode.Create:
                default:
                    output = createFunc();
                    break;
            }
            yield fs.mkdirp(path.dirname(fileSystemPath));
            yield fs.writeFile(fileSystemPath, JSON.stringify(output), "utf8");
        });
    }
    UpdateAsync(jsonPath, updateFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileSystemPath = this.GetSystemFilePath(jsonPath);
            try {
                yield this.CreateOrUpdateAsyncImpl(fileSystemPath, () => { throw new Error("no-op: Path doesn't exist in UpdateAsync"); }, updateFunc);
            }
            catch (Error) {
            }
        });
    }
    GetSystemFilePath(jsonPath) {
        return path.join(this.userDataFolderPath, ...jsonPath);
    }
}
exports.FilesystemJsonStore = FilesystemJsonStore;
var OperationMode;
(function (OperationMode) {
    OperationMode[OperationMode["Create"] = 0] = "Create";
    OperationMode[OperationMode["Update"] = 1] = "Update";
})(OperationMode || (OperationMode = {}));
//# sourceMappingURL=FilesystemJsonStore.js.map