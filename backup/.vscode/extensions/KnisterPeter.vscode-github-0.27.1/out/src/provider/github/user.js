"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GithubUser {
    get id() {
        return this.struct.id;
    }
    get username() {
        return this.struct.login;
    }
    constructor(client, struct) {
        this.client = client;
        this.struct = struct;
    }
}
exports.GithubUser = GithubUser;
//# sourceMappingURL=user.js.map