"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa = require("execa");
const path_1 = require("path");
const sander_1 = require("sander");
const tsdi_1 = require("tsdi");
const url_1 = require("url");
const vscode = require("vscode");
const helper_1 = require("./helper");
let Git = class Git {
    getRemoteName(uri) {
        return helper_1.getConfiguration('github', uri).remoteName;
    }
    execute(cmd, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const [git, ...args] = cmd.split(' ');
            const gitCommand = helper_1.getConfiguration('github', uri).gitCommand;
            this.channel.appendLine(`${gitCommand || git} ${args.join(' ')}`);
            return yield execa(gitCommand || git, args, { cwd: uri.fsPath });
        });
    }
    checkExistence(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.execute('git --version', uri);
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    getRemoteBranches(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.execute('git branch --list --remotes --no-color', uri);
            return response.stdout
                .split('\n')
                .filter(line => !line.match('->'))
                .map(line => line.replace(`${this.getRemoteName(uri)}/`, ''))
                .map(line => line.trim());
        });
    }
    /**
     * Check config for a default upstream and if none found look in .git/config for a remote origin and
     * parses it to get username and repository.
     *
     * @return {Promise<string[]>} A tuple of username and repository (e.g. KnisterPeter/vscode-github)
     * @throws Throws if the could not be parsed as a github url
     */
    getGitProviderOwnerAndRepository(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const defaultUpstream = helper_1.getConfiguration('github', uri).upstream;
            if (defaultUpstream) {
                return Promise.resolve(defaultUpstream.split('/'));
            }
            return (yield this.getGitProviderOwnerAndRepositoryFromGitConfig(uri)).slice(2, 4);
        });
    }
    getGitHostname(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getGitProviderOwnerAndRepositoryFromGitConfig(uri))[1];
        });
    }
    getGitProtocol(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getGitProviderOwnerAndRepositoryFromGitConfig(uri))[0];
        });
    }
    getGitProviderOwnerAndRepositoryFromGitConfig(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const remote = (yield this.execute(`git config --local --get remote.${this.getRemoteName(uri)}.url`, uri))
                .stdout.trim();
            if (!remote.length) {
                throw new Error('Git remote is empty!');
            }
            return this.parseGitUrl(remote);
        });
    }
    parseGitUrl(remote) {
        // git protocol remotes, may be git@github:username/repo.git
        // or git://github/user/repo.git, domain names are not case-sensetive
        if (remote.startsWith('git@') || remote.startsWith('git://')) {
            return this.parseGitProviderUrl(remote);
        }
        return this.getGitProviderOwnerAndRepositoryFromHttpUrl(remote);
    }
    parseGitProviderUrl(remote) {
        const match = new RegExp('^git(?:@|://)([^:/]+)(?::|:/|/)([^/]+)/(.+?)(?:.git)?$', 'i').exec(remote);
        if (!match) {
            throw new Error(`'${remote}' does not seem to be a valid git provider url.`);
        }
        return ['git:', ...match.slice(1, 4)];
    }
    getGitProviderOwnerAndRepositoryFromHttpUrl(remote) {
        // it must be http or https based remote
        const { protocol = 'https:', hostname, pathname } = url_1.parse(remote);
        // domain names are not case-sensetive
        if (!hostname || !pathname) {
            throw new Error('Not a Provider remote!');
        }
        const match = pathname.match(/\/(.*?)\/(.*?)(?:.git)?$/);
        if (!match) {
            throw new Error('Not a Provider remote!');
        }
        return [protocol, hostname, ...match.slice(1, 3)];
    }
    getCurrentBranch(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const stdout = (yield this.execute('git branch', uri)).stdout;
            const match = stdout.match(/^\* (.*)$/m);
            return match ? match[1] : undefined;
        });
    }
    getCommitMessage(sha, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.execute(`git log -n 1 --format=%s ${sha}`, uri)).stdout.trim();
        });
    }
    getFirstCommitOnBranch(branch, defaultBranch, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const sha = (yield this.execute(`git rev-list ^${defaultBranch} ${branch}`, uri)).stdout.trim().split('\n')[0];
            if (!sha) {
                return 'master';
            }
            return sha;
        });
    }
    getCommitBody(sha, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.execute(`git log --format=%b -n 1 ${sha}`, uri)).stdout.trim();
        });
    }
    getPullRequestBody(sha, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyMethod = helper_1.getConfiguration('github', uri).customPullRequestDescription;
            switch (bodyMethod) {
                case 'singleLine':
                    return this.getSingleLinePullRequestBody();
                case 'gitEditor':
                    return this.getGitEditorPullRequestBody(uri);
                case 'off':
                default:
                    return this.getCommitBody(sha, uri);
            }
        });
    }
    getSingleLinePullRequestBody() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield vscode.window.showInputBox({ prompt: 'Pull request description' });
        });
    }
    getGitEditorPullRequestBody(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = path_1.resolve(uri.fsPath, 'PR_EDITMSG');
            const [editorName, ...params] = (yield execa('git', ['config', '--get', 'core.editor'])).stdout.split(' ');
            yield execa(editorName, [...params, path]);
            const fileContents = (yield sander_1.readFile(path)).toString();
            yield sander_1.unlink(path);
            return fileContents;
        });
    }
    getRemoteTrackingBranch(branch, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (yield this.execute(`git config --get branch.${branch}.merge`, uri)).stdout.trim().split('\n')[0];
            }
            catch (e) {
                return undefined;
            }
        });
    }
};
__decorate([
    tsdi_1.inject('vscode.OutputChannel'),
    __metadata("design:type", Object)
], Git.prototype, "channel", void 0);
Git = __decorate([
    tsdi_1.component
], Git);
exports.Git = Git;
//# sourceMappingURL=git.js.map