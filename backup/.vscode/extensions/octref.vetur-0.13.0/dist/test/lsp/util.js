"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function position(line, char) {
    return new vscode.Position(line, char);
}
exports.position = position;
function range(startLine, startChar, endLine, endChar) {
    return new vscode.Range(position(startLine, startChar), position(endLine, endChar));
}
exports.range = range;
function sameLineRange(line, startChar, endChar) {
    return new vscode.Range(position(line, startChar), position(line, endChar));
}
exports.sameLineRange = sameLineRange;
function location(uri, startLine, startChar, endLine, endChar) {
    return new vscode.Location(uri, range(startLine, startChar, endLine, endChar));
}
exports.location = location;
function sameLineLocation(uri, line, startChar, endChar) {
    return new vscode.Location(uri, sameLineRange(line, startChar, endChar));
}
exports.sameLineLocation = sameLineLocation;
//# sourceMappingURL=util.js.map