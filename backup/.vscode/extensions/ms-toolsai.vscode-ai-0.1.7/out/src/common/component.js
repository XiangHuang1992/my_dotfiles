/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */
// tslint:disable:no-string-literal
// tslint:disable:no-any
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const inversify_inject_decorators_1 = require("inversify-inject-decorators");
const klaw = require("klaw-sync");
const lodash_1 = require("lodash");
const path = require("path");
const extensionContext_1 = require("common/extensionContext");
const container = new inversify_1.Container({ autoBindInjectable: true, defaultScope: 'Singleton' });
const { lazyInject } = inversify_inject_decorators_1.default(container);
// tslint:disable-next-line:function-name
function Inject(target, key, index) {
    if (!lodash_1.isUndefined(index)) {
        throw new Error('property injection only');
    }
    const type = Reflect.getMetadata('design:type', target, key);
    lazyInject(type)(target, key);
}
exports.Inject = Inject;
// tslint:disable-next-line:function-name
function Singleton(target) {
    inversify_1.injectable()(target);
    container.bind(target).toSelf().inSingletonScope();
}
exports.Singleton = Singleton;
// tslint:disable-next-line:function-name
function Export(source) {
    return (ctor) => {
        if (!ctor['__exports__']) {
            ctor['__exports__'] = [source.name];
        }
        else {
            ctor['__exports__'].push(source.name);
        }
    };
}
exports.Export = Export;
async function loadComponents(dir) {
    const files = klaw(path.join(dir, 'out', 'src'), { nodir: true }).map((item) => item.path).filter((p) => path.extname(p) === '.js');
    const components = new Map();
    for (const file of files) {
        let assembly;
        try {
            assembly = await Promise.resolve().then(() => require(file));
        }
        catch (err) {
            continue;
        }
        for (const name of Object.keys(assembly)) {
            const mod = assembly[name];
            if (typeof mod === 'function') {
                const types = mod['__exports__'];
                if (!lodash_1.isEmpty(types)) {
                    const obj = container.get(mod);
                    for (const typ of types) {
                        if (components.has(typ)) {
                            components.get(typ).push(obj);
                        }
                        else {
                            components.set(typ, [obj]);
                        }
                    }
                }
            }
        }
    }
    return components;
}
let componentsPromise;
function initialize(context) {
    container.bind(extensionContext_1.ExtensionContext).toConstantValue(context);
    componentsPromise = loadComponents(context.extensionPath);
}
exports.initialize = initialize;
async function imports(source) {
    const components = await componentsPromise;
    return components.get(source.name);
}
exports.imports = imports;
function get(cls) {
    return container.get(cls);
}
exports.get = get;
function getContext() {
    return container.get(extensionContext_1.ExtensionContext);
}
exports.getContext = getContext;
//# sourceMappingURL=component.js.map