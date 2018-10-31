"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const path = require("path");
const fs = require("fs");
class RelativeToWorkspaceRootFileUrlMapper {
    constructor() {
        this.additionalSourceFolder = '';
    }
    map(fileName, imagePath) {
        let absoluteImagePath;
        if (this.workspaceFolder) {
            let rootPath = url.parse(this.workspaceFolder);
            const pathName = url.parse(imagePath).pathname;
            if (pathName) {
                let testImagePath = path.join(rootPath.href, pathName);
                if (fs.existsSync(testImagePath)) {
                    absoluteImagePath = testImagePath;
                }
                else {
                    let testImagePath = path.join(rootPath.href, this.additionalSourceFolder, pathName);
                    if (fs.existsSync(testImagePath)) {
                        absoluteImagePath = testImagePath;
                    }
                }
            }
        }
        return absoluteImagePath;
    }
    refreshConfig(workspaceFolder, sourcefolder) {
        this.workspaceFolder = workspaceFolder;
        this.additionalSourceFolder = sourcefolder;
    }
}
exports.relativeToWorkspaceRootFileUrlMapper = new RelativeToWorkspaceRootFileUrlMapper();
//# sourceMappingURL=relativetoworkspacerootmapper.js.map