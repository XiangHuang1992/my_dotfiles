var Fs = require('fs');
var Path = require('path');
var vscode_1 = require('vscode');
var utils_1 = require('./utils');
var Messages = require('./messages');
var run_command_1 = require('./run-command');
function npmDeprecate() {
    if (!utils_1.packageExists()) {
        Messages.noPackageError();
        return;
    }
    var cmd = 'deprecate';
    var options = {
        version: '',
        message: ''
    };
    vscode_1.window.showInformationMessage('This feature is experimental... (close this to continue)').then(function () {
        return vscode_1.window.showInputBox({
            prompt: 'Optional version (enter to deprecate all versions)',
            placeHolder: '< 0.2.3, 1.0.0, ...'
        });
    })
        .then(function (value) {
        if (value) {
            options.version = '@'.concat(value);
        }
        return vscode_1.window.showInputBox({
            prompt: 'Deprecation message (required)'
        });
    })
        .then(function (value) {
        if (!value) {
            Messages.noValueError();
            return;
        }
        options.message = value;
        var path = Path.join(vscode_1.workspace.rootPath, 'package.json');
        Fs.readFile(path, function (err, data) {
            var json = JSON.parse(data.toString());
            var name = json.name;
            var args = [cmd, name.concat(options.version), options.message];
            run_command_1.runCommand(args);
        });
    });
}
exports.npmDeprecate = npmDeprecate;
;
//# sourceMappingURL=deprecate.js.map