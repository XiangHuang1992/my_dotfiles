"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const helper_1 = require("../../helper");
const util_1 = require("../util");
const helper_2 = require("./helper");
describe('Should find common diagnostics for all regions', () => {
    const docUri = helper_1.getDocUri('client/diagnostics/Basic.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(docUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    it('shows diagnostic errors for <script> region', () => __awaiter(this, void 0, void 0, function* () {
        const expectedDiagnostics = [
            {
                range: util_1.sameLineRange(25, 4, 5),
                severity: vscode.DiagnosticSeverity.Error,
                message: "',' expected."
            },
            {
                range: util_1.sameLineRange(7, 9, 12),
                severity: vscode.DiagnosticSeverity.Error,
                message: "Argument of type '\"5\"' is not assignable to parameter of type 'number'."
            },
            {
                range: util_1.sameLineRange(8, 0, 29),
                severity: vscode.DiagnosticSeverity.Error,
                message: "'Item' is declared but its value is never read."
            },
            {
                range: util_1.sameLineRange(8, 17, 29),
                severity: vscode.DiagnosticSeverity.Error,
                message: "Cannot find module './Void.vue'."
            },
            {
                range: util_1.sameLineRange(11, 16, 19),
                severity: vscode.DiagnosticSeverity.Error,
                message: "Cannot find name 'Ite'."
            },
            {
                range: util_1.range(17, 2, 21, 3),
                severity: vscode.DiagnosticSeverity.Error,
                // tslint:disable-next-line
                message: "Argument of type '{ components: { Ite: any; }; data(this: CombinedVueInstance<Vue, {}, {}, {}, Readonly<Record<neve...' is not assignable to parameter of type 'ComponentOptions<Vue, DefaultData<Vue>, DefaultMethods<Vue>, DefaultComputed, PropsDefinition<Rec...'.\n  Object literal may only specify known properties, and 'compute' does not exist in type 'ComponentOptions<Vue, DefaultData<Vue>, DefaultMethods<Vue>, DefaultComputed, PropsDefinition<Rec...'."
            },
            {
                range: util_1.sameLineRange(24, 14, 16),
                severity: vscode.DiagnosticSeverity.Error,
                message: "Property 'lo' does not exist on type 'Console'."
            }
        ];
        yield helper_2.testDiagnostics(docUri, util_1.position(2, 5), expectedDiagnostics);
    }));
    it('shows diagnostic errors for <style> region', () => __awaiter(this, void 0, void 0, function* () {
        const expectedDiagnostics = [
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: 'property value expected',
                range: util_1.sameLineRange(33, 0, 1),
                code: 'css-propertyvalueexpected',
                source: 'scss'
            }
        ];
        yield helper_2.testDiagnostics(docUri, util_1.position(2, 5), expectedDiagnostics);
    }));
});
//# sourceMappingURL=basic.test.js.map