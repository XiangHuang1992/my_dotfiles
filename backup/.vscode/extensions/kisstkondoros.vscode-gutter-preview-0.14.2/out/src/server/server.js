"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const protocol_1 = require("../common/protocol");
const path = require("path");
const url = require("url");
const acceptedExtensions_1 = require("../util/acceptedExtensions");
const mappers_1 = require("../mappers");
const recognizers_1 = require("../recognizers");
const stringutil_1 = require("../util/stringutil");
const imagecache_1 = require("../util/imagecache");
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);
let documents = new vscode_languageserver_1.TextDocuments();
documents.listen(connection);
connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: documents.syncKind
        }
    };
});
connection.onRequest(protocol_1.GutterPreviewImageRequestType, (request) => __awaiter(this, void 0, void 0, function* () {
    let document = documents.get(request.uri);
    if (document) {
        const entries = yield collectEntries(document, request).then(values => values.filter(p => !!p));
        return {
            images: entries.filter(p => !!p)
        };
    }
    else {
        return {
            images: []
        };
    }
}));
connection.onShutdown(() => {
    imagecache_1.ImageCache.cleanup();
});
connection.listen();
function collectEntries(document, request) {
    return __awaiter(this, void 0, void 0, function* () {
        let items = [];
        mappers_1.absoluteUrlMappers.forEach(absoluteUrlMapper => absoluteUrlMapper.refreshConfig(request.workspaceFolder, request.additionalSourcefolder));
        const lines = document.getText().split(/\r\n|\r|\n/);
        var max = lines.length;
        for (var lineIndex = 0; lineIndex < max; lineIndex++) {
            var line = lines[lineIndex];
            recognizers_1.recognizers
                .map(recognizer => recognizer.recognize(lineIndex, line))
                .filter(item => !!item)
                .forEach(urlMatches => {
                urlMatches.forEach(urlMatch => {
                    let absoluteUrls = mappers_1.absoluteUrlMappers
                        .map(mapper => {
                        try {
                            return mapper.map(request.fileName, urlMatch.url);
                        }
                        catch (e) { }
                    })
                        .filter(item => stringutil_1.nonNullOrEmpty(item));
                    let absoluteUrlsSet = new Set(absoluteUrls);
                    items = items.concat(Array.from(absoluteUrlsSet.values()).map(absoluteImagePath => convertToLocalImagePath(absoluteImagePath, urlMatch).catch(p => null)));
                });
            });
        }
        return yield Promise.all(items);
    });
}
function convertToLocalImagePath(absoluteImagePath, urlMatch) {
    return __awaiter(this, void 0, void 0, function* () {
        if (absoluteImagePath) {
            let isDataUri = absoluteImagePath.indexOf('data:image') == 0;
            let isExtensionSupported;
            if (!isDataUri) {
                const absoluteImageUrl = url.parse(absoluteImagePath);
                if (absoluteImageUrl && absoluteImageUrl.pathname) {
                    let absolutePath = path.parse(absoluteImageUrl.pathname);
                    isExtensionSupported = acceptedExtensions_1.acceptedExtensions.some(ext => absolutePath && absolutePath.ext && absolutePath.ext.toLowerCase().startsWith(ext));
                }
            }
            const start = vscode_languageserver_1.Position.create(urlMatch.lineIndex, urlMatch.start);
            const end = vscode_languageserver_1.Position.create(urlMatch.lineIndex, urlMatch.end);
            const range = { start, end };
            absoluteImagePath = absoluteImagePath.replace(/\|(width=\d*)?(height=\d*)?/gm, '');
            if (isDataUri || isExtensionSupported) {
                if (isDataUri) {
                    return Promise.resolve({
                        originalImagePath: absoluteImagePath,
                        imagePath: absoluteImagePath,
                        range
                    });
                }
                else {
                    return imagecache_1.ImageCache.store(absoluteImagePath).then(imagePath => {
                        return {
                            originalImagePath: absoluteImagePath,
                            imagePath,
                            range
                        };
                    });
                }
            }
        }
    });
}
//# sourceMappingURL=server.js.map