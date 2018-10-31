"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json = require("jsonc-parser");
const vscode = require("vscode");
const provider_1 = require("./../provider");
class JsonProvider {
    hasSupport(langId) {
        return langId.toLowerCase() === "json";
    }
    refresh(document) {
        this.parseTree(document);
    }
    getTokenTree() {
        return Promise.resolve({});
    }
    getChildren(offset) {
        if (offset) {
            const p = json.getLocation(this.text, parseInt(offset, 10)).path;
            const node = json.findNodeAtLocation(this.tree, p);
            return Promise.resolve(this.getChildrenOffsets(node));
        }
        else {
            return Promise.resolve(this.tree ? this.getChildrenOffsets(this.tree) : []);
        }
    }
    getTreeItem(offset) {
        const p = json.getLocation(this.text, parseInt(offset, 10)).path;
        const valueNode = json.findNodeAtLocation(this.tree, p);
        if (valueNode) {
            const hasChildren = valueNode.type === "object" || valueNode.type === "array";
            let treeItem = new vscode.TreeItem(this.getLabel(valueNode), hasChildren ? vscode.TreeItemCollapsibleState.Collapsed :
                vscode.TreeItemCollapsibleState.None);
            treeItem.contextValue = valueNode.type;
            if (!hasChildren) {
                const start = vscode.window.activeTextEditor.document.positionAt(valueNode.offset);
                const end = new vscode.Position(start.line, start.character + valueNode.length);
                treeItem = provider_1.Provider.addItemCommand(treeItem, "extension.treeview.goto", [new vscode.Range(start, end)]);
            }
            return provider_1.Provider.addItemIcon(treeItem, hasChildren ? "list" : "property");
        }
        return null;
    }
    getDocumentName(name, include = false) {
        throw new Error("Unsupported action");
    }
    generate(name, node, include, options = {}) {
        throw new Error("Unsupported action");
    }
    parseTree(document) {
        document = document !== undefined ? document : vscode.window.activeTextEditor.document;
        if (document) {
            this.text = document.getText();
            this.tree = json.parseTree(this.text);
        }
    }
    getChildrenOffsets(node) {
        const offsets = [];
        for (const child of node.children) {
            const childPath = json.getLocation(this.text, child.offset).path;
            const childNode = json.findNodeAtLocation(this.tree, childPath);
            if (childNode) {
                offsets.push(childNode.offset.toString());
            }
        }
        return offsets;
    }
    getLabel(node) {
        if (node.parent.type === "array") {
            const prefix = node.parent.children.indexOf(node).toString();
            if (node.type === "object" || node.type === "array") {
                return prefix;
            }
            return prefix.match(/^\d+$/).length === 0 ?
                prefix + ":" + node.value.toString() : node.value.toString();
        }
        else {
            const property = node.parent.children[0].value.toString();
            if (node.type === "array" || node.type === "object") {
                if (node.type === "object" || node.type === "array") {
                    return property;
                }
            }
            const value = vscode.window.activeTextEditor.document.getText(new vscode.Range(vscode.window.activeTextEditor.document.positionAt(node.offset), vscode.window.activeTextEditor.document.positionAt(node.offset + node.length)));
            return `${property}: ${value}`;
        }
    }
}
exports.JsonProvider = JsonProvider;
//# sourceMappingURL=json.js.map