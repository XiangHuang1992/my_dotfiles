/*
 * quokka-vscode - v1.0.116
 * Copyright (c) 2017-2018 WallabyJs - All Rights Reserved.
 */
!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c?c:a)},k,k.exports,a,b,c,d)}return c[g].exports}process.env.WALLABY_PRODUCTION=!0;var f="function"==typeof require&&require;module.exports=e(d[0])}({1:[function(a,b,c){"use strict";function d(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var e=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),f=a("fs"),g=a("path"),h=a("vscode"),i=a("./lib/compositeDisposable"),j=h.window,k=function(){function b(){d(this,b)}return e(b,[{key:"activate",value:function(c){var d=this;d._disposables=new i,d._setupStatusIndicator();var e=a(c.globalState.get("corePath")),f={context:c,coreClient:e,statusBar:d._statusBar,deactivate:function(){return d.deactivate()},version:b._getVersion()},g=a("./lib/controller");d._controller=new g(f),d._controller.activate(),d._disposables.add(function(){return d._controller.deactivate()})}},{key:"_setupStatusIndicator",value:function(){var a=this;a._statusBar=j.createStatusBarItem(h.StatusBarAlignment.Right,Number.NEGATIVE_INFINITY),a._statusBar.show();var b=a._statusBar.hide.bind(a._statusBar),c=a._statusBar.dispose.bind(a._statusBar);a._statusBar.hide=function(){a._statusBar.stopProgress(),b()},a._statusBar.dispose=function(){a._statusBar.stopProgress(),c()},a._statusBar.displayProgress=function(){var b=0,c=["[=-----]","[-=----]","[--=---]","[---=--]","[----=-]","[-----=]","[----=-]","[---=--]","[--=---]","[-=----]"];clearInterval(a._statusBar._progress),a._statusBar._progress=setInterval(function(){a._statusBar.setMainText(c[b=++b%c.length]+"   "),a._statusBar._doUpdateText()},150)},a._statusBar.setMainText=function(b){a._statusBar._mainText=b},a._statusBar.setExtensionText=function(b){a._statusBar._extensionText=b},a._statusBar.updateText=function(){return a._statusBar._doUpdateText()},a._statusBar._doUpdateText=function(){a._statusBar.text=(a._statusBar._mainText||"")+" "+(a._statusBar._extensionText||"")},a._statusBar.stopProgress=function(){clearInterval(a._statusBar._progress),delete a._statusBar._progress},a._statusUpdater=function(b){a._statusBar.tooltip=b},a._disposables.add(function(){a._removeStatusIndicator()})}},{key:"_hideStatusIndicator",value:function(){this._statusBar&&(this._statusBar.text="",this._statusBar.tooltip="",this._statusBar.hide()),this._statusUpdater=function(){}}},{key:"_removeStatusIndicator",value:function(){this._statusBar&&this._statusBar.dispose(),this._statusUpdater=function(){}}},{key:"deactivate",value:function(){this._disposables.dispose()}}],[{key:"_getVersion",value:function(){var a=1,b=0;try{var c=h.version.split(".");a=parseInt(c[0],10),b=parseInt(c[1],10)}catch(a){}return{major:a,minor:b}}}]),b}();c.activate=function(a){var b=new k;a.subscriptions.push({dispose:function(){return b.deactivate()}});var c=k._getVersion();c.major<=1&&c.minor<18&&!function(){var a=process.exit,c=function(){b.deactivate(),a.apply(process,arguments)},d=process.exit=function(){c.apply(null,arguments)};process.on("SIGINT",function(){d.apply(null,arguments)}),process.on("SIGTERM",function(){d.apply(null,arguments)}),process.on("exit",function(){d.apply(null,arguments)})}();try{var d=h.workspace.getConfiguration();d&&!function(){var b=d.get("quokka.colors",{});b&&Object.keys(b).forEach(function(c){try{if(!c)return;var d=a.asAbsolutePath(g.join("images",c+".svg"));if(!f.existsSync(d))return;var e=f.readFileSync(d).toString().replace(/fill:#.[^;]*/,"fill:"+b[c]);f.writeFileSync(d,e)}catch(a){console.error("Failed to set icon "+c+" type to "+b[c]+". "+a.message)}})}()}catch(a){}b.activate(a)}},{"./lib/compositeDisposable":3,"./lib/controller":4,fs:void 0,path:void 0,vscode:void 0}],2:[function(a,b,c){"use strict";var d=a("vscode"),e=a("path");c.activate=function(b){var c=d.workspace.getConfiguration()&&d.workspace.getConfiguration().get("quokka.debug",!1);return c?(global.originalRequire=a,b.globalState.update("corePath","../wallaby/client")):b.globalState.update("corePath","./wallaby/client"),c||"dist"===e.basename(__dirname)?a("./extension").activate(b):(global.originalRequire=a,a("./dist/index").activate(b))}},{"./extension":1,path:void 0,vscode:void 0}],3:[function(a,b,c){"use strict";function d(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var e=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),f=function(){function a(){d(this,a),this._disposables=[]}return e(a,[{key:"add",value:function(a){a.dispose?this._disposables.push(a):this._disposables.push({dispose:a})}},{key:"dispose",value:function(){this._disposables.forEach(function(a){return a.dispose()})}}]),a}();b.exports=f},{}],4:[function(a,b,c){"use strict";function d(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function e(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}var f=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),g=function(a,b,c){for(var d=!0;d;){var e=a,f=b,g=c;d=!1,null===e&&(e=Function.prototype);var h=Object.getOwnPropertyDescriptor(e,f);if(void 0!==h){if("value"in h)return h.value;var i=h.get;if(void 0===i)return;return i.call(g)}var j=Object.getPrototypeOf(e);if(null===j)return;a=j,b=f,c=g,d=!0,h=j=void 0}},h=a("path"),i=a("fs"),j=a("os"),k=a("vscode"),l=global._,m=global.EventEmitter,n=a("./compositeDisposable"),o=a("./outputBuilder"),p=k.workspace,q=k.window,r=300,s=3500,t="quokka",u=0,v=["showOutput","createFile","makeQuokkaFromExistingFile","createJavaScriptFile","createTypeScriptFile","showInstrumentedFile","stopCurrent","stopAll","installMissingPackageToProject","installMissingPackageToQuokka","installQuokkaPlugin","goToLineInQuokkaFile","showLicense","switchToPro","switchToCommunity","selectWorkspaceFolder"],w={javascript:".js",javascriptreact:".js",plaintext:".js",typescript:".ts",typescriptreact:".tsx"},x=function(a){function b(a){d(this,b),g(Object.getPrototypeOf(b.prototype),"constructor",this).call(this);var c=this;this._state=a,this._context=a.context,this._statusBar=a.statusBar,this._deactivator=a.deactivate,this._Session=a.coreClient.Session,this._utils=a.coreClient.utils,this._outputDocumentSelector={language:"wallaby-output"},this._setupVersionSpecificComponents(a.version),this._disposables=new n,l.each(v,function(a){return c._disposables.add(k.commands.registerCommand("quokka."+a,function(b){return c[a](b)}))}),this._coverageDecorationTypes={1:c._createCoverageDecorationType("notCovered"),2:c._createCoverageDecorationType("covered"),3:c._createCoverageDecorationType("partiallyCovered"),4:c._createCoverageDecorationType("errorSource"),5:c._createCoverageDecorationType("errorPath")},this._hideAfterContentDecorationType=q.createTextEditorDecorationType({isWholeLine:!0,after:{margin:"0 0 0 -10000px"}}),this._debugOutputChannel={appendLine:function(a,b){console.log("%c "+a,"color: "+("error"===b?"red":"darkgreen"))}},this._activeSessions=[],this._setupEnvironment()}return e(b,a),f(b,[{key:"_setupEnvironment",value:function(){var a=this;this._quokkaFolder=h.join(j.homedir(),".quokka"),this._lkp=h.join(this._quokkaFolder,".qlc");try{i.existsSync(this._quokkaFolder)||i.mkdirSync(this._quokkaFolder)}catch(a){}var b=this._loadQuokkaConfig();b.pro!==!0&&b.pro!==!1&&(q.showInformationMessage("Would you like to try 'Pro' edition features or to only use the 'Community' edition features?",{title:"'Pro' features as well",pro:!0},{title:"'Community' features only",pro:!1}).then(function(c){c&&(b.pro=c.pro,a._saveQuokkaConfig(b))}),q.showInformationMessage("You are using Quokka.js 'Community' edition (free). Quokka.js 'Pro' edition with some advanced features is also available.",{title:"More info",url:k.Uri.parse("https://quokkajs.com/pro")}).then(function(a){a&&a.url&&k.commands.executeCommand("vscode.open",a.url)}))}},{key:"_quokkaConfigPath",value:function(){return h.join(this._quokkaFolder,"config.json")}},{key:"_loadQuokkaConfig",value:function(){var a=this._quokkaConfigPath(),b={},c=void 0;try{c=i.readFileSync(a).toString(),b=JSON.parse(c)}catch(a){c&&q.showWarningMessage("Looks like your quokka config.json file has invalid syntax, it should be a valid JSON file.")}return b}},{key:"_saveQuokkaConfig",value:function(a){i.writeFileSync(this._quokkaConfigPath(),JSON.stringify(a))}},{key:"_createCoverageDecorationType",value:function(a){return q.createTextEditorDecorationType({isWholeLine:!0,gutterIconPath:this._context.asAbsolutePath(h.join("images",a+".svg")).split("\\").join("/"),light:{after:{color:"errorSource"===a?"#c80000":"#0000ff"}},dark:{after:{color:"errorSource"===a?"#fe536a":"rgba(86, 156, 214, 1)"}}})}},{key:"createFile",value:function(){var a=this;q.showQuickPick(["JavaScript","TypeScript"]).then(function(b){return a._createLanguageFile(b)})}},{key:"showOutput",value:function(){this._activeSession&&this._activeSession.outputChannel&&this._activeSession.outputChannel.show()}},{key:"createJavaScriptFile",value:function(){this._createLanguageFile("JavaScript")}},{key:"createTypeScriptFile",value:function(){this._createLanguageFile("TypeScript")}},{key:"makeQuokkaFromExistingFile",value:function(){var a=q.activeTextEditor;if(a){var b=a.document;if(b){var c=this._activeSessions.find(function(a){return a.textDocument===b});c&&this._stop(c);var d=w[b.languageId];return d?void this._start(b,a):void q.showWarningMessage('Language "'+b.languageId+'" is not supported')}}}},{key:"stopCurrent",value:function(){var a=q.activeTextEditor,b=a&&a.document&&this._activeSessions.find(function(b){return b.textDocument===a.document})||this._activeSession;b&&this._stop(b)}},{key:"stopAll",value:function(){var a=this;this._activeSessions.slice().forEach(function(b){return a._stop(b)})}},{key:"showInstrumentedFile",value:function(){var a=this;this._activeSession&&this._activeSession.requestInstrumentedFile({path:this._activeSession.fileName},function(b){a._activeSession.output.clearAndRenderHeader(),a._activeSession.output.appendConsoleMessage({text:b,type:"warn"})})}},{key:"installMissingPackageToProject",value:function(){this._installPackage(!0)}},{key:"installMissingPackageToQuokka",value:function(){this._installPackage()}},{key:"installQuokkaPlugin",value:function(a){this._installPackage(!1,a)}},{key:"goToLineInQuokkaFile",value:function(a){if(this._activeSession){if(!a)return void q.showTextDocument(this._activeSession.textDocument);a=a.split(",");var b=a[0]-1,c=(a[1]||1)-1;q.showTextDocument(this._activeSession.textDocument).then(function(a){var d=new k.Position(b,c);a.revealRange(new k.Range(d,d)),a.selection=new k.Selection(d,d)})}}},{key:"_installPackage",value:function(a,b){if(!this._activeSession)return void q.showWarningMessage("Cannot install a package because quokka is not running.");if(b)this._updateStatus(this._activeSession,"progress"),this._activeSession.runTests({file:this._activeSession.fileName,installPackage:{name:b,plugin:{editConfig:!0}}});else{if(a&&!this._projectRoot())return void q.showWarningMessage("Cannot install a package into project because quokka is running outside of an opened project.");if(!this._pro)return void this._showNotification({suggestProEdition:!0,type:"warning",text:"The feature is only available in 'Pro' edition."},this._activeSession);if(!this._activeSession.stats||!this._activeSession.stats.errors)return void q.showWarningMessage("No missing packages to install.");var c=l.find(this._activeSession.stats.errors,function(a){return a.missingPackage});if(!c||!c.missingPackage)return void q.showWarningMessage("No missing packages to install.");this._updateStatus(this._activeSession,"progress"),this._activeSession.runTests({file:this._activeSession.fileName,installPackage:{name:c.missingPackage,local:a}})}}},{key:"_setupVersionSpecificComponents",value:function(a){var b=a.major,c=a.minor;b>=1&&c>=11&&(this._outputDocumentSelector.scheme="*"),b>=1&&c>=16&&(this._multiFolderWorkspaces=!0)}},{key:"_createLanguageFile",value:function(a){var b=this;return a&&p.openTextDocument({language:a.toLowerCase()}).then(function(a){return q.showTextDocument(a).then(function(c){return b._start(a,c)})})}},{key:"_stop",value:function(a){a.disposable&&a.disposable.dispose(),this._activeSessions.splice(this._activeSessions.findIndex(function(b){return b===a}),1),this._hideStatusIndicator()}},{key:"_hideStatusIndicator",value:function(){this._statusBar.stopProgress(),this._statusBar.hide()}},{key:"_relativeNormalizedFilePath",value:function(a){return this._utils.normalizePath(h.relative(this._projectRoot(),a))}},{key:"_start",value:function(a,c){var d=this;this._updateConfigurationFromSettings(),b._checkConfigurationSettings();var e=new this._Session,f=new n;this._watcher||(this._watcher=p.createFileSystemWatcher("**/*.*"),this._disposables.add(this._watcher)),f.add(k.languages.registerHoverProvider(a.languageId,{provideHover:function(b,c){if(b===a&&!l.isEmpty(e.errorHoversByLine)){var d=e.errorHoversByLine[c.line];if(d)return new k.Hover(d.value)}}}));var g=function(){return e.runTests({file:e.fileName,externalFileChange:!0})};if(f.add(this._watcher.onDidCreate(g)),f.add(this._watcher.onDidChange(g)),f.add(this._watcher.onDidDelete(g)),e.disposable=f,e.textDocument=a,e.id=++u,e.changes=[],e.fileName=t+w[a.languageId],"file"===a.uri.scheme&&this._projectRoot(a.uri.fsPath)){var i=this._relativeNormalizedFilePath(a.uri.fsPath);i&&(e.fileName=i)}e.editors=[c],e.liveConsoleOutput=[],this._activeSessions.push(e),f.add(p.onDidCloseTextDocument(function(b){a===b&&d._stop(e)})),f.add(p.onDidChangeTextDocument(function(b){a===b.document&&d._processDocumentContentChange(e,b.document,b.contentChanges)})),f.add(q.onDidChangeActiveTextEditor(function(b){var c=e.editors.length,d=e.editors.includes(b);e.editors=e.editors.filter(function(a){return q.visibleTextEditors.includes(a)});for(var f=0;f<c-e.editors.length;f++)e.fileClosedInEditor(e.fileName);q.visibleTextEditors.filter(function(b){return b.document===a}).forEach(function(a){e.editors.includes(a)||(e.editors.push(a),e.fileOpenedInEditor(e.fileName))}),d&&(e.fileClosedInEditor(e.fileName),e.fileOpenedInEditor(e.fileName))}));var j=q.createOutputChannel("Quokka #"+this._activeSessions.length);e.outputChannel=j,j.append("");var m=l.bind(this._absoluteFilePath,this),s=new o(j,e.fileName,m,this._state.coreClient.dmp,e.disposable,this._outputDocumentSelector,!!this._projectRoot());e.output=s,e.start({localRoot:this._projectRoot(),quokkaFolder:this._quokkaFolder,client:"VSCode",fileName:e.fileName,editorTypeScript:h.join(process.mainModule.filename,"../../extensions/node_modules/typescript")}),e.on("notification",function(a){return d._showNotification(a,e)}),e.on("busy",function(){clearTimeout(d._statusUpdateTimeout),d._statusUpdateTimeout=setTimeout(function(){return d._updateStatus(e,"progress")},r),e.liveConsoleOutput=[],d._scheduleSessionIdleTimeout(e)}),e.on("stopped",function(a){d._stop(e),d._hideStatusIndicator(),a.deactivate&&(d.stopAll(),d._forceDeactivate())}),e.on("started",function(){d._debugOutputChannel.appendLine("[Info]  #"+e.id+" Quokka.js started"),j.show(),q.showTextDocument(e.textDocument)}),e.on("stats",function(a){a&&(b._outputResults(s,a),e.stats=a,d._processErrors(e)),d._updateStatus(e),delete e.liveConsoleOutput,b._sessionIsActive(e)}),e.on("live",function(a){e.fileChangedInEditor(e.fileName,e.textDocument.getText()),e.fileOpenedInEditor(e.fileName)}),e.on("configChanged",function(a){d._pro=a&&a.pro,s.setHeaderData(a)}),e.on("documentUpdates",function(a){return d._updateDocuments(e,a)}),e.on("consoleError",function(a){a&&a.split("\n").forEach(function(a){return a&&d._debugOutputChannel.appendLine("[Error] #"+e.id+" "+a,"error")}),e.emit("stats",a)}),e.on("consoleLog",function(a){return a&&a.split("\n").forEach(function(a){return a&&d._debugOutputChannel.appendLine("[Info]  #"+e.id+" "+a)})}),e.on("consoleOutput",function(a){return d._displayLiveConsoleOutput(e,s,a)}),this._updateStatus(e,"progress"),f.add(function(){j.hide(),j.dispose(),e.stop(),d._clearDecorations(e),delete e.editors,delete e.disposable,delete e.outputChannel,delete e.output,e===d._activeSession&&delete d._activeSession,b._clearIdleSessionTimeout(e),d._debugOutputChannel.appendLine("[Info]  #"+e.id+" Quokka.js stopped")})}},{key:"_forceDeactivate",value:function(){this._deactivator(),l.each(v,function(a){return k.commands.registerCommand("quokka."+a,function(){return q.showWarningMessage("Please restart VS Code for a new trial session of Quokka.js 'Pro'.")})})}},{key:"_showNotification",value:function(a,b){var c=this,d=[],e=function(a){return a&&a.url&&k.commands.executeCommand("vscode.open",a.url)};a.suggestProEdition?(d.push({title:"Switch to 'Pro'",command:function(){return c._switchEdition(!0,b)}}),d.push({title:"More info",url:k.Uri.parse("https://quokkajs.com/pro"),command:e})):(~a.text.indexOf("continue-trial-link")&&d.push({title:"Continue Trial",command:function(){return b&&!b.isDisposed()&&b.continueTrial()}}),~a.text.indexOf("activate-link")&&d.push({title:"Activate License",command:"quokka.showLicense"}),~a.text.indexOf("purchase")&&(d.push({title:"Purchase License",url:k.Uri.parse("https://quokkajs.com/pro"),command:e}),d.push({title:"Switch to 'Community'",command:"quokka.switchToCommunity"}))),a.text=a.text.replace(/<br\/><br\/>/g," ").replace(/<br\/>/g," ").replace(/<[^>]*>/g,"");var f=[a.text].concat(d);q["show"+a.type.charAt(0).toUpperCase()+a.type.substr(1)+("info"===a.type?"rmation":"")+"Message"].apply(q,f).then(this._executeCommand),0===a.text.indexOf("Can not start node.js process")&&q.showInformationMessage('You may use the "node" setting to configure the location of node.',{title:"More info",url:k.Uri.parse("https://quokkajs.com/docs/configuration.html#nodejs-version")}).then(function(a){a&&a.url&&k.commands.executeCommand("vscode.open",a.url)})}},{key:"showLicense",value:function(){var a=this,b="";try{b=i.readFileSync(this._lkp).toString()}catch(a){}q.showInputBox({value:b.length>100?b:"",prompt:"Enter your Quokka.js 'Pro' license key"}).then(function(c){if(!l.isUndefined(c)){var d=b,e=c||"",f=!!a._parseLicenseKey(d),g=a._parseLicenseKey(e),h=!!g,j=!1;if(h||!e&&f)try{i.writeFileSync(a._lkp,e),j=h}catch(a){q.showErrorMessage("Unable to save license key: "+a.message),j=!1}else q.showWarningMessage("The entered license key is not a valid Quokka.js 'Pro' license key.");j&&(q.showInformationMessage("Quokka.js 'Pro' is licensed to: "+g.licensee+". Free upgrades until: "+g.expiration+"."),a.switchToPro())}})}},{key:"_parseLicenseKey",value:function(a){if(l.isString(a))try{var b=this._utils.parseKey(a);if(b.licenseeName&&b.expirationDateString&&~b.licensedProduct.indexOf("Quokka"))return{licensee:b.licenseeName,expiration:b.expirationDateStringFormatted||b.expirationDateString}}catch(a){return}}},{key:"switchToCommunity",value:function(){this._switchEdition(!1,this._activeSession)}},{key:"switchToPro",value:function(){this._switchEdition(!0,this._activeSession)}},{key:"_switchEdition",value:function(a,b){var c=this._loadQuokkaConfig();if(c.pro=a,this._saveQuokkaConfig(c),b&&!b.isDisposed()){var d=b.textDocument,e=b.editors[0];this.stopAll(),this._start(d,e)}}},{key:"_processErrors",value:function(a){var c=this;a.stats.errors&&(a.errorHoversByLine={},b._addLineHover(a,b._createLineHoverObject(a,function(a){return a.missingPackage},function(a){return'[Install "'+a.missingPackage+'" package for the current quokka file](command:quokka.installMissingPackageToQuokka)\n          '+(c._projectRoot()?'\n[Install "'+a.missingPackage+'" package into the project](command:quokka.installMissingPackageToProject)':"")})),b._addLineHover(a,b._createLineHoverObject(a,function(a){return a.missingBrowserGlobal},function(a){return'"'+a.missingBrowserGlobal+'" looks like a browser global\n        \n[Install and use quokka browser plugin](command:quokka.installQuokkaPlugin?'+JSON.stringify("jsdom-quokka-plugin")+")"})))}},{key:"_updateConfigurationFromSettings",value:function(){var a="";try{a=this._loadQuokkaConfig().node}catch(a){}try{var b=k.workspace.getConfiguration();if(b){var c=b.get("quokka.node",a);c?process.env.WALLABY_NODE=c:delete process.env.WALLABY_NODE}}catch(a){}}},{key:"activate",value:function(){var a=this;this._onceDocumentStopsChanging=l.debounce(l.bind(this._onceDocumentStopsChanging,this),100),b._outputResults=l.debounce(l.bind(b._outputResults,this),100),this._statusBar.updateText=l.debounce(l.bind(this._statusBar.updateText,this._statusBar),200),this._executeCommand=l.bind(this._execute,this),this._statusBar.command="quokka.showOutput",this._disposables.add(function(){a._statusBar&&a._statusBar.hide(),a._activeSessions.forEach(function(a){return a.disposable.dispose()}),a._activeSessions.length=0})}},{key:"_projectRoot",value:function(a){var b=this;if(a&&this._multiFolderWorkspaces&&p.workspaceFolders&&p.workspaceFolders.length){var c=l.find(p.workspaceFolders,function(b){return~a.indexOf(b.uri.fsPath)});if(c)return this._currectProjectRoot=c.uri.fsPath,this._currectProjectRoot}if(this._currectProjectRoot)if(this._multiFolderWorkspaces&&p.workspaceFolders){var c=l.find(p.workspaceFolders,function(a){return b._currectProjectRoot===a.uri.fsPath});if(c)return c.uri.fsPath}else if(p.rootPath&&this._currectProjectRoot===p.rootPath)return p.rootPath;return this._multiFolderWorkspaces&&p.workspaceFolders?p.workspaceFolders.length?p.workspaceFolders[0].uri.fsPath:void 0:p.rootPath||""}},{key:"selectWorkspaceFolder",value:function(){var a=this;this._multiFolderWorkspaces&&p.workspaceFolders&&p.workspaceFolders.length>1&&q.showWorkspaceFolderPick&&q.showWorkspaceFolderPick().then(function(b){b&&(a._currectProjectRoot=b.uri.fsPath)})}},{key:"deactivate",value:function(){this._disposables.dispose()}},{key:"_sessionIsIdle",value:function(a){this._clearDecorations(a),delete a.stats,a.liveConsoleOutput&&!a.liveConsoleOutput.started&&a.output.clearAndRenderHeader()}},{key:"_clearDecorations",value:function(a){var b=this;a.editors.forEach(function(a){l.each(b._coverageDecorationTypes,function(b){return a.setDecorations(b,[])}),a.setDecorations(b._hideAfterContentDecorationType,[])})}},{key:"_scheduleSessionIdleTimeout",value:function(a){var c=this;b._clearIdleSessionTimeout(a),a.idleTimeout=setTimeout(function(){return c._sessionIsIdle(a)},s)}},{key:"_displayLiveConsoleOutput",value:function(a,b,c){var d=this;if(a.liveConsoleOutput){var e=a.liveConsoleOutput.started;a.liveConsoleOutput=a.liveConsoleOutput.concat(c),a.liveConsoleOutput.started=e,a.liveConsoleOutput.started?a.displayLiveConsoleOutputTimeout||this._displayPendingLiveConsoleOutput(a,b):(a.liveConsoleOutput.started=!0,a.displayLiveConsoleOutputTimeout=setTimeout(function(){delete a.displayLiveConsoleOutputTimeout,a.liveConsoleOutput&&a.liveConsoleOutput.length&&(b.clearAndRenderHeader(),d._displayPendingLiveConsoleOutput(a,b))},150))}}},{key:"_displayPendingLiveConsoleOutput",value:function(a,b){a.liveConsoleOutput.forEach(function(a){return b.appendConsoleMessage(a)}),a.liveConsoleOutput.length=0}},{key:"_execute",value:function(a){if(a&&a.command)return"function"==typeof a.command?a.command(a):~a.command.indexOf("quokka.")?k.commands.executeCommand(a.command):this[a.command]()}},{key:"_processDocumentContentChange",value:function(a,b,c){a.isDisposed()||b&&b.uri&&b.uri.scheme&&"file"!==b.uri.scheme&&"untitled"!==b.uri.scheme||(a.changes=a.changes.concat(c),this._hideMessagesForChangedRanges(a.changes),this._onceDocumentStopsChanging(a,b))}},{key:"_onceDocumentStopsChanging",value:function(a,b){var c=this;!a.isDisposed()&&a.changes.length&&(clearTimeout(this._statusUpdateTimeout),this._statusUpdateTimeout=setTimeout(function(){return c._updateStatus(a,"progress")},r),a.fileChangedInEditor(a.fileName,b.getText(),{start:l.chain(a.changes).map(function(a){return a.range.start.line}).min().value()+1,end:l.chain(a.changes).map(function(a){return a.range.end.line}).max().value()+1}),a.changes=[])}},{key:"_updateStatus",value:function(a,b){if(!a.isDisposed()){var c=void 0;clearTimeout(this._statusUpdateTimeout),b||(b=l.isString(a.stats)?"failing":a.stats?a.stats.errors.length?"failing":"passing":"failing",c=a.stats&&a.stats.time),b&&("progress"===b?this._statusBar.displayProgress():(this._statusBar.stopProgress(),this._statusBar.setMainText(("failing"===b?"✗":"✔")+(c?" "+c+"ms":"")),this._statusBar.updateText()),this._statusBar.show()),this._activeSession=a}}},{key:"_updateStatusExtension",value:function(a){this._statusBar.setExtensionText(a),this._statusBar.updateText()}},{key:"_removeStatus",value:function(){this._statusBar.hide()}},{key:"_updateDocuments",value:function(a,b){var c=this;a.isDisposed()||l.each(q.visibleTextEditors,function(d){if(d.document===a.textDocument){var e=b[a.fileName];if(e&&e.lines){var f={1:[],2:[],3:[],4:[],5:[]};l.each(e.lines,function(a){var b={range:new k.Range(a.num-1,0,a.num-1,1e3)},c=a.log||a.err,d=a.longLog||c;d&&(b.hoverMessage=k.MarkdownString?new k.MarkdownString("```\n"+d+"\n```"):{value:d}),f[a.state].push(b),c&&(b.renderOptions={after:{contentText:"  "+c}})}),l.each(f,function(a,b){return d.setDecorations(c._coverageDecorationTypes[b],a)}),c._scheduleHiddenMessagesDisplay()}}})}},{key:"_hideMessagesForChangedRanges",value:function(a){clearTimeout(this._displayHiddenMessagesTimeout),this._messagesHiddenAt=+new Date,q.activeTextEditor.setDecorations(this._hideAfterContentDecorationType,a.map(function(a){return{range:new k.Range(a.range.start.line,0,a.range.end.line,1e3)}}))}},{key:"_scheduleHiddenMessagesDisplay",value:function(){var a=this;clearTimeout(this._displayHiddenMessagesTimeout);var b=this._messagesHiddenAt?+new Date-this._messagesHiddenAt:400;this._displayHiddenMessagesTimeout=setTimeout(function(){try{l.each(q.visibleTextEditors,function(b){return b.setDecorations(a._hideAfterContentDecorationType,[])})}catch(a){}},Math.max(0,500-b))}},{key:"_navigate",value:function(a,b){if(a){var c=this._absoluteFilePath(a),d=void 0,e=void 0;l.isNumber(b)?d=b:l.isArray(b)?(d=b[0],e=b[1]):l.isString(b)&&(b=b.split(":"),d=b[0]&&parseInt(b[0],10),e=b[1]&&parseInt(b[1],10)),l.isNumber(d)?d-=1:d=0,l.isNumber(e)||(e=0),p.openTextDocument(c).then(function(a){return q.showTextDocument(a)}).then(function(a){var b=new k.Position(d,e);a.revealRange(new k.Range(b,b)),a.selection=new k.Selection(b,b)})}}},{key:"_absoluteFilePath",value:function(a){return h.resolve(this._projectRoot(),a)}}],[{key:"_addLineHover",value:function(a,b){b&&(a.errorHoversByLine[b.line]=b)}},{key:"_createLineHoverObject",value:function(a,b,c){var d=a.stats.errors.find(b),e=d&&d.stack||[];if(e.reverse(),e.length){var f=l.find(e,function(b){return b.file===a.fileName});if(f&&f.loc&&f.loc.split){var g=c(d);return k.MarkdownString&&(g=new k.MarkdownString(g),g.isTrusted=!0),{line:parseInt(f.loc.split(":")[0],10)-1,value:g}}}}},{key:"_checkConfigurationSettings",value:function(){try{var a=k.workspace.getConfiguration();a&&!a.get("editor.glyphMargin",!0)&&q.showWarningMessage("Quokka.js will not display coverage indicators because the `editor.glyphMargin` setting is set to `false`.")}catch(a){}}},{key:"_sessionIsActive",value:function(a){b._clearIdleSessionTimeout(a)}},{key:"_clearIdleSessionTimeout",value:function(a){a.idleTimeout&&(clearTimeout(a.idleTimeout),delete a.idleTimeout)}},{key:"_outputResults",value:function(a,b,c){var d=void 0,e=a.lines();a.build(b);var f=a.lines();if(d=c||f.length!==e.length,!d)for(var g=0,h=f.length;g<h;g++)if(a.areDifferent(f[g],e[g])){d=!0;break}d&&a.render()}}]),b}(m);b.exports=x},{"./compositeDisposable":3,"./outputBuilder":5,fs:void 0,os:void 0,path:void 0,vscode:void 0}],5:[function(a,b,c){"use strict";function d(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var e=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),f=a("vscode"),g=global._,h={text:"",link:Array(2).join("​"),error:Array(3).join("​"),duration:Array(4).join("​"),suite:Array(5).join("​"),message:Array(6).join("​"),diffIns:Array(2).join("‌⁠"),diffDel:Array(2).join("‍"),tmpDiffInsOpen:"wsDiffIns",tmpDiffInsClose:"weDiffIns",tmpDiffDelOpen:"wsDiffDel",tmpDiffDelClose:"weDiffDel"},i=function(){function a(b,c,e,h,i,j,k){var l=this;d(this,a),this._lines=[],this._links=[],this._quokkaFileName=c,this._contentLimit=1048576,this._channel=b,this._absolutePathResolver=e,this._dmp=h,this._hasOpenedProject=k,this.render=g.debounce(g.bind(this.render,this),300),this._header=this._channel.name,i.add(f.languages.registerDocumentLinkProvider(j,{provideDocumentLinks:function(a){var b=a.lineAt(0);return b&&b.text&&~b.text.indexOf(l._channel.name)?l._links:[]}}))}return e(a,[{key:"build",value:function(a){var b=this;this._lines=[],this._links=[],this._appendLine("suite",0,this._header);var c=g.isString(a);c?this._appendLine("error",0,a):g.isObject(a)&&(g.each(a.errors,function(a){return b._outputError(a)}),g.each(a.messages,function(a){return b._outputMessage(a)}))}},{key:"lines",value:function(){return this._lines}},{key:"render",value:function(){this._doRender()}},{key:"_doRender",value:function(a){a=a||0,!a&&this._channel.clear();for(var b="",c=a,d=this._lines.length;c<d;c++){var e=this._lines[c];if(b+=e+"\n",b.length>this._contentLimit){b+="\n--- output truncated to "+this._contentLimit+" bytes ---\n";break}}this._channel.append(b)}},{key:"clearAndRenderHeader",value:function(){this._lines=[],this._links=[],this._appendLine("suite",0,this._header),this._doRender()}},{key:"appendConsoleMessage",value:function(a){var b=this._lines.length;this._outputMessage(a),this._doRender(b)}},{key:"show",value:function(){this._channel.show(f.ViewColumn.Two)}},{key:"areDifferent",value:function(a,b){return a!==b}},{key:"setContentLimit",value:function(a){a&&(this._contentLimit=a)}},{key:"setHeaderData",value:function(a){var b=a.plugins||[];this._header=this._channel.name+(" (node: "+a.nodeVersion+(a.ts?", TypeScript: "+(a.ts.version&&"v"+a.ts.version||"unknown version"):"")+(a.babel?", babel: "+(a.babel.version&&"v"+a.babel.version||"unknown version"):"")+(b.length?", plugins: "+b.join(", "):"")+")")}},{key:"_outputMessage",value:function(a){if("diff"===a.type){if(!a.context&&!a.actual&&!a.expected)return;a.text=a.context,delete a.context}a.context&&a.context.replace&&(a.context=a.context.replace(/\r\n\s*/g," ").replace(/\n\s*/g," "));var b=a.text&&(a.text.length>20||~a.text.indexOf("\n"))&&"diff"!==a.type,c="error"===a.type?"error":"warn"===a.type||"diff"===a.type?"duration":"message";if(b)this._appendLine(c,0,"\n"+a.text),this._outputLink(a,1);else{"diff"===a.type&&this._outputDiff(0,a.expected,a.actual);var d=a.text?"\n"+h[c]+a.text+h[c]:"";if(a.file){d+=" ";var e=h.link+a.file+(a.loc?":"+a.loc:"")+h.link;d+="at "+(a.context?h.duration+a.context+h.duration+" ":""),d+=e,this._addFileLink(a.file,a.loc,e,d.length-e.length,this._lines.length+1)}this._appendLine("text",0,d);
}}},{key:"_outputError",value:function(a){var b=a.message,c=a.stack,d=a.expected,e=a.actual,f=a.missingPackage,h=a.missingBrowserGlobal,i=this,j=0;this._outputDiff(j,d,e),f&&(this._addEmptyLine(),this._addCustomLinkLine('Install "'+f+'" package for the current quokka file',"command:quokka.installMissingPackageToQuokka",j),this._hasOpenedProject&&this._addCustomLinkLine('Install "'+f+'" package into the project',"command:quokka.installMissingPackageToProject",j)),h&&(this._addEmptyLine(),this._appendLine("duration",j,'"'+h+'" looks like a browser global'),this._addCustomLinkLine("Install and use quokka browser plugin","command:quokka.installQuokkaPlugin?"+JSON.stringify("jsdom-quokka-plugin"),j),this._addCustomLinkLine("Open quokka browser plugin documentation","https://github.com/wallabyjs/jsdom-quokka-plugin",j)),this._appendLine("error",j,"\n"+b),g.each(c,function(a){return i._outputLink(a,j+1)})}},{key:"_outputDiff",value:function(a,b,c){var d=this;this._dmp&&(b||c)&&!function(){var e="\n"+d._dmp.diff_prettyHtml(d._dmp.diff_wordMode(b||"",c||"")).replace(/&para;<br>/g,"\n").replace(/<br>/g,"\n").replace(/<\/?span[^>]*>/g,"").replace(/<ins[^>]*>/g,h.tmpDiffInsOpen).replace(/<del[^>]*>/g,h.tmpDiffDelOpen).replace(/<\/ins[^>]*>/g,h.tmpDiffInsClose).replace(/<\/del[^>]*>/g,h.tmpDiffDelClose).replace(/style="background:#e6ffe6;"/g,"").replace(/style="background:#ffe6e6;"/g,"").replace(/&lt;/g,"<").replace(/&amp;/g,"&").replace(/&gt;/g,">"),f=0,g=0;d._appendLine("none",a,e,void 0,void 0,function(a){if(!a)return a;f>0&&(a=h.diffIns+a),g>0&&(a=h.diffDel+a);var b=(a.match(new RegExp(h.tmpDiffInsOpen,"g"))||[]).length,c=(a.match(new RegExp(h.tmpDiffInsClose,"g"))||[]).length;f+=b-c;var d=(a.match(new RegExp(h.tmpDiffDelOpen,"g"))||[]).length,e=(a.match(new RegExp(h.tmpDiffDelClose,"g"))||[]).length;return g+=d-e,f>0&&(a+=h.diffIns),g>0&&(a+=h.diffDel),a.replace(new RegExp(h.tmpDiffInsOpen,"g"),h.diffIns).replace(new RegExp(h.tmpDiffInsClose,"g"),h.diffIns).replace(new RegExp(h.tmpDiffDelOpen,"g"),h.diffDel).replace(new RegExp(h.tmpDiffDelClose,"g"),h.diffDel)})}()}},{key:"_outputLink",value:function(a,b){var c=this;if(a.file){var d=a.file+(a.loc?":"+a.loc:"");this._appendLine("link",b,d,void 0,a.context,function(b,e){c._addFileLink(a.file,a.loc,d,e)})}}},{key:"_addCustomLinkLine",value:function(a,b,c){var d=this._lines.length;this._appendLine("text",c,h.link+a+h.link),this._links.push({range:new f.Range(d,h.link.length,d,a.length+h.link.length),target:f.Uri.parse(b)})}},{key:"_addFileLink",value:function(a,b,c,d,e){"."!==a[0]&&a!==this._quokkaFileName||(e=e||this._lines.length,this._links.push({range:new f.Range(e,d,e,d+c.length),target:0===a.indexOf("quokka")?f.Uri.parse("command:quokka.goToLineInQuokkaFile?"+JSON.stringify(this._location(b).substring(1))):f.Uri.parse(f.Uri.file(this._absolutePathResolver(a)).toString()+this._location(b))}))}},{key:"_location",value:function(a){var b=void 0,c=void 0;return g.isNumber(a)?b=a:g.isArray(a)?(b=a[0],c=a[1]):g.isString(a)&&(a=a.split(":"),b=a[0]&&parseInt(a[0],10),c=a[1]&&parseInt(a[1],10)),"#"+(g.isNumber(c)?b+","+(c+1):b)}},{key:"_addEmptyLine",value:function(){this._appendLine("text",0,"")}},{key:"_appendLine",value:function(a,b,c,d,e,f){var i=this,j=c.split("\n"),k=h[a]||"";g.each(j,function(c){var j=(d?"["+d+"] ":"")+g.pad("",2*b,"   ")+("link"===a?"at "+(e?h.duration+e+h.duration+" ":""):"")+k,l=j+c+k;if(f){var m=f(l,j.length);m&&(l=m)}i._lines.push(l)})}}],[{key:"markupText",value:function(a,b){var c=h[a]||"";return""+c+b+c}}]),a}();b.exports=i},{vscode:void 0}]},{},[2]);