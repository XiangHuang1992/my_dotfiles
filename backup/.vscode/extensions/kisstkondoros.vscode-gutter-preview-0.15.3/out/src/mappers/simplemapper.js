"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
exports.simpleUrlMapper = {
    map(fileName, imagePath) {
        let absoluteImagePath;
        if (imagePath.indexOf('http') == 0) {
            absoluteImagePath = imagePath;
        }
        else if (imagePath.indexOf('//') == 0) {
            absoluteImagePath = 'http:' + imagePath;
        }
        else if (path.isAbsolute(imagePath)) {
            if (fs.existsSync(imagePath)) {
                absoluteImagePath = imagePath;
            }
        }
        return absoluteImagePath;
    },
    refreshConfig() { }
};
//# sourceMappingURL=simplemapper.js.map