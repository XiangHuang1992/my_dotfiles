var vscode_1 = require('vscode');
var utils_1 = require('./utils');
var Messages = require('./messages');
var run_command_1 = require('./run-command');
function npmRawCommand() {
    if (!utils_1.packageExists()) {
        Messages.noPackageError();
        return;
    }
    vscode_1.window.showInputBox({
        prompt: 'npm command',
        placeHolder: 'install lodash@latest, ...'
    })
        .then(function (value) {
        if (!value) {
            Messages.noValueError();
            return;
        }
        var args = value.split(' ');
        run_command_1.runCommand(args);
    });
}
exports.npmRawCommand = npmRawCommand;
;
//# sourceMappingURL=raw.js.map