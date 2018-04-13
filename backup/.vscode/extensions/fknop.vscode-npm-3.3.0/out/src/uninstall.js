var vscode_1 = require('vscode');
var utils_1 = require('./utils');
var Messages = require('./messages');
var run_command_1 = require('./run-command');
function npmUninstallPackage() {
    return _uninstallPackage(false);
}
exports.npmUninstallPackage = npmUninstallPackage;
;
function npmUninstallPackageDev() {
    return _uninstallPackage(true);
}
exports.npmUninstallPackageDev = npmUninstallPackageDev;
;
var _uninstallPackage = function (dev) {
    if (!utils_1.packageExists()) {
        Messages.noPackageError();
        return;
    }
    vscode_1.window.showInputBox({
        prompt: 'Package to uninstall',
        placeHolder: 'lodash, underscore, ...'
    })
        .then(function (value) {
        if (!value) {
            Messages.noValueError();
            return;
        }
        var packages = value.split(' ');
        var hasSaveOption = packages.find(function (value) {
            return value === '-D' ||
                value === '--save-dev' ||
                value === '-S' ||
                value === '--save' ||
                value === '-O' ||
                value === '--save-optional' ||
                value === '-E' ||
                value === '--save-exact';
        });
        var args = ['uninstall'].concat(packages);
        if (hasSaveOption) {
            run_command_1.runCommand(args);
        }
        else {
            var save = dev ? '--save-dev' : '--save';
            run_command_1.runCommand(args.concat([save]));
        }
    });
};
//# sourceMappingURL=uninstall.js.map