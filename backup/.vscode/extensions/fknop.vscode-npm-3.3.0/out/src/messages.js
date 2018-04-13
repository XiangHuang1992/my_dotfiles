var vscode_1 = require('vscode');
function noPackageError() {
    vscode_1.window.showErrorMessage('Cannot read \'package.json\'');
}
exports.noPackageError = noPackageError;
;
function alreadyExistsError() {
    vscode_1.window.showErrorMessage('\'package.json\' already exists');
}
exports.alreadyExistsError = alreadyExistsError;
;
function noProjectOpenError() {
    vscode_1.window.showErrorMessage('No project open');
}
exports.noProjectOpenError = noProjectOpenError;
;
function noLastScript() {
    vscode_1.window.showErrorMessage('No script executed yet');
}
exports.noLastScript = noLastScript;
function noTestScript() {
    vscode_1.window.showErrorMessage('No test script in your package.json file');
}
exports.noTestScript = noTestScript;
function noStartScript() {
    vscode_1.window.showErrorMessage('No start script in your package.json file');
}
exports.noStartScript = noStartScript;
function noScriptsInfo() {
    vscode_1.window.showInformationMessage('No scripts are defined in \'package.json\'');
}
exports.noScriptsInfo = noScriptsInfo;
;
function cannotWriteError() {
    vscode_1.window.showErrorMessage('Cannot write \'package.json\'');
}
exports.cannotWriteError = cannotWriteError;
;
function createdInfo() {
    vscode_1.window.showInformationMessage('\'package.json\' created successfuly');
}
exports.createdInfo = createdInfo;
;
function noValueError() {
    vscode_1.window.showErrorMessage('No value entered');
}
exports.noValueError = noValueError;
;
function invalidTagError() {
    vscode_1.window.showErrorMessage('Tag is invalid');
}
exports.invalidTagError = invalidTagError;
;
//# sourceMappingURL=messages.js.map