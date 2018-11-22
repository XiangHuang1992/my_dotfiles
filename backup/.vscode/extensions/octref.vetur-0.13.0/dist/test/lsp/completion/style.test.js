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
const helper_2 = require("./helper");
const util_1 = require("../util");
describe('Should autocomplete for <style>', () => {
    const templateDocUri = helper_1.getDocUri('client/completion/style/Basic.vue');
    before('activate', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activateLS();
        yield helper_1.showFile(templateDocUri);
        yield helper_1.sleep(helper_1.FILE_LOAD_SLEEP_TIME);
    }));
    describe('Should complete <style> section for all languages', () => {
        it('completes CSS properties for <style lang="css">', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateDocUri, util_1.position(6, 3), ['width', 'word-wrap']);
        }));
        it('completes CSS properties for <style lang="less">', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateDocUri, util_1.position(12, 3), ['width', 'word-wrap']);
        }));
        it('completes CSS properties for <style lang="scss">', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateDocUri, util_1.position(18, 3), ['width', 'word-wrap']);
        }));
        it('completes CSS properties for <style lang="stylus">', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateDocUri, util_1.position(24, 3), ['width', 'word-wrap']);
        }));
        it('completes CSS properties for <style lang="postcss">', () => __awaiter(this, void 0, void 0, function* () {
            yield helper_2.testCompletion(templateDocUri, util_1.position(30, 3), ['width', 'word-wrap']);
        }));
    });
});
//# sourceMappingURL=style.test.js.map