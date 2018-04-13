var Path = require('path');
var Fs = require('fs');
var vscode_1 = require('vscode');
var Messages = require('./messages');
var run_command_1 = require('./run-command');
var lastScript;
function npmRunScript() {
    var scripts = readScripts();
    if (!scripts) {
        return;
    }
    var items = Object.keys(scripts).map(function (key) {
        return { label: key, description: scripts[key] };
    });
    vscode_1.window.showQuickPick(items).then(function (value) {
        lastScript = value.label;
        run_command_1.runCommand(['run', value.label]);
    });
}
exports.npmRunScript = npmRunScript;
;
function npmTest() {
    var scripts = readScripts();
    if (!scripts) {
        return;
    }
    if (!scripts.test) {
        Messages.noTestScript();
        return;
    }
    lastScript = 'test';
    run_command_1.runCommand(['run', 'test']);
}
exports.npmTest = npmTest;
function npmStart() {
    var scripts = readScripts();
    if (!scripts) {
        return;
    }
    if (!scripts.start) {
        Messages.noStartScript();
        return;
    }
    lastScript = 'start';
    run_command_1.runCommand(['run', 'start']);
}
exports.npmStart = npmStart;
function npmRunLastScript() {
    if (lastScript) {
        run_command_1.runCommand(['run', lastScript]);
    }
    else {
        Messages.noLastScript();
    }
}
exports.npmRunLastScript = npmRunLastScript;
var readScripts = function () {
    var filename = Path.join(vscode_1.workspace.rootPath, 'package.json');
    try {
        var content = Fs.readFileSync(filename).toString();
        var json = JSON.parse(content);
        if (json.scripts) {
            return json.scripts;
        }
        Messages.noScriptsInfo();
        return null;
    }
    catch (ignored) {
        Messages.noPackageError();
        return null;
    }
};
//# sourceMappingURL=run.js.map