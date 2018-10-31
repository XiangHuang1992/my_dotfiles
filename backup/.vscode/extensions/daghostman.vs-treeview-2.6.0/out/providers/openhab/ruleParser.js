"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class RuleParser {
    parseSource(text) {
        this.text = text;
        // Remove comments
        text = text.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");
        const lines = text.split("\n");
        const imports = lines
            .filter((line) => line.trim().startsWith("import"))
            .map((line) => {
            const i = line.replace(/import/, "").trim();
            return {
                name: i,
                position: this.getPosition(i),
            };
        }) || [];
        const rules = lines
            .filter((line) => line.trim().startsWith("rule"))
            .map((line) => {
            const rule = line.replace(/rule/, "").trim();
            return {
                name: rule,
                position: this.getPosition(rule),
            };
        }) || [];
        // Remove lambdas
        text = text.replace(/(\[)([\s\S]*?)(\s])/gm, "$1");
        const lastImport = imports.length !== 0 ? imports[imports.length - 1].name : "";
        const vars = text.slice(text.search(lastImport) + lastImport.length, rules.length !== 0 ? text.search(rules[0].name) : text.length);
        const variables = vars
            .split("\n")
            .filter((line) => /val|var/.test(line.trim()))
            .map((line) => {
            const v = line.split("=")[0].replace(/val |var /, "").trim();
            return {
                name: v,
                position: this.getPosition(v),
            };
        }) || [];
        return Promise.resolve({ imports, variables, rules });
    }
    getPosition(text) {
        const query = (q) => q.includes(text);
        const lines = this.text.split("\n");
        const line = lines.find(query);
        const lineIndex = lines.findIndex(query);
        return new vscode.Range(new vscode.Position(lineIndex, line.indexOf(text)), new vscode.Position(lineIndex, line.indexOf(text) + text.length));
    }
}
exports.RuleParser = RuleParser;
//# sourceMappingURL=ruleParser.js.map