"use strict";
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
Object.defineProperty(exports, "__esModule", { value: true });
const configExplorerTreeNode_1 = require("treeView/configExplorer/configExplorerTreeNode");
/**
 * Linux VM Config Tree Node
 */
class LinuxVMConfigTreeNode extends configExplorerTreeNode_1.BaseConfigTreeNode {
    constructor() {
        super(...arguments);
        this.contextValue = 'LinuxVMConfig';
    }
}
exports.LinuxVMConfigTreeNode = LinuxVMConfigTreeNode;
/**
 * Linux VM Platform Tree Node
 */
class LinuxVMPlatformTreeNode extends configExplorerTreeNode_1.BasePlatformTreeNode {
    constructor() {
        super(...arguments);
        this.contextValue = 'LinuxVMPlatform';
    }
    getChild(config) {
        return new LinuxVMConfigTreeNode(this.provider, config);
    }
}
exports.LinuxVMPlatformTreeNode = LinuxVMPlatformTreeNode;
//# sourceMappingURL=linuxVMConfigTreeView.js.map