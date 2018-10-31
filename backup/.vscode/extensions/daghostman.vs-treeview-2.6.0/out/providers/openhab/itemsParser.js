"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class ItemsParser {
    parseSource(text) {
        this.text = text;
        // Remove comments
        text = text.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");
        const lines = text.split("\n");
        const types = [
            "Color",
            "Contact",
            "DateTime",
            "Dimmer",
            "Group",
            "Image",
            "Location",
            "Number",
            "Player",
            "Rollershutter",
            "String",
            "Switch",
        ];
        const items = lines
            .filter((line) => {
            const arr = line.split(/\s+/);
            return types.includes(arr[0]);
        })
            .map((line) => {
            const arr = line.split(/\s+/);
            return {
                name: arr[1],
                position: this.getPosition(arr[1]),
            };
        }) || [];
        return Promise.resolve({ items });
    }
    getPosition(text) {
        const query = (q) => q.includes(text);
        const lines = this.text.split("\n");
        const line = lines.find(query);
        const lineIndex = lines.findIndex(query);
        return new vscode.Range(new vscode.Position(lineIndex, line.indexOf(text)), new vscode.Position(lineIndex, line.indexOf(text) + text.length));
    }
}
exports.ItemsParser = ItemsParser;
//# sourceMappingURL=itemsParser.js.map