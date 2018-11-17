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
const fs = require("fs-extra");
const vscode = require("vscode");
const commons_1 = require("./commons");
const enums_1 = require("./enums");
const environmentPath_1 = require("./environmentPath");
const localize_1 = require("./localize");
const lockfile = require("./lockfile");
const fileService_1 = require("./service/fileService");
const githubService_1 = require("./service/githubService");
const pluginService_1 = require("./service/pluginService");
const setting_1 = require("./setting");
const pragmaUtil_1 = require("./pragmaUtil");
class Sync {
    constructor(context) {
        this.context = context;
    }
    /**
     * Run when extension have been activated
     */
    bootstrap() {
        return __awaiter(this, void 0, void 0, function* () {
            const env = new environmentPath_1.Environment(this.context);
            const globalCommonService = new commons_1.default(env, this.context);
            // if lock file not exist
            // then create it
            if (!(yield fileService_1.FileService.FileExists(env.FILE_SYNC_LOCK))) {
                yield fs.close(yield fs.open(env.FILE_SYNC_LOCK, "w"));
            }
            // if is locked;
            if (yield lockfile.Check(env.FILE_SYNC_LOCK)) {
                yield lockfile.Unlock(env.FILE_SYNC_LOCK);
            }
            yield globalCommonService.StartMigrationProcess();
            const startUpSetting = yield globalCommonService.GetSettings();
            const startUpCustomSetting = yield globalCommonService.GetCustomSettings();
            if (startUpSetting) {
                const tokenAvailable = startUpCustomSetting.token != null && startUpCustomSetting.token !== "";
                const gistAvailable = startUpSetting.gist != null && startUpSetting.gist !== "";
                if (gistAvailable === true && startUpSetting.autoDownload === true) {
                    vscode.commands
                        .executeCommand("extension.downloadSettings")
                        .then(() => {
                        if (startUpSetting.autoUpload && tokenAvailable && gistAvailable) {
                            return globalCommonService.StartWatch();
                        }
                    });
                }
                if (startUpSetting.autoUpload && tokenAvailable && gistAvailable) {
                    return globalCommonService.StartWatch();
                }
            }
        });
    }
    /**
     * Upload setting to github gist
     */
    upload() {
        return __awaiter(this, arguments, void 0, function* () {
            const args = arguments;
            const env = new environmentPath_1.Environment(this.context);
            const common = new commons_1.default(env, this.context);
            let github = null;
            let localConfig = new setting_1.LocalConfig();
            const allSettingFiles = [];
            let uploadedExtensions = [];
            const ignoredExtensions = [];
            const dateNow = new Date();
            common.CloseWatch();
            try {
                localConfig = yield common.InitalizeSettings(true, false);
                localConfig.publicGist = false;
                if (args.length > 0) {
                    if (args[0] === "publicGIST") {
                        localConfig.publicGist = true;
                    }
                }
                github = new githubService_1.GitHubService(localConfig.customConfig.token, localConfig.customConfig.githubEnterpriseUrl);
                // ignoreSettings = await common.GetIgnoredSettings(localConfig.customConfig.ignoreUploadSettings);
                yield startGitProcess(localConfig.extConfig, localConfig.customConfig);
                // await common.SetIgnoredSettings(ignoreSettings);
            }
            catch (error) {
                commons_1.default.LogException(error, common.ERROR_MESSAGE, true);
                return;
            }
            function startGitProcess(syncSetting, customSettings) {
                return __awaiter(this, void 0, void 0, function* () {
                    vscode.window.setStatusBarMessage(localize_1.default("cmd.updateSettings.info.uploading"), 2000);
                    if (customSettings.downloadPublicGist) {
                        if (customSettings.token == null || customSettings.token === "") {
                            vscode.window.showInformationMessage(localize_1.default("cmd.updateSettings.warning.noToken"));
                            return;
                        }
                    }
                    customSettings.lastUpload = dateNow;
                    vscode.window.setStatusBarMessage(localize_1.default("cmd.updateSettings.info.readding"), 2000);
                    // var remoteList = ExtensionInformation.fromJSONList(file.content);
                    // var deletedList = PluginService.GetDeletedExtensions(uploadedExtensions);
                    if (syncSetting.syncExtensions) {
                        uploadedExtensions = pluginService_1.PluginService.CreateExtensionList();
                        if (customSettings.ignoreExtensions &&
                            customSettings.ignoreExtensions.length > 0) {
                            uploadedExtensions = uploadedExtensions.filter(extension => {
                                if (customSettings.ignoreExtensions.includes(extension.name)) {
                                    ignoredExtensions.push(extension);
                                    return false;
                                }
                                return true;
                            });
                        }
                        uploadedExtensions.sort((a, b) => a.name.localeCompare(b.name));
                        const extensionFileName = env.FILE_EXTENSION_NAME;
                        const extensionFilePath = env.FILE_EXTENSION;
                        const extensionFileContent = JSON.stringify(uploadedExtensions, undefined, 2);
                        const extensionFile = new fileService_1.File(extensionFileName, extensionFileContent, extensionFilePath, extensionFileName);
                        allSettingFiles.push(extensionFile);
                    }
                    let contentFiles = [];
                    contentFiles = yield fileService_1.FileService.ListFiles(env.USER_FOLDER, 0, 2, customSettings.supportedFileExtensions);
                    const customExist = yield fileService_1.FileService.FileExists(env.FILE_CUSTOMIZEDSETTINGS);
                    if (customExist) {
                        contentFiles = contentFiles.filter(contentFile => contentFile.fileName !== env.FILE_CUSTOMIZEDSETTINGS_NAME);
                        if (customSettings.ignoreUploadFiles.length > 0) {
                            contentFiles = contentFiles.filter(contentFile => {
                                const isMatch = customSettings.ignoreUploadFiles.indexOf(contentFile.fileName) ===
                                    -1 && contentFile.fileName !== env.FILE_CUSTOMIZEDSETTINGS_NAME;
                                return isMatch;
                            });
                        }
                        if (customSettings.ignoreUploadFolders.length > 0) {
                            contentFiles = contentFiles.filter((contentFile) => {
                                const matchedFolders = customSettings.ignoreUploadFolders.filter(folder => {
                                    return contentFile.filePath.indexOf(folder) === -1;
                                });
                                return matchedFolders.length > 0;
                            });
                        }
                        const customFileKeys = Object.keys(customSettings.customFiles);
                        if (customFileKeys.length > 0) {
                            for (const key of customFileKeys) {
                                const val = customSettings.customFiles[key];
                                const customFile = yield fileService_1.FileService.GetCustomFile(val, key);
                                if (customFile !== null) {
                                    allSettingFiles.push(customFile);
                                }
                            }
                        }
                    }
                    else {
                        commons_1.default.LogException(null, common.ERROR_MESSAGE, true);
                        return;
                    }
                    for (const snippetFile of contentFiles) {
                        if (snippetFile.fileName !== env.FILE_KEYBINDING_MAC) {
                            if (snippetFile.content !== "") {
                                if (snippetFile.fileName === env.FILE_KEYBINDING_NAME) {
                                    snippetFile.gistName =
                                        env.OsType === enums_1.OsType.Mac
                                            ? env.FILE_KEYBINDING_MAC
                                            : env.FILE_KEYBINDING_DEFAULT;
                                }
                                allSettingFiles.push(snippetFile);
                            }
                        }
                        if (snippetFile.fileName === env.FILE_SETTING_NAME) {
                            try {
                                snippetFile.content = pragmaUtil_1.default.processBeforeUpload(snippetFile.content);
                            }
                            catch (e) {
                                commons_1.default.LogException(null, e.message, true);
                                console.error(e);
                                return;
                            }
                        }
                    }
                    const extProp = new setting_1.CloudSetting();
                    extProp.lastUpload = dateNow;
                    const fileName = env.FILE_CLOUDSETTINGS_NAME;
                    const fileContent = JSON.stringify(extProp);
                    const file = new fileService_1.File(fileName, fileContent, "", fileName);
                    allSettingFiles.push(file);
                    let completed = false;
                    let newGIST = false;
                    try {
                        if (syncSetting.gist == null || syncSetting.gist === "") {
                            if (customSettings.askGistName) {
                                customSettings.gistDescription = yield common.AskGistName();
                            }
                            newGIST = true;
                            const gistID = yield github.CreateEmptyGIST(localConfig.publicGist, customSettings.gistDescription);
                            if (gistID) {
                                syncSetting.gist = gistID;
                                vscode.window.setStatusBarMessage(localize_1.default("cmd.updateSettings.info.newGistCreated"), 2000);
                            }
                            else {
                                vscode.window.showInformationMessage(localize_1.default("cmd.updateSettings.error.newGistCreateFail"));
                                return;
                            }
                        }
                        let gistObj = yield github.ReadGist(syncSetting.gist);
                        if (!gistObj) {
                            vscode.window.showErrorMessage(localize_1.default("cmd.updateSettings.error.readGistFail", syncSetting.gist));
                            return;
                        }
                        if (gistObj.data.owner !== null) {
                            const gistOwnerName = gistObj.data.owner.login.trim();
                            if (github.userName != null) {
                                const userName = github.userName.trim();
                                if (gistOwnerName !== userName) {
                                    commons_1.default.LogException(null, "Sync : You cant edit GIST for user : " +
                                        gistObj.data.owner.login, true, () => {
                                        console.log("Sync : Current User : " + "'" + userName + "'");
                                        console.log("Sync : Gist Owner User : " + "'" + gistOwnerName + "'");
                                    });
                                    return;
                                }
                            }
                        }
                        if (gistObj.public === true) {
                            localConfig.publicGist = true;
                        }
                        vscode.window.setStatusBarMessage(localize_1.default("cmd.updateSettings.info.uploadingFile"), 3000);
                        gistObj = github.UpdateGIST(gistObj, allSettingFiles);
                        completed = yield github.SaveGIST(gistObj.data);
                        if (!completed) {
                            vscode.window.showErrorMessage(localize_1.default("cmd.updateSettings.error.gistNotSave"));
                            return;
                        }
                    }
                    catch (err) {
                        commons_1.default.LogException(err, common.ERROR_MESSAGE, true);
                        return;
                    }
                    if (completed) {
                        try {
                            const settingsUpdated = yield common.SaveSettings(syncSetting);
                            const customSettingsUpdated = yield common.SetCustomSettings(customSettings);
                            if (settingsUpdated && customSettingsUpdated) {
                                if (newGIST) {
                                    vscode.window.showInformationMessage(localize_1.default("cmd.updateSettings.info.uploadingDone", syncSetting.gist));
                                }
                                if (localConfig.publicGist) {
                                    vscode.window.showInformationMessage(localize_1.default("cmd.updateSettings.info.shareGist"));
                                }
                                if (!syncSetting.quietSync) {
                                    common.ShowSummaryOutput(true, allSettingFiles, null, uploadedExtensions, ignoredExtensions, localConfig);
                                    vscode.window.setStatusBarMessage("").dispose();
                                }
                                else {
                                    vscode.window.setStatusBarMessage("").dispose();
                                    vscode.window.setStatusBarMessage(localize_1.default("cmd.updateSettings.info.uploadingSuccess"), 5000);
                                }
                                if (syncSetting.autoUpload) {
                                    common.StartWatch();
                                }
                            }
                        }
                        catch (err) {
                            commons_1.default.LogException(err, common.ERROR_MESSAGE, true);
                        }
                    }
                });
            }
        });
    }
    /**
     * Download setting from github gist
     */
    download() {
        return __awaiter(this, void 0, void 0, function* () {
            const env = new environmentPath_1.Environment(this.context);
            const common = new commons_1.default(env, this.context);
            let localSettings = new setting_1.LocalConfig();
            common.CloseWatch();
            try {
                localSettings = yield common.InitalizeSettings(true, true);
                yield StartDownload(localSettings.extConfig, localSettings.customConfig);
            }
            catch (err) {
                commons_1.default.LogException(err, common.ERROR_MESSAGE, true);
                return;
            }
            function StartDownload(syncSetting, customSettings) {
                return __awaiter(this, void 0, void 0, function* () {
                    const github = new githubService_1.GitHubService(customSettings.token, customSettings.githubEnterpriseUrl);
                    vscode.window.setStatusBarMessage("").dispose();
                    vscode.window.setStatusBarMessage(localize_1.default("cmd.downloadSettings.info.readdingOnline"), 2000);
                    const res = yield github.ReadGist(syncSetting.gist);
                    if (!res) {
                        commons_1.default.LogException(res, "Sync : Unable to Read Gist.", true);
                        return;
                    }
                    let addedExtensions = [];
                    let deletedExtensions = [];
                    const ignoredExtensions = customSettings.ignoreExtensions || new Array();
                    const updatedFiles = [];
                    const actionList = [];
                    if (res.data.public === true) {
                        localSettings.publicGist = true;
                    }
                    const keys = Object.keys(res.data.files);
                    if (keys.indexOf(env.FILE_CLOUDSETTINGS_NAME) > -1) {
                        const cloudSettGist = JSON.parse(res.data.files[env.FILE_CLOUDSETTINGS_NAME].content);
                        const cloudSett = Object.assign(new setting_1.CloudSetting(), cloudSettGist);
                        const lastUploadStr = customSettings.lastUpload
                            ? customSettings.lastUpload.toString()
                            : "";
                        const lastDownloadStr = customSettings.lastDownload
                            ? customSettings.lastDownload.toString()
                            : "";
                        let upToDate = false;
                        if (lastDownloadStr !== "") {
                            upToDate =
                                new Date(lastDownloadStr).getTime() ===
                                    new Date(cloudSett.lastUpload).getTime();
                        }
                        if (lastUploadStr !== "") {
                            upToDate =
                                upToDate ||
                                    new Date(lastUploadStr).getTime() ===
                                        new Date(cloudSett.lastUpload).getTime();
                        }
                        if (!syncSetting.forceDownload) {
                            if (upToDate) {
                                vscode.window.setStatusBarMessage("").dispose();
                                vscode.window.setStatusBarMessage(localize_1.default("cmd.downloadSettings.info.gotLatestVersion"), 5000);
                                return;
                            }
                        }
                        customSettings.lastDownload = cloudSett.lastUpload;
                    }
                    keys.forEach(gistName => {
                        if (res.data.files[gistName]) {
                            if (res.data.files[gistName].content) {
                                const prefix = fileService_1.FileService.CUSTOMIZED_SYNC_PREFIX;
                                if (gistName.indexOf(prefix) > -1) {
                                    const fileName = gistName.split(prefix).join(""); // |customized_sync|.htmlhintrc => .htmlhintrc
                                    if (!(fileName in customSettings.customFiles)) {
                                        // syncLocalSettings.json > customFiles doesn't have key
                                        return;
                                    }
                                    const f = new fileService_1.File(fileName, res.data.files[gistName].content, customSettings.customFiles[fileName], gistName);
                                    updatedFiles.push(f);
                                }
                                else if (gistName.indexOf(".") > -1) {
                                    if (env.OsType === enums_1.OsType.Mac &&
                                        gistName === env.FILE_KEYBINDING_DEFAULT) {
                                        return;
                                    }
                                    if (env.OsType !== enums_1.OsType.Mac &&
                                        gistName === env.FILE_KEYBINDING_MAC) {
                                        return;
                                    }
                                    const f = new fileService_1.File(gistName, res.data.files[gistName].content, null, gistName);
                                    updatedFiles.push(f);
                                }
                            }
                        }
                        else {
                            console.log(gistName + " key in response is empty.");
                        }
                    });
                    for (const file of updatedFiles) {
                        let writeFile = false;
                        let content = file.content;
                        if (content !== "") {
                            if (file.gistName === env.FILE_EXTENSION_NAME) {
                                if (syncSetting.syncExtensions) {
                                    if (syncSetting.removeExtensions) {
                                        try {
                                            deletedExtensions = yield pluginService_1.PluginService.DeleteExtensions(content, env.ExtensionFolder, ignoredExtensions);
                                        }
                                        catch (uncompletedExtensions) {
                                            vscode.window.showErrorMessage(localize_1.default("cmd.downloadSettings.error.removeExtFail"));
                                            deletedExtensions = uncompletedExtensions;
                                        }
                                    }
                                    try {
                                        let useCli = true;
                                        const autoUpdate = vscode.workspace
                                            .getConfiguration("extensions")
                                            .get("autoUpdate");
                                        useCli = autoUpdate;
                                        if (useCli) {
                                            if (!syncSetting.quietSync) {
                                                commons_1.default.outputChannel = vscode.window.createOutputChannel("Code Settings Sync");
                                                commons_1.default.outputChannel.clear();
                                                commons_1.default.outputChannel.appendLine(`COMMAND LINE EXTENSION DOWNLOAD SUMMARY`);
                                                commons_1.default.outputChannel.appendLine(`--------------------`);
                                                commons_1.default.outputChannel.show();
                                            }
                                        }
                                        addedExtensions = yield pluginService_1.PluginService.InstallExtensions(content, env.ExtensionFolder, useCli, ignoredExtensions, env.OsType, env.isInsiders, (message, dispose) => {
                                            if (!syncSetting.quietSync) {
                                                commons_1.default.outputChannel.appendLine(message);
                                            }
                                            else {
                                                console.log(message);
                                                if (dispose) {
                                                    vscode.window.setStatusBarMessage("Sync : " + message, 3000);
                                                }
                                            }
                                        });
                                    }
                                    catch (extensions) {
                                        addedExtensions = extensions;
                                    }
                                }
                            }
                            else {
                                writeFile = true;
                                if (file.gistName === env.FILE_KEYBINDING_DEFAULT ||
                                    file.gistName === env.FILE_KEYBINDING_MAC) {
                                    let test = "";
                                    env.OsType === enums_1.OsType.Mac
                                        ? (test = env.FILE_KEYBINDING_MAC)
                                        : (test = env.FILE_KEYBINDING_DEFAULT);
                                    if (file.gistName !== test) {
                                        writeFile = false;
                                    }
                                }
                                if (writeFile) {
                                    if (file.gistName === env.FILE_KEYBINDING_MAC) {
                                        file.fileName = env.FILE_KEYBINDING_DEFAULT;
                                    }
                                    let filePath = "";
                                    if (file.filePath !== null) {
                                        filePath = yield fileService_1.FileService.CreateCustomDirTree(file.filePath);
                                    }
                                    else {
                                        filePath = yield fileService_1.FileService.CreateDirTree(env.USER_FOLDER, file.fileName);
                                    }
                                    if (file.gistName === env.FILE_SETTING_NAME) {
                                        content = pragmaUtil_1.default.processBeforeWrite(content, env.OsType, localSettings.customConfig.hostName);
                                    }
                                    actionList.push(fileService_1.FileService.WriteFile(filePath, content)
                                        .then(() => {
                                        // TODO : add Name attribute in File and show information message here with name , when required.
                                    })
                                        .catch(err => {
                                        commons_1.default.LogException(err, common.ERROR_MESSAGE, true);
                                        return;
                                    }));
                                }
                            }
                        }
                    }
                    yield Promise.all(actionList);
                    const settingsUpdated = yield common.SaveSettings(syncSetting);
                    const customSettingsUpdated = yield common.SetCustomSettings(customSettings);
                    if (settingsUpdated && customSettingsUpdated) {
                        if (!syncSetting.quietSync) {
                            common.ShowSummaryOutput(false, updatedFiles, deletedExtensions, addedExtensions, null, localSettings);
                            const message = yield vscode.window.showInformationMessage(localize_1.default("common.prompt.restartCode"), "Yes");
                            if (message === "Yes") {
                                vscode.commands.executeCommand("workbench.action.reloadWindow");
                            }
                            vscode.window.setStatusBarMessage("").dispose();
                        }
                        else {
                            vscode.window.setStatusBarMessage("").dispose();
                            vscode.window.setStatusBarMessage(localize_1.default("cmd.downloadSettings.info.downloaded"), 5000);
                        }
                        if (Object.keys(customSettings.replaceCodeSettings).length > 0) {
                            const config = vscode.workspace.getConfiguration();
                            const keysDefined = Object.keys(customSettings.replaceCodeSettings);
                            for (const key of keysDefined) {
                                const value = customSettings.replaceCodeSettings[key];
                                const c = value === "" ? undefined : value;
                                config.update(key, c, true);
                            }
                        }
                        if (syncSetting.autoUpload) {
                            common.StartWatch();
                        }
                    }
                    else {
                        vscode.window.showErrorMessage(localize_1.default("cmd.downloadSettings.error.unableSave"));
                    }
                });
            }
        });
    }
    /**
     * Reset the setting to Sync
     */
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            let extSettings = null;
            let localSettings = null;
            vscode.window.setStatusBarMessage(localize_1.default("cmd.resetSettings.info.resetting"), 2000);
            try {
                const env = new environmentPath_1.Environment(this.context);
                const common = new commons_1.default(env, this.context);
                extSettings = new setting_1.ExtensionConfig();
                localSettings = new setting_1.CustomSettings();
                const extSaved = yield common.SaveSettings(extSettings);
                const customSaved = yield common.SetCustomSettings(localSettings);
                const lockExist = yield fileService_1.FileService.FileExists(env.FILE_SYNC_LOCK);
                if (!lockExist) {
                    fs.closeSync(fs.openSync(env.FILE_SYNC_LOCK, "w"));
                }
                // check is sync locking
                if (yield lockfile.Check(env.FILE_SYNC_LOCK)) {
                    yield lockfile.Unlock(env.FILE_SYNC_LOCK);
                }
                if (extSaved && customSaved) {
                    vscode.window.showInformationMessage(localize_1.default("cmd.resetSettings.info.settingClear"));
                }
            }
            catch (err) {
                commons_1.default.LogException(err, "Sync : Unable to clear settings. Error Logged on console. Please open an issue.", true);
            }
        });
    }
    how() {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode.commands.executeCommand("vscode.open", vscode.Uri.parse("http://shanalikhan.github.io/2015/12/15/Visual-Studio-Code-Sync-Settings.html"));
        });
    }
    advance() {
        return __awaiter(this, void 0, void 0, function* () {
            const env = new environmentPath_1.Environment(this.context);
            const common = new commons_1.default(env, this.context);
            const setting = yield common.GetSettings();
            const customSettings = yield common.GetCustomSettings();
            const localSetting = new setting_1.LocalConfig();
            const tokenAvailable = customSettings.token != null && customSettings.token !== "";
            const gistAvailable = setting.gist != null && setting.gist !== "";
            const items = [
                "cmd.otherOptions.editLocalSetting",
                "cmd.otherOptions.shareSetting",
                "cmd.otherOptions.downloadSetting",
                "cmd.otherOptions.toggleForceDownload",
                "cmd.otherOptions.toggleAutoUpload",
                "cmd.otherOptions.toggleAutoDownload",
                "cmd.otherOptions.toggleSummaryPage",
                "cmd.otherOptions.preserve",
                "cmd.otherOptions.customizedSync",
                "cmd.otherOptions.downloadCustomFile",
                "cmd.otherOptions.joinCommunity",
                "cmd.otherOptions.openIssue",
                "cmd.otherOptions.releaseNotes"
            ].map(localize_1.default);
            let selectedItem = 0;
            let settingChanged = false;
            const item = yield vscode.window.showQuickPick(items);
            // if not pick anyone, do nothing
            if (!item) {
                return;
            }
            const index = items.findIndex(v => v === item);
            const handlerMap = {
                0: () => __awaiter(this, void 0, void 0, function* () {
                    const file = vscode.Uri.file(env.FILE_CUSTOMIZEDSETTINGS);
                    fs.openSync(file.fsPath, "r");
                    const document = yield vscode.workspace.openTextDocument(file);
                    yield vscode.window.showTextDocument(document, vscode.ViewColumn.One, true);
                }),
                1: () => __awaiter(this, void 0, void 0, function* () {
                    // share public gist
                    const answer = yield vscode.window.showInformationMessage(localize_1.default("cmd.otherOptions.shareSetting.beforeConfirm"), "Yes");
                    if (answer === "Yes") {
                        localSetting.publicGist = true;
                        settingChanged = true;
                        setting.gist = "";
                        selectedItem = 1;
                        customSettings.downloadPublicGist = false;
                        yield common.SetCustomSettings(customSettings);
                    }
                }),
                2: () => __awaiter(this, void 0, void 0, function* () {
                    // Download Settings from Public GIST
                    selectedItem = 2;
                    customSettings.downloadPublicGist = true;
                    settingChanged = true;
                    yield common.SetCustomSettings(customSettings);
                }),
                3: () => __awaiter(this, void 0, void 0, function* () {
                    // toggle force download
                    selectedItem = 3;
                    settingChanged = true;
                    setting.forceDownload = !setting.forceDownload;
                }),
                4: () => __awaiter(this, void 0, void 0, function* () {
                    // toggle auto upload
                    selectedItem = 4;
                    settingChanged = true;
                    setting.autoUpload = !setting.autoUpload;
                }),
                5: () => __awaiter(this, void 0, void 0, function* () {
                    // auto download on startup
                    selectedItem = 5;
                    settingChanged = true;
                    if (!setting) {
                        vscode.commands.executeCommand("extension.HowSettings");
                        return;
                    }
                    if (!gistAvailable) {
                        vscode.commands.executeCommand("extension.HowSettings");
                        return;
                    }
                    setting.autoDownload = !setting.autoDownload;
                }),
                6: () => __awaiter(this, void 0, void 0, function* () {
                    // page summary toggle
                    selectedItem = 6;
                    settingChanged = true;
                    if (!tokenAvailable || !gistAvailable) {
                        vscode.commands.executeCommand("extension.HowSettings");
                        return;
                    }
                    setting.quietSync = !setting.quietSync;
                }),
                7: () => __awaiter(this, void 0, void 0, function* () {
                    // preserve
                    const options = {
                        ignoreFocusOut: true,
                        placeHolder: localize_1.default("cmd.otherOptions.preserve.placeholder"),
                        prompt: localize_1.default("cmd.otherOptions.preserve.prompt")
                    };
                    const input = yield vscode.window.showInputBox(options);
                    if (input) {
                        const settingKey = input;
                        const a = vscode.workspace.getConfiguration();
                        const val = a.get(settingKey);
                        customSettings.replaceCodeSettings[input] = val;
                        const done = yield common.SetCustomSettings(customSettings);
                        if (done) {
                            if (val === "") {
                                vscode.window.showInformationMessage(localize_1.default("cmd.otherOptions.preserve.info.done1", input));
                            }
                            else {
                                vscode.window.showInformationMessage(localize_1.default("cmd.otherOptions.preserve.info.done2", input, val));
                            }
                        }
                    }
                }),
                8: () => __awaiter(this, void 0, void 0, function* () {
                    // add customized sync file
                    const options = {
                        ignoreFocusOut: true,
                        placeHolder: localize_1.default("cmd.otherOptions.customizedSync.placeholder"),
                        prompt: localize_1.default("cmd.otherOptions.customizedSync.prompt")
                    };
                    const input = yield vscode.window.showInputBox(options);
                    if (input) {
                        const fileName = fileService_1.FileService.ExtractFileName(input);
                        if (fileName === "") {
                            return;
                        }
                        customSettings.customFiles[fileName] = input;
                        const done = yield common.SetCustomSettings(customSettings);
                        if (done) {
                            vscode.window.showInformationMessage(localize_1.default("cmd.otherOptions.customizedSync.done", fileName));
                        }
                    }
                }),
                9: () => __awaiter(this, void 0, void 0, function* () {
                    // Import customized sync file to workspace
                    const customFiles = yield this.getCustomFilesFromGist(customSettings, setting);
                    if (customFiles.length < 1) {
                        return;
                    }
                    const options = {
                        ignoreFocusOut: true,
                        placeHolder: localize_1.default("cmd.otherOptions.downloadCustomFile.placeholder")
                    };
                    const fileName = yield vscode.window.showQuickPick(customFiles.map(file => {
                        return file.fileName;
                    }), options);
                    // if not pick anyone, do nothing
                    if (!fileName) {
                        return;
                    }
                    const selected = customFiles.find(f => {
                        return f.fileName === fileName;
                    });
                    if (selected && vscode.workspace.rootPath) {
                        const downloadPath = fileService_1.FileService.ConcatPath(vscode.workspace.rootPath, selected.fileName);
                        const done = yield fileService_1.FileService.WriteFile(downloadPath, selected.content);
                        if (done) {
                            vscode.window.showInformationMessage(localize_1.default("cmd.otherOptions.downloadCustomFile.done", downloadPath));
                        }
                    }
                }),
                10: () => __awaiter(this, void 0, void 0, function* () {
                    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse("https://join.slack.com/t/codesettingssync/shared_invite/enQtMzE3MjY5NTczNDMwLTYwMTIwNGExOGE2MTJkZWU0OTU5MmI3ZTc4N2JkZjhjMzY1OTk5OGExZjkwMDMzMDU4ZTBlYjk5MGQwZmMyNzk"));
                }),
                11: () => __awaiter(this, void 0, void 0, function* () {
                    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse("https://github.com/shanalikhan/code-settings-sync/issues/new"));
                }),
                12: () => __awaiter(this, void 0, void 0, function* () {
                    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse("http://shanalikhan.github.io/2016/05/14/Visual-studio-code-sync-settings-release-notes.html"));
                })
            };
            try {
                yield handlerMap[index]();
                if (settingChanged) {
                    if (selectedItem === 1) {
                        common.CloseWatch();
                    }
                    yield common
                        .SaveSettings(setting)
                        .then((added) => {
                        if (added) {
                            const callbackMap = {
                                1: () => __awaiter(this, void 0, void 0, function* () {
                                    return yield vscode.commands.executeCommand("extension.updateSettings", "publicGIST");
                                }),
                                2: () => __awaiter(this, void 0, void 0, function* () {
                                    return yield vscode.window.showInformationMessage(localize_1.default("cmd.otherOptions.warning.tokenNotRequire"));
                                }),
                                3: () => __awaiter(this, void 0, void 0, function* () {
                                    const message = setting.forceDownload
                                        ? "cmd.otherOptions.toggleForceDownload.on"
                                        : "cmd.otherOptions.toggleForceDownload.off";
                                    return vscode.window.showInformationMessage(localize_1.default(message));
                                }),
                                4: () => __awaiter(this, void 0, void 0, function* () {
                                    const message = setting.autoUpload
                                        ? "cmd.otherOptions.toggleAutoUpload.on"
                                        : "cmd.otherOptions.toggleAutoUpload.off";
                                    return vscode.window.showInformationMessage(localize_1.default(message));
                                }),
                                5: () => __awaiter(this, void 0, void 0, function* () {
                                    const message = setting.autoDownload
                                        ? "cmd.otherOptions.toggleAutoDownload.on"
                                        : "cmd.otherOptions.toggleAutoDownload.off";
                                    return vscode.window.showInformationMessage(localize_1.default(message));
                                }),
                                6: () => __awaiter(this, void 0, void 0, function* () {
                                    const message = setting.quietSync
                                        ? "cmd.otherOptions.quietSync.on"
                                        : "cmd.otherOptions.quietSync.off";
                                    return vscode.window.showInformationMessage(localize_1.default(message));
                                })
                            };
                            if (callbackMap[selectedItem]) {
                                return callbackMap[selectedItem]();
                            }
                        }
                        else {
                            return vscode.window.showErrorMessage(localize_1.default("cmd.otherOptions.error.toggleFail"));
                        }
                    })
                        .catch(err => {
                        commons_1.default.LogException(err, "Sync : Unable to toggle. Please open an issue.", true);
                    });
                }
            }
            catch (err) {
                commons_1.default.LogException(err, "Error", true);
                return;
            }
        });
    }
    getCustomFilesFromGist(customSettings, syncSetting) {
        return __awaiter(this, void 0, void 0, function* () {
            const github = new githubService_1.GitHubService(customSettings.token, customSettings.githubEnterpriseUrl);
            const res = yield github.ReadGist(syncSetting.gist);
            if (!res) {
                commons_1.default.LogException(res, "Sync : Unable to Read Gist.", true);
                return [];
            }
            const keys = Object.keys(res.data.files);
            const customFiles = [];
            keys.forEach(gistName => {
                if (res.data.files[gistName]) {
                    if (res.data.files[gistName].content) {
                        const prefix = fileService_1.FileService.CUSTOMIZED_SYNC_PREFIX;
                        if (gistName.indexOf(prefix) > -1) {
                            const fileName = gistName.split(prefix).join(""); // |customized_sync|.htmlhintrc => .htmlhintrc
                            const f = new fileService_1.File(fileName, res.data.files[gistName].content, fileName in customSettings.customFiles
                                ? customSettings.customFiles[fileName]
                                : null, gistName);
                            customFiles.push(f);
                        }
                    }
                }
            });
            return customFiles;
        });
    }
}
exports.Sync = Sync;
//# sourceMappingURL=sync.js.map