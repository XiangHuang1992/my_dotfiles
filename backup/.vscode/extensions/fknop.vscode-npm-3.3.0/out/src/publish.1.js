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
    vscode_1.window.showInputBox({
        prompt: 'Optional version (enter to deprecate all versions)',
        placeHolder: '< 0.2.3, 1.0.0, ...'
    })
        .then(function (value) {
        var path = Path.join(vscode_1.workspace.rootPath, 'package.json');
        Fs.readFile(path, function (err, data) {
            var json = JSON.parse(data.toString());
            var name = json.name;
            if (!value) {
                return run_command_1.runCommand([cmd, name]);
            }
            var arg = name.concat('@', value);
            return run_command_1.runCommand([cmd, arg]);
        });
    });
}
exports.npmDeprecate = npmDeprecate;
;
//# sourceMappingURL=publish.1.js.map