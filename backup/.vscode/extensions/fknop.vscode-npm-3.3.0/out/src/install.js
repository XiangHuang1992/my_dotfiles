var vscode_1 = require('vscode');
var utils_1 = require('./utils');
var Messages = require('./messages');
var run_command_1 = require('./run-command');
function npmInstallSavedPackages() {
    if (!utils_1.packageExists()) {
        Messages.noPackageError();
        return;
    }
    run_command_1.runCommand(['install']);
}
exports.npmInstallSavedPackages = npmInstallSavedPackages;
;
function npmInstallPackage() {
    return _installPackage(false);
}
exports.npmInstallPackage = npmInstallPackage;
;
function npmInstallPackageDev() {
    return _installPackage(true);
}
exports.npmInstallPackageDev = npmInstallPackageDev;
;
var _installPackage = function (dev) {
    if (!utils_1.packageExists()) {
        Messages.noPackageError();
        return;
    }
    vscode_1.window.showInputBox({
        prompt: 'Package to install',
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
        var args = ['install'].concat(packages);
        if (hasSaveOption) {
            run_command_1.runCommand(args);
        }
        else {
            var save = dev ? '--save-dev' : '--save';
            run_command_1.runCommand(args.concat([save]));
        }
    });
};
//# sourceMappingURL=install.js.map