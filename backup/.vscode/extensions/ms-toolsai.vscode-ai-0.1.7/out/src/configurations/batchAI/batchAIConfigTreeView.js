"use strict";
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
Object.defineProperty(exports, "__esModule", { value: true });
const configExplorerTreeNode_1 = require("treeView/configExplorer/configExplorerTreeNode");
/**
 * Batch AI Config Tree Node
 */
class BatchAIConfigTreeNode extends configExplorerTreeNode_1.BaseConfigTreeNode {
    constructor() {
        super(...arguments);
        this.contextValue = 'BatchAIConfig';
    }
}
exports.BatchAIConfigTreeNode = BatchAIConfigTreeNode;
/**
 * Batch AI Platform Tree Node
 */
class BatchAIPlatformTreeNode extends configExplorerTreeNode_1.BasePlatformTreeNode {
    constructor() {
        super(...arguments);
        this.contextValue = 'BatchAIPlatform';
    }
    getChild(config) {
        return new BatchAIConfigTreeNode(this.provider, config);
    }
}
exports.BatchAIPlatformTreeNode = BatchAIPlatformTreeNode;
//# sourceMappingURL=batchAIConfigTreeView.js.map