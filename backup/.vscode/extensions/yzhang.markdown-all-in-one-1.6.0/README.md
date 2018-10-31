# Markdown Support for Visual Studio Code

[![version](https://img.shields.io/vscode-marketplace/v/yzhang.markdown-all-in-one.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)  
[![installs](https://img.shields.io/vscode-marketplace/d/yzhang.markdown-all-in-one.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)  
[![AppVeyor](https://img.shields.io/appveyor/ci/neilsustc/vscode-markdown.svg?style=flat-square&label=appveyor%20build)](https://ci.appveyor.com/project/neilsustc/vscode-markdown)  
[![GitHub stars](https://img.shields.io/github/stars/neilsustc/vscode-markdown.svg?style=flat-square&label=github%20stars)](https://github.com/neilsustc/vscode-markdown)

All you need for Markdown (keyboard shortcuts, table of contents, auto preview and more).

## Features

- **Keyboard shortcuts** (toggle bold, italic, code span, strikethrough and heading)
  - Tip: `**word|**` -> `**word**|` (<kbd>Ctrl</kbd> + <kbd>B</kbd>)
  - If there is no text selected, *the word under cursor* will be styled (or *the entire list item* if you are toggling strikethrough)
- **Table of contents** (No additional annoying tags like `<!-- TOC -->`)
  - The indentation rules (tab or spaces) of TOC will be the same of your current file (find it in the right bottom corner)
  - To make TOC compatible with GitHub, you need to set option `githubCompatibility` to `true`
  - Use `<!-- omit in toc -->` to ignore specific heading in TOC
- **Outline view** in explorer panel
- **Automatically show preview** when opening a Markdown file (Disabled by default)
- **Print Markdown to HTML**
  - It's recommended to print the exported HTML to PDF with browser (e.g. Chrome) if you want to share your documents with others
- **List editing** (continue list when pressing <kbd>Enter</kbd> at the end of a list item) (also works for quote block)
  - Pressing <kbd>Tab</kbd> at the beginning of a list item will indent it
  - Pressing <kbd>Backspace</kbd> at the beginning of a list item will unindent it (or delete the list marker)
  - Blank list item will be remove on <kbd>Enter</kbd>
  - Ordered list markers will be automatically fixed after you indent/outdent a line or move a line up/down
- **GitHub Flavored Markdown**
  - Table formatter (<kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd>)
  - Task list (use <kbd>Alt</kbd> + <kbd>C</kbd> to check/uncheck a list item)
- **Math rendering** (see screenshot below)
- **Auto completions**
  - Images paths (and previews)
  - Math commands
- **Others**
  - Override "Open Preview" keybinding with "Toggle Preview", which means you can close preview using the same keybinding (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> or <kbd>Ctrl</kbd> + <kbd>K</kbd> <kbd>V</kbd>).

### Keyboard Shortcuts

<!-- ![shortcuts1](https://github.com/neilsustc/vscode-markdown/raw/master/images/gifs/bold-normal.gif) -->

![shortcuts2](https://github.com/neilsustc/vscode-markdown/raw/master/images/gifs/bold-quick.gif)

![shortcuts3](https://github.com/neilsustc/vscode-markdown/raw/master/images/gifs/heading.gif)

### Table of Contents

![toc](https://github.com/neilsustc/vscode-markdown/raw/master/images/gifs/toc.gif)

### List Editing

![list editing](https://github.com/neilsustc/vscode-markdown/raw/master/images/gifs/list-editing.gif)

### Table Formatter

![table formatter](https://github.com/neilsustc/vscode-markdown/raw/master/images/gifs/table-formatter.gif)

### Outline

![outline](https://github.com/neilsustc/vscode-markdown/raw/master/images/outline.png)

### Task Lists

![task lists](https://github.com/neilsustc/vscode-markdown/raw/master/images/gifs/tasklists.gif)

### Math Rendering

![math rendering](https://github.com/neilsustc/vscode-markdown/raw/master/images/math.png)

## Shortcuts

| Key                                               | Command                      |
| ------------------------------------------------- | ---------------------------- |
| <kbd>Ctrl</kbd> + <kbd>B</kbd>                    | Toggle bold                  |
| <kbd>Ctrl</kbd> + <kbd>I</kbd>                    | Toggle italic                |
| <kbd>Alt</kbd> + <kbd>S</kbd>                     | Toggle strikethrough         |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>]</kbd> | Toggle heading (uplevel)     |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>[</kbd> | Toggle heading (downlevel)   |
| <kbd>Ctrl</kbd> + <kbd>M</kbd>                    | Toggle math environment      |
| <kbd>Alt</kbd> + <kbd>C</kbd>                     | Check/Uncheck task list item |

## Available Commands

- Markdown: Create Table of Contents
- Markdown: Update Table of Contents
- Markdown: Toggle code span
- Markdown: Print current document to HTML

## Supported Settings

| Name                                               | Default   | Description                                                       |
| -------------------------------------------------- | --------- | ----------------------------------------------------------------- |
| `markdown.extension.toc.levels`                    | `1..6`    | Control the heading levels to show in the table of contents.      |
| `markdown.extension.toc.unorderedList.marker`      | `-`       | Use `-`, `*` or `+` in the table of contents (for unordered list) |
| `markdown.extension.toc.orderedList`               | `false`   | Use ordered list in the table of contents.                        |
| `markdown.extension.toc.plaintext`                 | `false`   | Just plain text.                                                  |
| `markdown.extension.toc.updateOnSave`              | `true`    | Automatically update the table of contents on save.               |
| `markdown.extension.toc.githubCompatibility`       | `false`   | GitHub compatibility                                              |
| `markdown.extension.preview.autoShowPreviewToSide` | `false`   | Automatically show preview when opening a Markdown file.          |
| `markdown.extension.orderedList.marker`            | `ordered` | Or `one`: always use `1.` as ordered list marker                  |
| `markdown.extension.orderedList.autoRenumber`      | `true`    | Auto fix list markers as you edits                                |
| `markdown.extension.italic.indicator`              | `*`       | Use `*` or `_` to wrap italic text                                |
| `markdown.extension.showExplorer`                  | `true`    | Show outline view in explorer panel                               |
| `markdown.extension.print.absoluteImgPath`         | `true`    | Convert image path to absolute path                               |
| `markdown.extension.print.imgToBase64`             | `false`   | Convert images to base64 when printing to HTML                    |
| `markdown.extension.syntax.decorations`            | `true`    | Add decorations to strikethrough and code spans                   |
| `markdown.extension.syntax.plainTheme`             | `false`   | A distraction-free theme                                          |

## Changelog

See [CHANGELOG](https://github.com/neilsustc/vscode-markdown/blob/master/CHANGELOG.md) for more information.

## Latest CI Build

Download it [here](https://ci.appveyor.com/project/neilsustc/vscode-markdown/build/artifacts).

## Contributing

Bugs, feature requests and more, in [GitHub Issues](https://github.com/neilsustc/vscode-markdown/issues).

Or leave a review on [vscode marketplace](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one#review-details) 😉.
