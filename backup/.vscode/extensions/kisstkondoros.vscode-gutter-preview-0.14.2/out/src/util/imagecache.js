"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tmp = require("tmp");
const request = require("request");
const path = require("path");
const url = require("url");
const fs = require("fs");
const fileutil_1 = require("./fileutil");
tmp.setGracefulCleanup();
let imageCache = new Map();
exports.ImageCache = {
    delete: (key) => {
        imageCache.delete(key);
    },
    set: (key, value) => {
        imageCache.set(key, value);
    },
    get: (key) => {
        return imageCache.get(key);
    },
    has: (key) => {
        return imageCache.has(key);
    },
    store: (absoluteImagePath) => {
        if (exports.ImageCache.has(absoluteImagePath)) {
            return exports.ImageCache.get(absoluteImagePath);
        }
        else {
            try {
                const absoluteImageUrl = url.parse(absoluteImagePath);
                const tempFile = tmp.fileSync({
                    postfix: absoluteImageUrl.pathname ? path.parse(absoluteImageUrl.pathname).ext : 'png'
                });
                const filePath = tempFile.name;
                const promise = new Promise(resolve => {
                    if (absoluteImageUrl.protocol && absoluteImageUrl.protocol.startsWith('http')) {
                        var r = request(absoluteImagePath).on('response', function (res) {
                            r.pipe(fs.createWriteStream(filePath)).on('close', () => {
                                resolve(filePath);
                            });
                        });
                    }
                    else {
                        try {
                            const handle = fs.watch(absoluteImagePath, function fileChangeListener() {
                                handle.close();
                                fs.unlink(filePath, () => { });
                                exports.ImageCache.delete(absoluteImagePath);
                            });
                        }
                        catch (e) { }
                        fileutil_1.copyFile(absoluteImagePath, filePath, err => {
                            if (!err) {
                                resolve(filePath);
                            }
                        });
                    }
                });
                exports.ImageCache.set(absoluteImagePath, promise);
                return promise;
            }
            catch (error) { }
        }
    },
    cleanup: () => {
        imageCache.forEach(value => {
            value.then(tmpFile => fs.unlink(tmpFile, () => { }));
        });
        imageCache.clear();
    }
};
//# sourceMappingURL=imagecache.js.map