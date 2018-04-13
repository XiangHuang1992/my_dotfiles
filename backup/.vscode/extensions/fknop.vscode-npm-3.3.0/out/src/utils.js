var Fs = require('fs');
var Path = require('path');
var vscode_1 = require('vscode');
function packageExists() {
    if (!vscode_1.workspace.rootPath) {
        return false;
    }
    try {
        var filename = Path.join(vscode_1.workspace.rootPath, 'package.json');
        var stat = Fs.statSync(filename);
        return stat && stat.isFile();
    }
    catch (ignored) {
        return false;
    }
}
exports.packageExists = packageExists;
;
//# sourceMappingURL=utils.js.map