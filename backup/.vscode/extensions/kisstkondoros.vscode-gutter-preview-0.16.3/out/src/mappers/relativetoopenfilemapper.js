"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const url = require("url");
const fs = require("fs");
const imagecache_1 = require("../util/imagecache");
exports.relativeToOpenFileUrlMapper = {
    map(fileName, imagePath) {
        let absoluteImagePath;
        const pathName = url.parse(imagePath).pathname;
        if (pathName) {
            let testImagePath = path.join(fileName, '..', pathName);
            if (imagecache_1.ImageCache.has(testImagePath) || fs.existsSync(testImagePath)) {
                absoluteImagePath = testImagePath;
            }
        }
        return absoluteImagePath;
    },
    refreshConfig() { }
};
//# sourceMappingURL=relativetoopenfilemapper.js.map