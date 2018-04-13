"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GitLabUser {
    get id() {
        return this.struct.id;
    }
    get username() {
        return this.struct.username;
    }
    constructor(client, struct) {
        this.client = client;
        this.struct = struct;
    }
}
exports.GitLabUser = GitLabUser;
//# sourceMappingURL=user.js.map