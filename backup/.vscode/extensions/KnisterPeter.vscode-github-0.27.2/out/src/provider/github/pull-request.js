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
class GithubPullRequest {
    get id() {
        return this.struct.id;
    }
    get number() {
        return this.struct.number;
    }
    get state() {
        return this.struct.state;
    }
    get title() {
        return this.struct.title;
    }
    get body() {
        return this.struct.body;
    }
    get url() {
        return this.struct.html_url;
    }
    get sourceBranch() {
        return this.struct.head.ref;
    }
    get targetBranch() {
        return this.struct.base.ref;
    }
    get mergeable() {
        return this.struct.mergeable;
    }
    constructor(client, repository, struct) {
        this.client = client;
        this.repository = repository;
        this.struct = struct;
    }
    update(body) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.updatePullRequest(this.repository.owner, this.repository.repository, this.number, {
                title: body.title,
                body: body.body,
                state: body.state
            });
        });
    }
    getComments() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.getPullRequestComments(this.repository.owner, this.repository.repository, this.number);
            return {
                body: response.body.map(comment => {
                    return {
                        file: comment.path,
                        line: comment.position,
                        body: comment.body
                    };
                })
            };
        });
    }
    merge(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.mergePullRequest(this.repository.owner, this.repository.repository, this.number, {
                merge_method: body.mergeMethod
            });
            return {
                body: {
                    merged: response.body.merged,
                    message: response.body.message,
                    sha: response.body.sha
                }
            };
        });
    }
    assign(assignees) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.editIssue(this.repository.owner, this.repository.repository, this.number, {
                assignees: assignees.map(assignee => assignee.username)
            });
        });
    }
    unassign() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.editIssue(this.repository.owner, this.repository.repository, this.number, {
                assignees: []
            });
        });
    }
    requestReview(body) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.requestReview(this.repository.owner, this.repository.repository, this.number, {
                reviewers: body.reviewers
            });
        });
    }
    cancelReview(body) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.deleteReviewRequest(this.repository.owner, this.repository.repository, this.number, {
                reviewers: body.reviewers
            });
        });
    }
}
exports.GithubPullRequest = GithubPullRequest;
//# sourceMappingURL=pull-request.js.map