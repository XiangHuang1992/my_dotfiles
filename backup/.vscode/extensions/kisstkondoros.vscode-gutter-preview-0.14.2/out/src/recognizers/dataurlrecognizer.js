"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataUrlRecognizer = {
    recognize: (lineIndex, line) => {
        let pattern = /(data:image(\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*))[\"\'\)]+/gim;
        let match;
        const result = [];
        while ((match = pattern.exec(line))) {
            if (match.length > 1) {
                const imagePath = match[1];
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
//# sourceMappingURL=dataurlrecognizer.js.map