"use strict";
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
Object.defineProperty(exports, "__esModule", { value: true });
const configExplorerTreeNode_1 = require("treeView/configExplorer/configExplorerTreeNode");
/**
 * Azure ML Config Tree Node
 */
class AzureMLConfigTreeNode extends configExplorerTreeNode_1.BaseConfigTreeNode {
    constructor() {
        super(...arguments);
        this.contextValue = 'AzureMLConfig';
    }
}
exports.AzureMLConfigTreeNode = AzureMLConfigTreeNode;
/**
 * Azure ML Platform Tree Node
 */
class AzureMLPlatformTreeNode extends configExplorerTreeNode_1.BasePlatformTreeNode {
    constructor() {
        super(...arguments);
        this.contextValue = 'AzureMLPlatform';
    }
    getChild(config) {
        return new AzureMLConfigTreeNode(this.provider, config);
    }
}
exports.AzureMLPlatformTreeNode = AzureMLPlatformTreeNode;
//# sourceMappingURL=azureMLConfigTreeView.js.map