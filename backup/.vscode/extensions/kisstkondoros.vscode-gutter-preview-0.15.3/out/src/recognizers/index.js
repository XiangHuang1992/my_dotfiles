"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const linkrecognizer_1 = require("./linkrecognizer");
const locallinkrecognizer_1 = require("./locallinkrecognizer");
const dataurlrecognizer_1 = require("./dataurlrecognizer");
const siblingrecognizer_1 = require("./siblingrecognizer");
exports.recognizers = [
    dataurlrecognizer_1.dataUrlRecognizer,
    linkrecognizer_1.linkRecognizer,
    locallinkrecognizer_1.localLinkRecognizer,
    siblingrecognizer_1.siblingRecognizer
];
//# sourceMappingURL=index.js.map