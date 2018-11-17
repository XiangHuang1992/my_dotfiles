"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataUrlRecognizer = {
    recognize: (lineIndex, line) => {
        const urlPrefixLength = "url('".length;
        let patternWithSingleQuote = /url\(\'(data:image.*)\'\)/gim;
        let patternWithDoubleQuote = /url\(\"(data:image.*)\"\)/gim;
        let match;
        const result = [];
        while ((match = patternWithSingleQuote.exec(line))) {
            if (match.length > 1) {
                const imagePath = match[1];
                result.push({
                    url: imagePath,
                    lineIndex,
                    start: match.index + urlPrefixLength,
                    end: match.index + urlPrefixLength + imagePath.length
                });
            }
        }
        while ((match = patternWithDoubleQuote.exec(line))) {
            if (match.length > 1) {
                const imagePath = match[1];
                result.push({
                    url: imagePath,
                    lineIndex,
                    start: match.index + urlPrefixLength,
                    end: match.index + urlPrefixLength + imagePath.length
                });
            }
        }
        return result;
    }
};
//# sourceMappingURL=dataurlrecognizer.js.map