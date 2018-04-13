var run_command_1 = require('./run-command');
var vscode_1 = require('vscode');
var Item = (function () {
    function Item(label, description, pid) {
        this.label = label;
        this.description = description;
        this.pid = pid;
    }
    return Item;
})();
function default_1() {
    var commands = [];
    var items = [];
    run_command_1.childs.forEach(function (value) {
        items.push(new Item(value.cmd, "(pid: " + value.child.pid + ")", value.child.pid));
    });
    vscode_1.window.showQuickPick(items).then(function (value) {
        if (value) {
            run_command_1.terminate(value.pid);
        }
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=terminate.js.map