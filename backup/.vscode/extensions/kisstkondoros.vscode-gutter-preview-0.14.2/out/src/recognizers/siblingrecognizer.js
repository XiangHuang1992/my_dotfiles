"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acceptedExtensions_1 = require("../util/acceptedExtensions");
exports.siblingRecognizer = {
    recognize: (lineIndex, line) => {
        const excludedPathCharactersClause = '[^\\0\\s!$`&*()\\[\\]+\'":;\\\\]';
        let pattern = new RegExp(`(${excludedPathCharactersClause}+(?:${acceptedExtensions_1.acceptedExtensions.map(p => `(\\${p})`).join('|')}))`, 'igm');
        let match;
        const result = [];
        while ((match = pattern.exec(line))) {
            if (match.length > 0) {
                const imagePath = match[0];
                result.push({
                    url: imagePath,
                    lineIndex,
                    start: match.index,
                    end: match.index + imagePath.length
                });
            }
        }
        return result;
    }
};
//# sourceMappingURL=siblingrecognizer.js.map