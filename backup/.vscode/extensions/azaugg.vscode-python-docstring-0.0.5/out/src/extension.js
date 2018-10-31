"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
var indentString = require('indent-string');
class paramDeclaration {
    constructor(paramName) {
        this.paramName = paramName;
        this.paramName = paramName;
    }
}
exports.paramDeclaration = paramDeclaration;
function getParameterText(paramList, padding, docstyle) {
    var textToInsert = "";
    textToInsert = textToInsert + '"""';
    if (docstyle == 'google') {
        textToInsert = textToInsert + '\ndocstring here\n';
        paramList.forEach(element => {
            if (element.paramName != '') {
                textToInsert = textToInsert + padding + ':param ';
                textToInsert = textToInsert + element.paramName + ': \n';
            }
        });
    }
    else if (docstyle == 'numpy') {
        textToInsert = textToInsert + 'Set docstring here.\n';
        textToInsert = textToInsert + '\nParameters';
        textToInsert = textToInsert + '\n----------\n';
        paramList.forEach(element => {
            if (element.paramName != '') {
                textToInsert = textToInsert + element.paramName + ': \n';
            }
        });
        textToInsert = textToInsert + '\nReturns\n';
        textToInsert = textToInsert + '-------\n\n';
    }
    textToInsert = textToInsert + '"""';
    return textToInsert;
}
exports.getParameterText = getParameterText;
//Assumes that the string passed in starts with ( and continues to ) and does not contain any comments or white space
function getParameters(text) {
    var paramList = [];
    //Start by looking for the function name declaration
    var index = 0;
    text = text.replace(/\s/g, '');
    //Now we are at the first non whitespace character
    //if it is not a '(' then this is not a valid function declaration
    if (text.charAt(index) == '(') {
        //count the number of matching opening and closing braces. Keep parsing until 0
        var numBraces = 1;
        index++;
        while ((numBraces != 0) && (index != text.length)) {
            //Now we are at a non whitespace character. Assume it is the parameter name
            var name = '';
            //while ((text.charAt(index) != ':') && (text.charAt(index) != ',') && (text.charAt(index) != ')') && (index < text.length)) {
            while ((text.charAt(index) != ',') && (text.charAt(index) != ')') && (index < text.length)) {
                name = name + text.charAt(index);
                index++;
            }
            if (index < text.length) {
                //Now we are at a : or a ',', skip then read until a , to get the param type
                var type = '';
                //we have a type to process
                if (text.charAt(index) == '(') {
                    var startNumBraces = numBraces;
                    numBraces++;
                    type = type + text.charAt(index);
                    index++;
                    //we have encountered a function type
                    //read all the way through until the numBraces = startNumBraces
                    while ((numBraces != startNumBraces) && (index < text.length)) {
                        if (text.charAt(index) == ')') {
                            numBraces--;
                        }
                        else if (text.charAt(index) == '(') {
                            numBraces++;
                        }
                        type = type + text.charAt(index);
                        index++;
                    }
                    if (index < text.length) {
                        //Now read up to either a , or a )
                        while ((text.charAt(index) != ',') && (text.charAt(index) != ')')) {
                            type = type + text.charAt(index);
                            index++;
                        }
                        if (text.charAt(index) == ')') {
                            numBraces--;
                        }
                    }
                }
                else {
                    while ((text.charAt(index) != ',') && (text.charAt(index) != ')') && (index != text.length)) {
                        type = type + text.charAt(index);
                        index++;
                    }
                    if (text.charAt(index) == ')') {
                        numBraces--;
                    }
                }
                paramList.push(new paramDeclaration(name));
                if (index < text.length) {
                    index++;
                }
            }
        }
    }
    return paramList;
}
exports.getParameters = getParameters;
function activate(ctx) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-python-docstring" is now active!');
    vscode.commands.registerCommand('extension.addPyDocstring', () => {
        var lang = vscode.window.activeTextEditor.document.languageId;
        if ((lang == "python")) {
            var selection = vscode.window.activeTextEditor.selection;
            var startLine = selection.start.line - 1;
            var selectedText = vscode.window.activeTextEditor.document.getText(selection);
            var outputMessage = 'Please select a TypeScript or JavaScript function signature';
            if (selectedText.length === 0) {
                vscode.window.showInformationMessage(outputMessage);
                return;
            }
            var firstBraceIndex = selectedText.indexOf('(');
            selectedText = selectedText.slice(firstBraceIndex);
            var params = getParameters(selectedText);
            if (params.length > 0) {
                var docstyle = vscode.workspace.getConfiguration().pydocs.style;
                var spaces_enabled = vscode.window.activeTextEditor.options.insertSpaces;
                var tabSize = vscode.window.activeTextEditor.options.tabSize;
                var padding = '';
                if (spaces_enabled == true) {
                    padding = Array(tabSize + 1).join(' ');
                }
                else {
                    padding = '\t';
                }
                var textToInsert = getParameterText(params, padding, docstyle);
                vscode.window.activeTextEditor.edit((editBuilder) => {
                    var pos;
                    pos = new vscode.Position(startLine + 2, 5);
                    var line = vscode.window.activeTextEditor.document.lineAt(selection.start.line).text;
                    var firstNonWhiteSpace = vscode.window.activeTextEditor.document.lineAt(selection.start.line).firstNonWhitespaceCharacterIndex;
                    var stringToIndent = '';
                    for (var i = 0; i < firstNonWhiteSpace; i++) {
                        if (line.charAt(i) == '\t') {
                            stringToIndent = stringToIndent + '\t';
                        }
                        else if (line.charAt(i) == ' ') {
                            stringToIndent = stringToIndent + ' ';
                        }
                    }
                    stringToIndent = padding + stringToIndent;
                    textToInsert = indentString(textToInsert, stringToIndent, 1);
                    editBuilder.insert(pos, textToInsert);
                }).then(() => {
                });
            }
        }
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map