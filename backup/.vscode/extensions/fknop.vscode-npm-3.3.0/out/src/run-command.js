var child_process_1 = require('child_process');
var vscode_1 = require('vscode');
var output_1 = require('./output');
var kill = require('tree-kill');
exports.childs = new Map();
function terminate(pid) {
    var childCommand = exports.childs.get(pid);
    if (childCommand.child) {
        output_1.outputChannel.appendLine('');
        output_1.outputChannel.appendLine("Killing process: " + childCommand.cmd + " (pid:" + pid + ")");
        output_1.outputChannel.appendLine('');
        childCommand.killedByUs = true;
        kill(pid, 'SIGTERM');
    }
}
exports.terminate = terminate;
function runCommand(args) {
    var cmd = 'npm ' + args.join(' ');
    var options = {
        cwd: vscode_1.workspace.rootPath,
        env: process.env
    };
    var child = child_process_1.exec(cmd, options);
    exports.childs.set(child.pid, { child: child, cmd: cmd });
    child.on('exit', function (code, signal) {
        if (signal === 'SIGTERM' || exports.childs.get(child.pid).killedByUs) {
            output_1.outputChannel.appendLine('');
            output_1.outputChannel.appendLine('Successfully killed process');
            output_1.outputChannel.appendLine('');
            output_1.outputChannel.appendLine('--------------------');
            output_1.outputChannel.appendLine('');
        }
        if (code === 0) {
            output_1.outputChannel.appendLine('');
            output_1.outputChannel.appendLine('--------------------');
            output_1.outputChannel.appendLine('');
            output_1.outputChannel.hide();
        }
        exports.childs.delete(child.pid);
    });
    output_1.outputChannel.appendLine(cmd);
    output_1.outputChannel.appendLine('');
    var append = function (data) {
        output_1.outputChannel.append(data);
    };
    child.stderr.on('data', append);
    child.stdout.on('data', append);
    output_1.outputChannel.show(vscode_1.ViewColumn.Three);
}
exports.runCommand = runCommand;
;
//# sourceMappingURL=run-command.js.map