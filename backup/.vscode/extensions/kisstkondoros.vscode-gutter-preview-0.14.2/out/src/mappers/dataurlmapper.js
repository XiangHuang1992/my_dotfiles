"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataUrlMapper = {
    map(fileName, imagePath) {
        let absoluteImagePath;
        if (imagePath.indexOf('data:image') === 0) {
            absoluteImagePath = imagePath;
        }
        return absoluteImagePath;
    },
    refreshConfig() { }
};
//# sourceMappingURL=dataurlmapper.js.map