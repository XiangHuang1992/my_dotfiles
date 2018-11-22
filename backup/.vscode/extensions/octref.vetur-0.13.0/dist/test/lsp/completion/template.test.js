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
const helper_1 = require("../../helper");
const util_1 = require("../util");
const helper_2 = require("./helper");
describe('Should autocomplete for <template>', () => {
    const templateDocUri = helper_1.getDocUri('client/completion/template/Basic.vue');
    const templateFrameworkDocUri = helper_1.getDocUri('client/completion/template/Framework.vue');
    const templateQuasarDocUri = helper_1.getDocUri('client/completion/template/Quasar.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(templateDocUri);
        yield helper_1.showFile(templateFrameworkDocUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    describe('Should complete <template> section', () => {
        it('completes directives such as v-if', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateDocUri, util_1.position(1, 8), ['v-if', 'v-cloak']);
        }));
        it('completes html tags', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateDocUri, util_1.position(2, 6), ['img', 'iframe']);
        }));
        it('completes imported components', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateDocUri, util_1.position(2, 6), ['item']);
        }));
    });
    describe('Should complete element-ui components', () => {
        it('completes <el-button> and <el-card>', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateFrameworkDocUri, util_1.position(2, 5), ['el-button', 'el-card']);
        }));
        it('completes attributes for <el-button>', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateFrameworkDocUri, util_1.position(1, 14), ['size', 'type', 'plain']);
        }));
    });
    describe('Should complete Quasar components', () => {
        it('completes <q-btn>', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateQuasarDocUri, util_1.position(2, 5), ['q-btn']);
        }));
        it('completes attributes for <q-btn>', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateQuasarDocUri, util_1.position(1, 10), ['label', 'icon']);
        }));
    });
});
//# sourceMappingURL=template.test.js.map