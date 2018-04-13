var vscode_1 = require('vscode');
var output_1 = require('./output');
var init_1 = require('./init');
var install_1 = require('./install');
var uninstall_1 = require('./uninstall');
var run_1 = require('./run');
var publish_1 = require('./publish');
var deprecate_1 = require('./deprecate');
var raw_1 = require('./raw');
var terminate_1 = require('./terminate');
exports.activate = function (context) {
    var disposables = [
        vscode_1.commands.registerCommand('npm-script.installSavedPackages', install_1.npmInstallSavedPackages),
        vscode_1.commands.registerCommand('npm-script.installPackage', install_1.npmInstallPackage),
        vscode_1.commands.registerCommand('npm-script.installPackageDev', install_1.npmInstallPackageDev),
        vscode_1.commands.registerCommand('npm-script.runScript', run_1.npmRunScript),
        vscode_1.commands.registerCommand('npm-script.runScriptLatest', run_1.npmRunLastScript),
        vscode_1.commands.registerCommand('npm-script.init', init_1.default),
        vscode_1.commands.registerCommand('npm-script.uninstallPackage', uninstall_1.npmUninstallPackage),
        vscode_1.commands.registerCommand('npm-script.uninstallPackageDev', uninstall_1.npmUninstallPackageDev),
        vscode_1.commands.registerCommand('npm-script.publish', publish_1.npmPublish),
        vscode_1.commands.registerCommand('npm-script.deprecate', deprecate_1.npmDeprecate),
        vscode_1.commands.registerCommand('npm-script.raw', raw_1.npmRawCommand),
        vscode_1.commands.registerCommand('npm-script.terminate', terminate_1.default),
        vscode_1.commands.registerCommand('npm-script.test', run_1.npmTest),
        vscode_1.commands.registerCommand('npm-script.start', run_1.npmStart)
    ];
    (_a = context.subscriptions).push.apply(_a, disposables.concat([output_1.outputChannel]));
    var _a;
};
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map