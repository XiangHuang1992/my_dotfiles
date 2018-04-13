/*
 * Wallaby.js - v1.0.577
 * http://wallabyjs.com
 * Copyright (c) 2014-2018 Wallaby.js - All Rights Reserved.
 *
 * This source code file is a part of Wallaby.js and is a proprietary (closed source) software.

 * IMPORTANT:
 * Wallaby.js is a tool made by software developers for software developers with passion and love for what we do.
 * Pirating the tool is not only illegal and just morally wrong,
 * it is also unfair to other fellow programmers who are using it legally,
 * and very harmful for the tool and its future.
 */
!function e(t,n,i){function r(s,a){if(!n[s]){if(!t[s]){var l="function"==typeof require&&require;if(!a&&l)return l(s,!0);if(o)return o(s,!0);var c=new Error("Cannot find module '"+s+"'");throw c.code="MODULE_NOT_FOUND",c}var u=n[s]={exports:{}};t[s][0].call(u.exports,function(e){var n=t[s][1][e];return r(n?n:e)},u,u.exports,e,t,n,i)}return n[s].exports}var o="function"==typeof require&&require;module.exports=r(i[0])}({1:[function(e,t,n){global.wallabyCoreClient=!0,e("./lib/global"),delete global.wallabyCoreClient;var i=e("child_process"),r=e("path"),o=e("http"),s=e("ws"),a=0,l=/^win/.test(process.platform),c=function(){this._killed=!1,this._callbacks=Object.create(null)};c.prototype=_.extend(Object.create(EventEmitter.prototype),{start:function(e){var t=this;this._openedFiles=Object.create(null),this._killed=!1,this._forceKillProcessTimeout=e.forceKillProcessTimeout||1e3,this._nodePath=process.env.WALLABY_NODE||"node";var n=process.env.PATH||process.env.Path,o=_.extend({},process.env,{PATH:(n?n+r.delimiter:"")+(l?"":"/usr/local/bin")});delete o.NODE_ENV,delete o.NODE_PATH,t._withFreePort(function(n){t._killed||(t._process=i.spawn(t._nodePath,["--harmony",r.join(__dirname,"server.js"),"extended-core-ws","--projectCachePath="+e.projectPath,"--configPath="+e.configPath,"--lkp="+e.lkp,"--client="+e.client,"--phantomjs="+e.phantomPath,"--editorTypeScript="+e.editorTypeScript,"--port="+n,"--quokka="+(e.fileName||"")],{env:o,cwd:e.configPath&&!e.fileName?r.dirname(e.configPath):e.localRoot||e.quokkaFolder}),t._process.on("error",function(e){e&&e.message&&~e.message.indexOf("spawn "+t._nodePath+" ENOENT")?(t.emit("notification",{type:"error",text:"Can not start node.js process ("+t._nodePath+'), make sure your system has <a href="http://wallabyjs.com/docs/intro/install.html#node-js">node.js installed</a>.'}),t.emit("stopped",{})):t.emit("consoleError",e.stack||e.message)}),t._bufferStream(t._process.stderr,function(e){t.emit("consoleError",e)}),t._bufferStream(t._process.stdout,function(e){e&&(~e.indexOf("wallaby.js started")||~e.indexOf("quokka.js started"))?t._connectToServer(n):t.emit("consoleLog",e)}))})},stop:function(){var e,t=this;try{e=this._process.pid;try{this._send({type:"stop"}),this._ws.close(),this._ws.removeAllListeners("close"),this._ws.removeAllListeners("error")}finally{try{this._process.disconnect()}catch(n){}setTimeout(function(){try{t._isProcessRunning(e)&&process.kill(e)}catch(n){}},t._forceKillProcessTimeout)}}catch(n){}finally{this._killed=!0,this._callbacks=Object.create(null),this._openedFiles=Object.create(null)}},_isProcessRunning:function(e){try{return process.kill(e,0)}catch(t){return"EPERM"===t.code}},_connectToServer:function(e,t){var n=this;t=t||"localhost",n._ws=new s("ws://"+t+":"+e),n._ws.on("message",function(e){var t=JSON.parse(e),i=n["_"+t.type];i&&i.call(n,t)}),n._ws.on("close",function(e,t){console.log("Disconnected from wallaby core: "+e+(t?", "+t:""))}),n._ws.on("error",function(){n._connectToServer(e,"127.0.0.1")})},_withFreePort:function(e){var t=o.createServer();t.listen(0),t.on("listening",function(){var n=t.address().port;t.once("close",function(){e(n)}),t.close()})},isDisposed:function(){return this._killed},fileChangedInEditor:function(e,t,n){this._send({type:"fileChangedInEditor",path:e,content:t,changeFrame:n})},fileOpenedInEditor:function(e){this._openedFiles[e]=(this._openedFiles[e]||0)+1,this._send({type:"fileOpenedInEditor",path:e})},fileClosedInEditor:function(e){var t=(this._openedFiles[e]||0)-1;if(this._openedFiles[e]=t,0>t)throw new Error("Negative opened editor count for "+e);0===t&&(delete this._openedFiles[e],this._send({type:"fileClosedInAllEditors",path:e}))},runTests:function(e){this._send({type:"runTests",request:e})},continueTrial:function(){this._send({type:"continueTrial"})},requestUncoveredRegions:function(e,t){this._requestWithCorrelationId("uncoveredRegions",e,t)},requestLineReport:function(e,t){this._requestWithCorrelationId("lineReport",e,t)},requestLocation:function(e,t){this._requestWithCorrelationId("location",e,t)},requestInstrumentedFile:function(e,t){this._requestWithCorrelationId("instrumentedFile",e,t)},requestError:function(e,t){this._requestWithCorrelationId("error",e,t)},_requestWithCorrelationId:function(e,t,n){var i=this,r=++a,o=this._callbacks[r]={done:n};this._send({type:e,request:t,id:r}),o.timeout=setTimeout(function(){delete i._callbacks[r]},5e3)},_responseWithCorrelationId:function(e){var t=this._callbacks[e.id];delete this._callbacks[e.id],t&&(clearTimeout(t.timeout),t.done(e.data))},_bufferStream:function(e,t){var n=this,i="";e.setEncoding("utf8"),e.on("data",function(e){if(!n._killed){i+=e;var r=i.lastIndexOf("\n");~r&&(t(i.substring(0,r+1)),i=i.substring(r+1))}}),e.on("close",function(){n._killed||i.length&&t(i)})},_send:function(e){this._ws&&this._ws.send(JSON.stringify(e))},_started:function(e){this.emit("started",e)},_stopped:function(e){this.emit("stopped",e)},_configChanged:function(e){this.emit("configChanged",e)},_expiredLicense:function(e){this.emit("expiredLicense",e)},_documentUpdates:function(e){this.emit("documentUpdates",e.updates)},_navigationRequested:function(e){this.emit("navigationRequested",e)},_stats:function(e){this.emit("stats",e.data)},_filesToTrack:function(e){this.emit("filesToTrack",e.files)},_live:function(e){this.emit("live",e)},_projectConfigured:function(e){},_notification:function(e){this.emit("notification",e.notification)},_consoleOutput:function(e){this.emit("consoleOutput",e.messages)},_busy:function(){this.emit("busy")},_location:function(e){this._responseWithCorrelationId(e)},_error:function(e){this._responseWithCorrelationId(e)},_uncoveredRegions:function(e){this._responseWithCorrelationId(e)},_lineReport:function(e){this._responseWithCorrelationId(e)},_instrumentedFile:function(e){this._responseWithCorrelationId(e)}}),t.exports={Session:c,enums:e("./lib/extension/shared/enums"),utils:e("./lib/extension/shared/utils"),reportBuilder:e("./lib/extension/client/reportBuilder"),dmp:new(e("./lib/diffMatchPatch"))}},{"./lib/diffMatchPatch":2,"./lib/extension/client/reportBuilder":3,"./lib/extension/shared/enums":4,"./lib/extension/shared/utils":5,"./lib/global":6,child_process:void 0,http:void 0,path:void 0,ws:void 0}],2:[function(e,t,n){function i(){this.Diff_Timeout=1,this.Diff_EditCost=4,this.Match_Threshold=.5,this.Match_Distance=1e3,this.Patch_DeleteThreshold=.5,this.Patch_Margin=4,this.Match_MaxBits=32}var r=-1,o=1,s=0;i.Diff,i.prototype.diff_main=function(e,t,n,i){"undefined"==typeof i&&(i=this.Diff_Timeout<=0?Number.MAX_VALUE:(new Date).getTime()+1e3*this.Diff_Timeout);var r=i;if(null==e||null==t)throw new Error("Null input. (diff_main)");if(e==t)return e?[[s,e]]:[];"undefined"==typeof n&&(n=!0);var o=n,a=this.diff_commonPrefix(e,t),l=e.substring(0,a);e=e.substring(a),t=t.substring(a),a=this.diff_commonSuffix(e,t);var c=e.substring(e.length-a);e=e.substring(0,e.length-a),t=t.substring(0,t.length-a);var u=this.diff_compute_(e,t,o,r);return l&&u.unshift([s,l]),c&&u.push([s,c]),this.diff_cleanupMerge(u),u},i.prototype.diff_compute_=function(e,t,n,i){var a;if(!e)return[[o,t]];if(!t)return[[r,e]];var l=e.length>t.length?e:t,c=e.length>t.length?t:e,u=l.indexOf(c);if(-1!=u)return a=[[o,l.substring(0,u)],[s,c],[o,l.substring(u+c.length)]],e.length>t.length&&(a[0][0]=a[2][0]=r),a;if(1==c.length)return[[r,e],[o,t]];var d=this.diff_halfMatch_(e,t);if(d){var h=d[0],p=d[1],f=d[2],_=d[3],m=d[4],g=this.diff_main(h,f,n,i),y=this.diff_main(p,_,n,i);return g.concat([[s,m]],y)}return n&&e.length>100&&t.length>100?this.diff_lineMode_(e,t,i):this.diff_bisect_(e,t,i)},i.prototype.diff_lineMode_=function(e,t,n){var i=this.diff_linesToChars_(e,t);e=i.chars1,t=i.chars2;var a=i.lineArray,l=this.diff_main(e,t,!1,n);this.diff_charsToLines_(l,a),this.diff_cleanupSemantic(l),l.push([s,""]);for(var c=0,u=0,d=0,h="",p="";c<l.length;){switch(l[c][0]){case o:d++,p+=l[c][1];break;case r:u++,h+=l[c][1];break;case s:if(u>=1&&d>=1){l.splice(c-u-d,u+d),c=c-u-d;for(var i=this.diff_main(h,p,!1,n),f=i.length-1;f>=0;f--)l.splice(c,0,i[f]);c+=i.length}d=0,u=0,h="",p=""}c++}return l.pop(),l},i.prototype.diff_bisect_=function(e,t,n){for(var i=e.length,s=t.length,a=Math.ceil((i+s)/2),l=a,c=2*a,u=new Array(c),d=new Array(c),h=0;c>h;h++)u[h]=-1,d[h]=-1;u[l+1]=0,d[l+1]=0;for(var p=i-s,f=p%2!=0,_=0,m=0,g=0,y=0,v=0;a>v&&!((new Date).getTime()>n);v++){for(var T=-v+_;v-m>=T;T+=2){var V,R=l+T;V=T==-v||T!=v&&u[R-1]<u[R+1]?u[R+1]:u[R-1]+1;for(var F=V-T;i>V&&s>F&&e.charAt(V)==t.charAt(F);)V++,F++;if(u[R]=V,V>i)m+=2;else if(F>s)_+=2;else if(f){var b=l+p-T;if(b>=0&&c>b&&-1!=d[b]){var k=i-d[b];if(V>=k)return this.diff_bisectSplit_(e,t,V,F,n)}}}for(var M=-v+g;v-y>=M;M+=2){var k,b=l+M;k=M==-v||M!=v&&d[b-1]<d[b+1]?d[b+1]:d[b-1]+1;for(var E=k-M;i>k&&s>E&&e.charAt(i-k-1)==t.charAt(s-E-1);)k++,E++;if(d[b]=k,k>i)y+=2;else if(E>s)g+=2;else if(!f){var R=l+p-M;if(R>=0&&c>R&&-1!=u[R]){var V=u[R],F=l+V-R;if(k=i-k,V>=k)return this.diff_bisectSplit_(e,t,V,F,n)}}}}return[[r,e],[o,t]]},i.prototype.diff_bisectSplit_=function(e,t,n,i,r){var o=e.substring(0,n),s=t.substring(0,i),a=e.substring(n),l=t.substring(i),c=this.diff_main(o,s,!1,r),u=this.diff_main(a,l,!1,r);return c.concat(u)},i.prototype.diff_linesToChars_=function(e,t){function n(e){for(var t="",n=0,o=-1,s=i.length;o<e.length-1;){o=e.indexOf("\n",n),-1==o&&(o=e.length-1);var a=e.substring(n,o+1);n=o+1,(r.hasOwnProperty?r.hasOwnProperty(a):void 0!==r[a])?t+=String.fromCharCode(r[a]):(t+=String.fromCharCode(s),r[a]=s,i[s++]=a)}return t}var i=[],r={};i[0]="";var o=n(e),s=n(t);return{chars1:o,chars2:s,lineArray:i}},i.prototype.diff_wordMode=function(e,t){var n=this.diff_linesToWords_(e,t),i=n.chars1,r=n.chars2,o=n.lineArray,s=this.diff_main(i,r,!1);return this.diff_charsToLines_(s,o),s},i.prototype.diff_linesToWords_=function(e,t){function n(e){for(var t=e.split(/(\s+|\b)/),n=0;n<t.length-1;n++)!t[n+1]&&t[n+2]&&s.test(t[n])&&s.test(t[n+2])&&(t[n]+=t[n+2],t.splice(n+1,2),n--);return t}function i(e){for(var t="",i=n(e),s=r.length,a=0,l=i.length;l>a;a++){var c=i[a];(o.hasOwnProperty?o.hasOwnProperty(c):void 0!==o[c])?t+=String.fromCharCode(o[c]):(t+=String.fromCharCode(s),o[c]=s,r[s++]=c)}return t}var r=[],o={};r[0]="";var s=/^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/,a=i(e),l=i(t);return{chars1:a,chars2:l,lineArray:r}},i.prototype.diff_charsToLines_=function(e,t){for(var n=0;n<e.length;n++){for(var i=e[n][1],r=[],o=0;o<i.length;o++)r[o]=t[i.charCodeAt(o)];e[n][1]=r.join("")}},i.prototype.diff_commonPrefix=function(e,t){if(!e||!t||e.charAt(0)!=t.charAt(0))return 0;for(var n=0,i=Math.min(e.length,t.length),r=i,o=0;r>n;)e.substring(o,r)==t.substring(o,r)?(n=r,o=n):i=r,r=Math.floor((i-n)/2+n);return r},i.prototype.diff_commonSuffix=function(e,t){if(!e||!t||e.charAt(e.length-1)!=t.charAt(t.length-1))return 0;for(var n=0,i=Math.min(e.length,t.length),r=i,o=0;r>n;)e.substring(e.length-r,e.length-o)==t.substring(t.length-r,t.length-o)?(n=r,o=n):i=r,r=Math.floor((i-n)/2+n);return r},i.prototype.diff_commonOverlap_=function(e,t){var n=e.length,i=t.length;if(0==n||0==i)return 0;n>i?e=e.substring(n-i):i>n&&(t=t.substring(0,n));var r=Math.min(n,i);if(e==t)return r;for(var o=0,s=1;;){var a=e.substring(r-s),l=t.indexOf(a);if(-1==l)return o;s+=l,(0==l||e.substring(r-s)==t.substring(0,s))&&(o=s,s++)}},i.prototype.diff_halfMatch_=function(e,t){function n(e,t,n){for(var i,r,o,a,l=e.substring(n,n+Math.floor(e.length/4)),c=-1,u="";-1!=(c=t.indexOf(l,c+1));){var d=s.diff_commonPrefix(e.substring(n),t.substring(c)),h=s.diff_commonSuffix(e.substring(0,n),t.substring(0,c));u.length<h+d&&(u=t.substring(c-h,c)+t.substring(c,c+d),i=e.substring(0,n-h),r=e.substring(n+d),o=t.substring(0,c-h),a=t.substring(c+d))}return 2*u.length>=e.length?[i,r,o,a,u]:null}if(this.Diff_Timeout<=0)return null;var i=e.length>t.length?e:t,r=e.length>t.length?t:e;if(i.length<4||2*r.length<i.length)return null;var o,s=this,a=n(i,r,Math.ceil(i.length/4)),l=n(i,r,Math.ceil(i.length/2));if(!a&&!l)return null;o=l?a&&a[4].length>l[4].length?a:l:a;var c,u,d,h;e.length>t.length?(c=o[0],u=o[1],d=o[2],h=o[3]):(d=o[0],h=o[1],c=o[2],u=o[3]);var p=o[4];return[c,u,d,h,p]},i.prototype.diff_cleanupSemantic=function(e){for(var t=!1,n=[],i=0,a=null,l=0,c=0,u=0,d=0,h=0;l<e.length;)e[l][0]==s?(n[i++]=l,c=d,u=h,d=0,h=0,a=e[l][1]):(e[l][0]==o?d+=e[l][1].length:h+=e[l][1].length,a&&a.length<=Math.max(c,u)&&a.length<=Math.max(d,h)&&(e.splice(n[i-1],0,[r,a]),e[n[i-1]+1][0]=o,i--,i--,l=i>0?n[i-1]:-1,c=0,u=0,d=0,h=0,a=null,t=!0)),l++;for(t&&this.diff_cleanupMerge(e),this.diff_cleanupSemanticLossless(e),l=1;l<e.length;){if(e[l-1][0]==r&&e[l][0]==o){var p=e[l-1][1],f=e[l][1],_=this.diff_commonOverlap_(p,f),m=this.diff_commonOverlap_(f,p);_>=m?(_>=p.length/2||_>=f.length/2)&&(e.splice(l,0,[s,f.substring(0,_)]),e[l-1][1]=p.substring(0,p.length-_),e[l+1][1]=f.substring(_),l++):(m>=p.length/2||m>=f.length/2)&&(e.splice(l,0,[s,p.substring(0,m)]),e[l-1][0]=o,e[l-1][1]=f.substring(0,f.length-m),e[l+1][0]=r,e[l+1][1]=p.substring(m),l++),l++}l++}},i.prototype.diff_cleanupSemanticLossless=function(e){function t(e,t){if(!e||!t)return 6;var n=e.charAt(e.length-1),r=t.charAt(0),o=n.match(i.nonAlphaNumericRegex_),s=r.match(i.nonAlphaNumericRegex_),a=o&&n.match(i.whitespaceRegex_),l=s&&r.match(i.whitespaceRegex_),c=a&&n.match(i.linebreakRegex_),u=l&&r.match(i.linebreakRegex_),d=c&&e.match(i.blanklineEndRegex_),h=u&&t.match(i.blanklineStartRegex_);return d||h?5:c||u?4:o&&!a&&l?3:a||l?2:o||s?1:0}for(var n=1;n<e.length-1;){if(e[n-1][0]==s&&e[n+1][0]==s){var r=e[n-1][1],o=e[n][1],a=e[n+1][1],l=this.diff_commonSuffix(r,o);if(l){var c=o.substring(o.length-l);r=r.substring(0,r.length-l),o=c+o.substring(0,o.length-l),a=c+a}for(var u=r,d=o,h=a,p=t(r,o)+t(o,a);o.charAt(0)===a.charAt(0);){r+=o.charAt(0),o=o.substring(1)+a.charAt(0),a=a.substring(1);var f=t(r,o)+t(o,a);f>=p&&(p=f,u=r,d=o,h=a)}e[n-1][1]!=u&&(u?e[n-1][1]=u:(e.splice(n-1,1),n--),e[n][1]=d,h?e[n+1][1]=h:(e.splice(n+1,1),n--))}n++}},i.nonAlphaNumericRegex_=/[^a-zA-Z0-9]/,i.whitespaceRegex_=/\s/,i.linebreakRegex_=/[\r\n]/,i.blanklineEndRegex_=/\n\r?\n$/,i.blanklineStartRegex_=/^\r?\n\r?\n/,i.prototype.diff_cleanupEfficiency=function(e){for(var t=!1,n=[],i=0,a=null,l=0,c=!1,u=!1,d=!1,h=!1;l<e.length;)e[l][0]==s?(e[l][1].length<this.Diff_EditCost&&(d||h)?(n[i++]=l,c=d,u=h,a=e[l][1]):(i=0,a=null),d=h=!1):(e[l][0]==r?h=!0:d=!0,a&&(c&&u&&d&&h||a.length<this.Diff_EditCost/2&&c+u+d+h==3)&&(e.splice(n[i-1],0,[r,a]),e[n[i-1]+1][0]=o,i--,a=null,c&&u?(d=h=!0,i=0):(i--,l=i>0?n[i-1]:-1,d=h=!1),t=!0)),l++;t&&this.diff_cleanupMerge(e)},i.prototype.diff_cleanupMerge=function(e){e.push([s,""]);for(var t,n=0,i=0,a=0,l="",c="";n<e.length;)switch(e[n][0]){case o:a++,c+=e[n][1],n++;break;case r:i++,l+=e[n][1],n++;break;case s:i+a>1?(0!==i&&0!==a&&(t=this.diff_commonPrefix(c,l),0!==t&&(n-i-a>0&&e[n-i-a-1][0]==s?e[n-i-a-1][1]+=c.substring(0,t):(e.splice(0,0,[s,c.substring(0,t)]),n++),c=c.substring(t),l=l.substring(t)),t=this.diff_commonSuffix(c,l),0!==t&&(e[n][1]=c.substring(c.length-t)+e[n][1],c=c.substring(0,c.length-t),l=l.substring(0,l.length-t))),0===i?e.splice(n-a,i+a,[o,c]):0===a?e.splice(n-i,i+a,[r,l]):e.splice(n-i-a,i+a,[r,l],[o,c]),n=n-i-a+(i?1:0)+(a?1:0)+1):0!==n&&e[n-1][0]==s?(e[n-1][1]+=e[n][1],e.splice(n,1)):n++,a=0,i=0,l="",c=""}""===e[e.length-1][1]&&e.pop();var u=!1;for(n=1;n<e.length-1;)e[n-1][0]==s&&e[n+1][0]==s&&(e[n][1].substring(e[n][1].length-e[n-1][1].length)==e[n-1][1]?(e[n][1]=e[n-1][1]+e[n][1].substring(0,e[n][1].length-e[n-1][1].length),e[n+1][1]=e[n-1][1]+e[n+1][1],e.splice(n-1,1),u=!0):e[n][1].substring(0,e[n+1][1].length)==e[n+1][1]&&(e[n-1][1]+=e[n+1][1],e[n][1]=e[n][1].substring(e[n+1][1].length)+e[n+1][1],e.splice(n+1,1),u=!0)),n++;u&&this.diff_cleanupMerge(e)},i.prototype.diff_xIndex=function(e,t){var n,i=0,s=0,a=0,l=0;for(n=0;n<e.length&&(e[n][0]!==o&&(i+=e[n][1].length),e[n][0]!==r&&(s+=e[n][1].length),!(i>t));n++)a=i,l=s;return e.length!=n&&e[n][0]===r?l:l+(t-a)},i.prototype.diff_prettyHtml=function(e){for(var t=[],n=/&/g,i=/</g,a=/>/g,l=/\n/g,c=0;c<e.length;c++){var u=e[c][0],d=e[c][1],h=d.replace(n,"&amp;").replace(i,"&lt;").replace(a,"&gt;").replace(l,"&para;<br>");switch(u){case o:t[c]='<ins style="background:#e6ffe6;">'+h+"</ins>";break;case r:t[c]='<del style="background:#ffe6e6;">'+h+"</del>";break;case s:t[c]="<span>"+h+"</span>"}}return t.join("")},i.prototype.diff_prettyCompactHtml=function(e){for(var t=[],n=0;n<e.length;n++){var i=0===n,a=n===e.length-1,l=e[n][0],c=e[n][1];switch(l){case o:t[n]='<ins style="background:#e6ffe6;">'+this.prepare_text_(c)+"</ins>";break;case r:t[n]='<del style="background:#ffe6e6;">'+this.prepare_text_(c)+"</del>";break;case s:t[n]="<span>"+this.truncate_context_(c,i,a)+"</span>"}}return t.join("")},i.prototype.prepare_text_=function(e){var t=/&/g,n=/</g,i=/>/g,r=/\n/g;return e.replace(t,"&amp;").replace(n,"&lt;").replace(i,"&gt;").replace(r,"&para;<br>")},i.prototype.truncate_context_=function(e,t,n){var i=e.split(/\r\n|\r|\n/),r='<span class="dots">...</span>',o=i.length,s=4;return s>=o?this.prepare_text_(e):!t&&!n&&2*s>=o?this.prepare_text_(e):t?r+this.prepare_text_("\n"+i.slice(-s).join("\n")):n?this.prepare_text_(i.slice(0,s).join("\n")+"\n")+r:this.prepare_text_(i.slice(0,s).join("\n")+"\n")+r+this.prepare_text_("\n"+i.slice(-s).join("\n"))},i.prototype.diff_text1=function(e){for(var t=[],n=0;n<e.length;n++)e[n][0]!==o&&(t[n]=e[n][1]);return t.join("")},i.prototype.diff_text2=function(e){for(var t=[],n=0;n<e.length;n++)e[n][0]!==r&&(t[n]=e[n][1]);return t.join("")},i.prototype.diff_levenshtein=function(e){for(var t=0,n=0,i=0,a=0;a<e.length;a++){var l=e[a][0],c=e[a][1];switch(l){case o:n+=c.length;break;case r:i+=c.length;break;case s:t+=Math.max(n,i),n=0,i=0}}return t+=Math.max(n,i)},i.prototype.diff_toDelta=function(e){for(var t=[],n=0;n<e.length;n++)switch(e[n][0]){case o:t[n]="+"+encodeURI(e[n][1]);break;case r:t[n]="-"+e[n][1].length;break;case s:t[n]="="+e[n][1].length}return t.join("	").replace(/%20/g," ")},i.prototype.diff_fromDelta=function(e,t){for(var n=[],i=0,a=0,l=t.split(/\t/g),c=0;c<l.length;c++){var u=l[c].substring(1);switch(l[c].charAt(0)){case"+":try{n[i++]=[o,decodeURI(u)]}catch(d){throw new Error("Illegal escape in diff_fromDelta: "+u)}break;case"-":case"=":var h=parseInt(u,10);if(isNaN(h)||0>h)throw new Error("Invalid number in diff_fromDelta: "+u);var p=e.substring(a,a+=h);"="==l[c].charAt(0)?n[i++]=[s,p]:n[i++]=[r,p];break;default:if(l[c])throw new Error("Invalid diff operation in diff_fromDelta: "+l[c])}}if(a!=e.length)throw new Error("Delta length ("+a+") does not equal source text length ("+e.length+").");return n},i.prototype.match_main=function(e,t,n){if(null==e||null==t||null==n)throw new Error("Null input. (match_main)");return n=Math.max(0,Math.min(n,e.length)),e==t?0:e.length?e.substring(n,n+t.length)==t?n:this.match_bitap_(e,t,n):-1},i.prototype.match_bitap_=function(e,t,n){function i(e,i){var r=e/t.length,s=Math.abs(n-i);return o.Match_Distance?r+s/o.Match_Distance:s?1:r}if(t.length>this.Match_MaxBits)throw new Error("Pattern too long for this browser.");var r=this.match_alphabet_(t),o=this,s=this.Match_Threshold,a=e.indexOf(t,n);-1!=a&&(s=Math.min(i(0,a),s),a=e.lastIndexOf(t,n+t.length),-1!=a&&(s=Math.min(i(0,a),s)));var l=1<<t.length-1;a=-1;for(var c,u,d,h=t.length+e.length,p=0;p<t.length;p++){for(c=0,u=h;u>c;)i(p,n+u)<=s?c=u:h=u,u=Math.floor((h-c)/2+c);h=u;var f=Math.max(1,n-u+1),_=Math.min(n+u,e.length)+t.length,m=Array(_+2);m[_+1]=(1<<p)-1;for(var g=_;g>=f;g--){var y=r[e.charAt(g-1)];if(0===p?m[g]=(m[g+1]<<1|1)&y:m[g]=(m[g+1]<<1|1)&y|((d[g+1]|d[g])<<1|1)|d[g+1],m[g]&l){var v=i(p,g-1);if(s>=v){if(s=v,a=g-1,!(a>n))break;f=Math.max(1,2*n-a)}}}if(i(p+1,n)>s)break;d=m}return a},i.prototype.match_alphabet_=function(e){for(var t={},n=0;n<e.length;n++)t[e.charAt(n)]=0;for(var n=0;n<e.length;n++)t[e.charAt(n)]|=1<<e.length-n-1;return t},i.prototype.patch_addContext_=function(e,t){if(0!=t.length){for(var n=t.substring(e.start2,e.start2+e.length1),i=0;t.indexOf(n)!=t.lastIndexOf(n)&&n.length<this.Match_MaxBits-this.Patch_Margin-this.Patch_Margin;)i+=this.Patch_Margin,n=t.substring(e.start2-i,e.start2+e.length1+i);i+=this.Patch_Margin;var r=t.substring(e.start2-i,e.start2);r&&e.diffs.unshift([s,r]);var o=t.substring(e.start2+e.length1,e.start2+e.length1+i);o&&e.diffs.push([s,o]),e.start1-=r.length,e.start2-=r.length,e.length1+=r.length+o.length,e.length2+=r.length+o.length}},i.prototype.patch_make=function(e,t,n){var a,l;if("string"==typeof e&&"string"==typeof t&&"undefined"==typeof n)a=e,l=this.diff_main(a,t,!0),l.length>2&&(this.diff_cleanupSemantic(l),this.diff_cleanupEfficiency(l));else if(e&&"object"==typeof e&&"undefined"==typeof t&&"undefined"==typeof n)l=e,a=this.diff_text1(l);else if("string"==typeof e&&t&&"object"==typeof t&&"undefined"==typeof n)a=e,l=t;else{if("string"!=typeof e||"string"!=typeof t||!n||"object"!=typeof n)throw new Error("Unknown call format to patch_make.");a=e,l=n}if(0===l.length)return[];for(var c=[],u=new i.patch_obj,d=0,h=0,p=0,f=a,_=a,m=0;m<l.length;m++){var g=l[m][0],y=l[m][1];switch(d||g===s||(u.start1=h,u.start2=p),g){case o:u.diffs[d++]=l[m],u.length2+=y.length,_=_.substring(0,p)+y+_.substring(p);break;case r:u.length1+=y.length,u.diffs[d++]=l[m],_=_.substring(0,p)+_.substring(p+y.length);break;case s:y.length<=2*this.Patch_Margin&&d&&l.length!=m+1?(u.diffs[d++]=l[m],u.length1+=y.length,u.length2+=y.length):y.length>=2*this.Patch_Margin&&d&&(this.patch_addContext_(u,f),c.push(u),u=new i.patch_obj,d=0,f=_,h=p)}g!==o&&(h+=y.length),g!==r&&(p+=y.length)}return d&&(this.patch_addContext_(u,f),c.push(u)),c},i.prototype.patch_deepCopy=function(e){for(var t=[],n=0;n<e.length;n++){var r=e[n],o=new i.patch_obj;o.diffs=[];for(var s=0;s<r.diffs.length;s++)o.diffs[s]=r.diffs[s].slice();o.start1=r.start1,o.start2=r.start2,o.length1=r.length1,o.length2=r.length2,t[n]=o}return t},i.prototype.patch_apply=function(e,t){if(0==e.length)return[t,[]];e=this.patch_deepCopy(e);var n=this.patch_addPadding(e);t=n+t+n,this.patch_splitMax(e);for(var i=0,a=[],l=0;l<e.length;l++){var c,u=e[l].start2+i,d=this.diff_text1(e[l].diffs),h=-1;if(d.length>this.Match_MaxBits?(c=this.match_main(t,d.substring(0,this.Match_MaxBits),u),-1!=c&&(h=this.match_main(t,d.substring(d.length-this.Match_MaxBits),u+d.length-this.Match_MaxBits),(-1==h||c>=h)&&(c=-1))):c=this.match_main(t,d,u),-1==c)a[l]=!1,i-=e[l].length2-e[l].length1;else{a[l]=!0,i=c-u;var p;if(p=-1==h?t.substring(c,c+d.length):t.substring(c,h+this.Match_MaxBits),d==p)t=t.substring(0,c)+this.diff_text2(e[l].diffs)+t.substring(c+d.length);else{var f=this.diff_main(d,p,!1);if(d.length>this.Match_MaxBits&&this.diff_levenshtein(f)/d.length>this.Patch_DeleteThreshold)a[l]=!1;else{this.diff_cleanupSemanticLossless(f);for(var _,m=0,g=0;g<e[l].diffs.length;g++){var y=e[l].diffs[g];y[0]!==s&&(_=this.diff_xIndex(f,m)),y[0]===o?t=t.substring(0,c+_)+y[1]+t.substring(c+_):y[0]===r&&(t=t.substring(0,c+_)+t.substring(c+this.diff_xIndex(f,m+y[1].length))),y[0]!==r&&(m+=y[1].length)}}}}}return t=t.substring(n.length,t.length-n.length),[t,a]},i.prototype.patch_addPadding=function(e){for(var t=this.Patch_Margin,n="",i=1;t>=i;i++)n+=String.fromCharCode(i);for(var i=0;i<e.length;i++)e[i].start1+=t,e[i].start2+=t;var r=e[0],o=r.diffs;if(0==o.length||o[0][0]!=s)o.unshift([s,n]),r.start1-=t,r.start2-=t,r.length1+=t,r.length2+=t;else if(t>o[0][1].length){var a=t-o[0][1].length;o[0][1]=n.substring(o[0][1].length)+o[0][1],r.start1-=a,r.start2-=a,r.length1+=a,r.length2+=a}if(r=e[e.length-1],o=r.diffs,0==o.length||o[o.length-1][0]!=s)o.push([s,n]),r.length1+=t,r.length2+=t;else if(t>o[o.length-1][1].length){var a=t-o[o.length-1][1].length;o[o.length-1][1]+=n.substring(0,a),r.length1+=a,r.length2+=a}return n},i.prototype.patch_splitMax=function(e){for(var t=this.Match_MaxBits,n=0;n<e.length;n++)if(!(e[n].length1<=t)){var a=e[n];e.splice(n--,1);for(var l=a.start1,c=a.start2,u="";0!==a.diffs.length;){var d=new i.patch_obj,h=!0;for(d.start1=l-u.length,d.start2=c-u.length,""!==u&&(d.length1=d.length2=u.length,d.diffs.push([s,u]));0!==a.diffs.length&&d.length1<t-this.Patch_Margin;){var p=a.diffs[0][0],f=a.diffs[0][1];p===o?(d.length2+=f.length,c+=f.length,d.diffs.push(a.diffs.shift()),h=!1):p===r&&1==d.diffs.length&&d.diffs[0][0]==s&&f.length>2*t?(d.length1+=f.length,l+=f.length,h=!1,d.diffs.push([p,f]),a.diffs.shift()):(f=f.substring(0,t-d.length1-this.Patch_Margin),d.length1+=f.length,l+=f.length,p===s?(d.length2+=f.length,c+=f.length):h=!1,d.diffs.push([p,f]),f==a.diffs[0][1]?a.diffs.shift():a.diffs[0][1]=a.diffs[0][1].substring(f.length))}u=this.diff_text2(d.diffs),u=u.substring(u.length-this.Patch_Margin);var _=this.diff_text1(a.diffs).substring(0,this.Patch_Margin);""!==_&&(d.length1+=_.length,d.length2+=_.length,0!==d.diffs.length&&d.diffs[d.diffs.length-1][0]===s?d.diffs[d.diffs.length-1][1]+=_:d.diffs.push([s,_])),h||e.splice(++n,0,d)}}},i.prototype.patch_toText=function(e){for(var t=[],n=0;n<e.length;n++)t[n]=e[n];return t.join("")},i.prototype.patch_fromText=function(e){var t=[];if(!e)return t;for(var n=e.split("\n"),a=0,l=/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;a<n.length;){var c=n[a].match(l);if(!c)throw new Error("Invalid patch string: "+n[a]);var u=new i.patch_obj;for(t.push(u),u.start1=parseInt(c[1],10),""===c[2]?(u.start1--,u.length1=1):"0"==c[2]?u.length1=0:(u.start1--,u.length1=parseInt(c[2],10)),u.start2=parseInt(c[3],10),""===c[4]?(u.start2--,u.length2=1):"0"==c[4]?u.length2=0:(u.start2--,u.length2=parseInt(c[4],10)),a++;a<n.length;){var d=n[a].charAt(0);try{var h=decodeURI(n[a].substring(1))}catch(p){throw new Error("Illegal escape in patch_fromText: "+h)}if("-"==d)u.diffs.push([r,h]);else if("+"==d)u.diffs.push([o,h]);else if(" "==d)u.diffs.push([s,h]);else{if("@"==d)break;if(""!==d)throw new Error('Invalid patch mode "'+d+'" in: '+h)}a++}}return t},i.patch_obj=function(){this.diffs=[],this.start1=null,this.start2=null,this.length1=0,this.length2=0},i.patch_obj.prototype.toString=function(){var e,t;e=0===this.length1?this.start1+",0":1==this.length1?this.start1+1:this.start1+1+","+this.length1,t=0===this.length2?this.start2+",0":1==this.length2?this.start2+1:this.start2+1+","+this.length2;for(var n,i=["@@ -"+e+" +"+t+" @@\n"],a=0;a<this.diffs.length;a++){switch(this.diffs[a][0]){case o:n="+";break;case r:n="-";break;case s:n=" "}i[a+1]=n+encodeURI(this.diffs[a][1])+"\n"}return i.join("").replace(/%20/g," ")},t.exports=i},{}],3:[function(e,t,n){var i=new(e("../../diffMatchPatch"));t.exports={tests:function(e,t){var n=this,i="";return _.isString(e)?i+=t?n._error(e):n._escapeAndConvertToHtml(e):(_.each(e.errors,function(e){i+=n._error(e.message,e.stack,e.expected,e.actual)}),_.each(e.tests,function(e){i+=n._test(e)})),i},_error:function(e,t,n,i){var r=this,o="";return(n||i)&&(o=r._diff(n,i)+"<br/>"),'<section class="error">'+o+'<section class="header">'+r._escapeAndConvertToHtml(e)+"</section>"+_.reduce(t,function(e,t){return e+=r._line(t)},"")+"</section>"},_line:function(e){var t=this._escape(e.file),n=e.context&&this._escape(e.context)||"";return t?'<section class="line">at '+(n?n+" ":"")+'<a class="loc" data-file="'+t+'" data-loc="'+e.loc+'">'+t+":"+e.loc+"</a></section>":""},_test:function(e){var t=this,n=e.path&&_.last(e.path)||"",i=_.initial(e.path||[]).join(" ");n=n&&" "+t._escape(n),i=i&&" "+t._escape(i);var r=_.isNumber(e.time)?" "+e.time+" ms":"",o=t._escape(e.file);return'<section class="test'+(e.failing?" failing":"")+'"><section class="header"><a class="'+(e.loc?"loc":"text")+'" data-file="'+o+'" data-loc="'+e.loc+'">'+e.file+'</a><span class="suite">'+i+'</span><span class="name">'+n+"</span>"+(r?'<span class="time">'+r+"</span>":"")+"</section>"+_.reduce(e.errors,function(e,n){return e+=t._error(n.message,n.stack,n.expected,n.actual)},"")+(e.messages&&e.messages.length?_.reduce(e.messages,function(e,n){return e+='<section class="message '+n.type+'"><span class="text">'+t._escapeAndConvertToHtml(n.text)+"&nbsp;</span>"+t._line(n)+"</section>"},'<section class="console"><section class="header">From console:</section>')+"</section>":"")+"</section>"},_diff:function(e,t){try{return'<section class="diff" style="white-space: pre;">'+i[i.diff_prettyCompactHtml?"diff_prettyCompactHtml":"diff_prettyHtml"](i.diff_wordMode(e||"",t||"")).replace(/&para;<br>/g,"<br>").replace(/style="background:#e6ffe6;"/g,'class="status-added"').replace(/style="background:#ffe6e6;"/g,'class="status-removed"')+"</section>"}catch(n){return""}},_escape:function(e){return(e||"").toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")},_escapeAndConvertToHtml:function(e){return this._escape(e).replace(/(?:\r\n|\r|\n)/g,"<br/>").replace(/\t/g,"&nbsp;&nbsp;&nbsp;&nbsp;").replace(/\s/g,"&nbsp;")}}},{"../../diffMatchPatch":2}],4:[function(e,t,n){t.exports={lineState:{notCovered:1,fullyCovered:2,partiallyCovered:3,errorSource:4,errorPath:5}}},{}],5:[function(e,t,n){var i=function(e){return e&&e.replace(/^\s+|\s+$/gm,"")},r=["January","February","March","April","May","June","July","August","September","October","November","December"];t.exports={normalizePath:function(e){return"win32"===process.platform&&e?e.replace(/\\/g,"/"):e},parseKey:function(e){var t={};if(e){var n=e.split(":");2===n.length&&(e=i(n[1]))}var o=new Buffer(e,"base64").toString().split("\n");t.licenseeName=o[0],t.licenseTags=o[1];var s=t.licenseTags.split(",");s.length>=1&&(t.licenseeEmail=s[0]),s.length>=2&&(t.licensedProduct=s[1]),t.expirationDateString=o[2],t.licenseSignature=o[3];try{var a=t.expirationDateString.split("/");t.expirationDateStringFormatted=a[0]+" "+r[parseInt(a[1],10)-1]+" "+a[2]}catch(l){t.expirationDateStringFormatted=t.expirationDateString}return t},format:function(e,t){return e.replace(/\{([0-9a-zA-Z_]+)\}/g,function(n,i,r){var o;return"{"===e[r-1]&&"}"===e[r+n.length]?i:(o=t.hasOwnProperty(i)?t[i]:null,null===o||void 0===o?"":o)})},validPackageName:function(e){if(e&&!e.match(/^\./)&&!e.match(/^_/)&&!(e.length>214||e.toLowerCase()!==e||/[~'!()*]/.test(e.split("/").slice(-1)[0]))){if(encodeURIComponent(e)===e)return e;var t=e.match(/^(?:@([^\/]+?)[\/])?([^\/]+?)$/);if(t){var n=t[1],i=t[2];if(encodeURIComponent(n)===n&&encodeURIComponent(i)===i)return e}}}}},{}],6:[function(e,t,n){if(global._=e("lodash"),global.Q=e("q"),global.EventEmitter=e("events").EventEmitter,Q.longStackSupport=!1,global.Promise||(global.Promise=Q.Promise),_.extend(_,e("./utils")),_.str=e("underscore.string"),_.mixin(_.str.exports()),!global.wallabyCoreClient){var i=e("module").Module.prototype,r=i._compile,o="wq_sen",s="r.js",a=o+"de"+s;i._compile=function(){return _.endsWith(arguments[1],a)&&(arguments[0]=new Buffer(arguments[0].substr(arguments[0].lastIndexOf("//# sourceMappingURL=data:application/json;base64,")+50),"base64").toString()),r.apply(this,arguments)}}},{"./utils":7,events:void 0,lodash:void 0,module:void 0,q:void 0,"underscore.string":void 0}],7:[function(e,t,n){var i=e("path"),r=/^\s*(\/\*\*?(.|\r?\n)*?\*\/)/,o=/^\s*/,s=/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;t.exports={randomId:function(){return Math.random().toString(36).substr(2,5)},noopTrue:function(){return!0},noopTruePromise:function(){return Q.fcall(this.noopTrue)},isPatch:function(e){return e&&e.length>2&&"@"===e[0]&&"@"===e[1]},docBlockComment:function(e){var t=e.match(r);return t?t[0].replace(o,"")||"":""},textIndexPosition:function(e,t){var n=this.textLines(e,t);return{line:n.length,column:n[n.length-1].length}},textLines:function(e,t){return e=_.isUndefined(t)?e:e.substr(0,t),e.split(/\r\n|\r|\n/)},verifyLocalOrigin:function(t,n){if(!t)return!0;var i=!1;try{var r=e("url").parse(t).hostname;i="localhost"===r||"0.0.0.0"===r||"127.0.0.1"===r||"::1"===r}catch(o){}return i||n||console.error("wallaby.js refused to accept connection from "+t),i},patchModule:function(t,n){var i=e("module").Module.prototype,r=i.require;i.require=function(e){return e===t?n(r.bind(this)):r.call(this,e);
}},requireModuleFrom:function(t,n){try{return e(i.join(t,"node_modules",n))}catch(r){var o=e("module"),s=new o(".",null);return s.filename=i.join(t,"wallaby.js"),s.paths=o._nodeModulePaths(t),o._load(n,s,!1)}},resolveModulePathFrom:function(t,n){var r=e("module"),o=new r(".",null);return o.filename=i.join(t,"wallaby.js"),o.paths=r._nodeModulePaths(t),r._resolveFilename(n,o,!1)},nodeModulePaths:function(t){var n=e("module");return n._nodeModulePaths(t)},patchBabelResolve:function(e){var t=this.nodeModulePaths(e);this.patchModule("resolve",function(e){var n=e("resolve"),i=n.sync;return n.sync=function(e,n){return~e.indexOf("babel")&&n&&(arguments[1].paths=(n.paths||[]).concat(t)),i.apply(this,arguments)},n})},hasAnsi:function(e){return e&&"string"==typeof e&&e.match(s)},removeAnsi:function(e){return e&&"string"==typeof e?e.replace(s,""):e}}},{module:void 0,path:void 0,url:void 0}]},{},[1]);