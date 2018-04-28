'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
exports.officialExtPath = vscode_1.extensions.getExtension("vscode.markdown-language-features").extensionPath;
const tocModule = require(path.join(exports.officialExtPath, 'out', 'tableOfContentsProvider'));
exports.TocProvider = tocModule.TableOfContentsProvider;
function slugify(heading) {
    if (vscode_1.workspace.getConfiguration('markdown.extension.toc').get('githubCompatibility')) {
        // GitHub slugify function <https://github.com/jch/html-pipeline/blob/master/lib/html/pipeline/toc_filter.rb>
        let slug = heading.trim()
            .replace(/[A-Z]/g, match => match.toLowerCase()) // only downcase ASCII region
            .replace(/[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\{\|\}\~\`]/g, '') // `_` should be converted to `-` instead of being removed
            .replace(/\s+/g, '-')
            .replace(/^\-+/, '')
            .replace(/\-+$/, '');
        return slug;
    }
    else {
        // VSCode slugify function
        // <https://github.com/Microsoft/vscode/blob/b6417424521559acb9a5088111fb0ed70de7ccf2/extensions/markdown-language-features/src/tableOfContentsProvider.ts#L13>
        return tocModule.Slug.fromHeading(heading).value;
    }
}
exports.slugify = slugify;
//# sourceMappingURL=util.js.map