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
describe('Should autocomplete for <script>', () => {
    const scriptDocUri = helper_1.getDocUri('client/completion/script/Basic.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(scriptDocUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
        // TS LS completion starts slow.
        yield helper_1.sleep(2000);
    }));
    it('completes module names when importing', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_2.testCompletion(scriptDocUri, util_1.position(5, 8), ['lodash', 'vue', 'vuex']);
    }));
    it('completes for this.', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_2.testCompletion(scriptDocUri, util_1.position(15, 11), ['foo', 'bar', '$store', '$router', '$el', '$data']);
    }));
    it('completes for lodash methods with _.', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_2.testCompletion(scriptDocUri, util_1.position(18, 8), ['curry', 'fill']);
    }));
    it('completes Vue default export methods', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_2.testCompletion(scriptDocUri, util_1.position(20, 4), ['data', 'props', 'mounted']);
    }));
});
//# sourceMappingURL=script.test.js.map