var vscode_1 = require('vscode');
var utils_1 = require('./utils');
var Messages = require('./messages');
var run_command_1 = require('./run-command');
function npmPublish() {
    _do('publish');
}
exports.npmPublish = npmPublish;
;
// Bad practice to unpublish a package
// export function npmUnpublish () {
//     _do('unpublish');
// };
var _do = function (cmd) {
    if (!utils_1.packageExists()) {
        Messages.noPackageError();
        return;
    }
    vscode_1.window.showInputBox({
        prompt: 'Optional tag (enter to skip tag)',
        placeHolder: 'latest, 1.0.0, ...'
    })
        .then(function (value) {
        if (!value) {
            run_command_1.runCommand([cmd]);
            return;
        }
        if (value.includes(' ')) {
            Messages.invalidTagError();
            return;
        }
        run_command_1.runCommand([cmd, '--tag', value]);
    });
};
//# sourceMappingURL=publish.js.map