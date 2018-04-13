/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */
'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const express = require("express");
const lodash_1 = require("lodash");
const path = require("path");
const portfinder = require("portfinder");
const request = require("superagent");
const vscode = require("vscode");
const component = require("common/component");
const extensionContext_1 = require("common/extensionContext");
const logger_1 = require("common/logger");
const configurationManager_1 = require("configurationManager");
/**
 * TBD
 * @class WebServer
 */
let WebServer = class WebServer {
    constructor() {
        this.cache = new Map();
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.post('/command/:name', async (req, res, next) => {
            try {
                res.json(await vscode.commands.executeCommand(req.params.name, req.body));
            }
            catch (e) {
                next(e);
            }
        });
        this.app.use('/script', express.static(path.join(this.context.extensionPath, 'out', 'scripts')));
        this.app.get('/redirect', async (req, res) => {
            res.redirect(req.query.url);
        });
        this.app.get('/page/:name', async (req, res) => {
            res.send(this.getPage(req.params.name));
        });
        this.app.post('/data/job/list', this.cached(async (req) => {
            const service = (await this.configManager.getProvider(req.body.platform)).jobService;
            return service.getJobList(req.body);
        }));
        this.app.post('/data/job/detail', this.cached(async (req) => {
            const service = (await this.configManager.getProvider(req.body.platform)).jobService;
            return service.getJobDetail(req.body);
        }));
        this.app.post('/data/job/log', this.cached(async (req) => {
            const service = (await this.configManager.getProvider(req.body.platform)).jobService;
            return {
                data: await service.getJobLog(req.body)
            };
        }));
        this.app.get('/data/config/:type/gallery', this.cached(async (req) => {
            const provider = await this.configManager.getProvider(req.params.type);
            const response = await request.get(provider.gallery.webAPIUri.toString(true));
            return response.body;
        }));
        this.app.use(async (e, req, res, next) => {
            await this.logger.error(e, req.url);
            res.status(500).json(e.message);
            next(e);
        });
    }
    get port() {
        return this.portValue;
    }
    async start() {
        this.portValue = await portfinder.getPortPromise({ port: 8080 });
        this.app.listen(this.port, 'localhost');
    }
    cached(func) {
        return async (req, res, next) => {
            const id = `${req.path}:${JSON.stringify(req.body)}`;
            try {
                if (lodash_1.isEmpty(req.query.cache)) {
                    res.json(await func(req));
                }
                else {
                    if (req.query.refresh === 'true' || !this.cache.has(id)) {
                        this.cache.set(id, func(req));
                    }
                    res.json(await this.cache.get(id));
                }
            }
            catch (e) {
                this.cache.delete(id);
                res.status(400).send(e.message);
                next(e);
            }
        };
    }
    getPage(name) {
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <link rel="stylesheet" href="https://static2.sharepointonline.com/files/fabric/office-ui-fabric-core/9.3.0/css/fabric.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tachyons/4.9.1/tachyons.min.css" />
        </head>
        <body style='
            background-color: white;
            font-size: 14px;
            font-family: "Segoe UI Web (West European)", "Segoe UI", "-apple-system", BlinkMacSystemFont, "Helvetica Neue"
        '>
            <div id="content"></div>
        </body>
        <script src="/script/${name}.js"></script>
        </html>`;
    }
};
__decorate([
    component.Inject,
    __metadata("design:type", extensionContext_1.ExtensionContext)
], WebServer.prototype, "context", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", configurationManager_1.ConfigurationManager)
], WebServer.prototype, "configManager", void 0);
__decorate([
    component.Inject,
    __metadata("design:type", logger_1.Logger)
], WebServer.prototype, "logger", void 0);
WebServer = __decorate([
    component.Singleton,
    __metadata("design:paramtypes", [])
], WebServer);
exports.WebServer = WebServer;
//# sourceMappingURL=webServer.js.map