"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataurlmapper_1 = require("./dataurlmapper");
const relativetoopenfilemapper_1 = require("./relativetoopenfilemapper");
const relativetoworkspacerootmapper_1 = require("./relativetoworkspacerootmapper");
const simplemapper_1 = require("./simplemapper");
exports.absoluteUrlMappers = [
    dataurlmapper_1.dataUrlMapper,
    simplemapper_1.simpleUrlMapper,
    relativetoopenfilemapper_1.relativeToOpenFileUrlMapper,
    relativetoworkspacerootmapper_1.relativeToWorkspaceRootFileUrlMapper
];
//# sourceMappingURL=index.js.map