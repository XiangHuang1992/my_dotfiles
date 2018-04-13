var Fs = require('fs');
var Path = require('path');
var vscode_1 = require('vscode');
var Messages = require('./messages');
var utils_1 = require('./utils');
function default_1() {
    if (!vscode_1.workspace.rootPath) {
        Messages.noProjectOpenError();
        return;
    }
    if (utils_1.packageExists()) {
        Messages.alreadyExistsError();
        return;
    }
    var directory = Path.basename(vscode_1.workspace.rootPath);
    var options = {
        name: directory,
        version: '1.0.0',
        description: '',
        main: 'index.js',
        scripts: {
            test: 'echo "Error: no test specified" && exit 1'
        },
        author: '',
        license: 'ISC'
    };
    vscode_1.window.showInputBox({
        prompt: 'Package name',
        placeHolder: 'Package name...',
        value: directory
    })
        .then(function (value) {
        if (value) {
            options.name = value.toLowerCase();
        }
        return vscode_1.window.showInputBox({
            prompt: 'Version',
            placeHolder: '1.0.0',
            value: '1.0.0'
        });
    })
        .then(function (value) {
        if (value) {
            options.version = value;
        }
        return vscode_1.window.showInputBox({
            prompt: 'Description',
            placeHolder: 'Package description'
        });
    })
        .then(function (value) {
        if (value) {
            options.description = value;
        }
        return vscode_1.window.showInputBox({
            prompt: 'main (entry point)',
            value: 'index.js'
        });
    })
        .then(function (value) {
        if (value) {
            options.main = value;
        }
        return vscode_1.window.showInputBox({
            prompt: 'Test script'
        });
    })
        .then(function (value) {
        if (value) {
            options.scripts.test = value;
        }
        return vscode_1.window.showInputBox({
            prompt: 'Author'
        });
    })
        .then(function (value) {
        if (value) {
            options.author = value;
        }
        return vscode_1.window.showInputBox({
            prompt: 'License',
            value: 'ISC'
        });
    })
        .then(function (value) {
        if (value) {
            options.license = value;
        }
        var packageJson = JSON.stringify(options, null, 4);
        var path = Path.join(vscode_1.workspace.rootPath, 'package.json');
        Fs.writeFile(path, packageJson, function (err) {
            if (err) {
                Messages.cannotWriteError();
            }
            else {
                Messages.createdInfo();
                vscode_1.workspace.openTextDocument(path).then(function (document) {
                    vscode_1.window.showTextDocument(document);
                });
            }
        });
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=init.js.map