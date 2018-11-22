# Django Templates for Visual Studio Code

This extension adds language colorization support and user snippets for the Django template language to VS Code.

This is based on the [Jinja extension](https://marketplace.visualstudio.com/items?itemName=wholroyd.jinja) by the awesome [wholroyd](https://github.com/wholroyd/vscode-jinja/).

![IDE](https://raw.githubusercontent.com/iambibhas/vscode-django-template/master/example.png)

## Using

In the command palette (`ctrl-shift-p`) select `Install Extension` and choose `Django Template`.

## Contributing

If you are interested in making this extension better, I will gladly take pull requests that expand it to add intellisense, hovers and validators. If you're not familiar with working on Visual Studio Code extensions, check out the VS Code extenders documentation at
https://code.visualstudio.com/docs.

To get started on the extension...

1. Go to the Debug viewlet and select `Launch Extension` then hit run (`F5`). This will launch a second instance of Code with the extension from the first window loaded.

2. As you make changes, you can also reload (`Ctrl+R` or `Cmd+R` on Mac) the second Code window to load any changes.

If you have a previous release of the extension installed and you perform these steps, Code will temporarily override the locally installed version instead for the one you're working on for the second window. The first (main) window will remain to have the locally installed, prior version installed and enabled until an update is available.

## License
[MIT](https://github.com/iambibhas/vscode-django-template/blob/master/LICENSE)
