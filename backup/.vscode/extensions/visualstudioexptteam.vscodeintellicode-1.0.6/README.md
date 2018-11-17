# Visual Studio IntelliCode

The [Visual Studio IntelliCode](https://go.microsoft.com/fwlink/?linkid=872679) extension provides AI-assisted productivity features for Python and Java developers in Visual Studio Code, with insights based on understanding your code combined with machine learning.

To use the Python language features, this extension requires that the [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python) is installed, and that you are using a version of Visual Studio Code released after July 2018.

## About IntelliCode

This extension provides AI-assisted IntelliSense by showing recommended completion items for your code context at the top of the completions list. The example below shows this in action for Python code.

![Python AI-enhanced IntelliSense](https://go.microsoft.com/fwlink/?linkid=2006041)

When it comes to overloads, rather than taking the time to cycle through the alphabetical list of member, IntelliCode presents the most relevant one first. In the example shown above, you can see that the predicted APIs that **IntelliCode** elevates appear in a new section of the list at the top with members prefixed by a small star icon.  Similarly, a member’s signature or overloads shown in the IntelliSense tool-tip will have additional text marked by a small star icon and wording to explain the recommended status. This visual experience for members in the list and the tool-tip that **IntelliCode** provides is not intended as final – it is intended to provide you with a visual differentiation for feedback purposes only.

Contextual recommendations are based on practices developed in thousands of high quality, open-source projects on GitHub each with high star ratings. This means you get context-aware code completions, tool-tips, and signature help rather than alphabetical or most-recently-used lists. By predicting the most likely member in the list based on your coding context, AI-assisted IntelliSense stops you having to hunt through the list yourself.

## Getting Started

Install the Visual Studio IntelliCode extension by clicking the install link on this page, or install from the Extensions tab in Visual Studio Code. Then follow the language-specific instructions below.

### For Python users:

1. Set up the Python extension by following the steps in the [Python tutorial](https://code.visualstudio.com/docs/python/python-tutorial#_prerequisites)

2. Start editing Python files, you should get a prompt to enable the Microsoft Python Language Server

3. Reload Visual Studio Code after enabling the language server

4. After the language server finishes initializing, you should now see recommended completions

### For Java users:

1. Set up the Java extension for Visual Studio Code by following the steps in the [Java Tutorial](https://code.visualstudio.com/docs/java/java-tutorial)

2. Make sure that you have a minimum of Java 8 Update 151 installed

3. Reload Visual Studio Code after enabling the Java extension

4. After the Java language server finishes initializing, you should now see recommended completions

## More about IntelliCode

IntelliCode is a [Technology Preview released under Microsoft DevLabs](http://aka.ms/devlabs). This VS Code extension can be used with Python and Java code today, but will be updated in the future to support more languages. The extension gives you an early taste of what’s to come with IntelliCode and allows you to provide feedback to team to help shape its future. There is much more to come – [sign up here](https://go.microsoft.com/fwlink/?linkid=872706) for future news and updates!

For C# in the Visual Studio IDE, check out the [IntelliCode extension on the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.VSIntelliCode) instead.

How do I report feedback and issues?

You can [file an issue](https://go.microsoft.com/fwlink/?linkid=2005855) on our IntelliCode for VS Code extension GitHub feedback repo.

You can also check out our [FAQ](https://aka.ms/vsicpythonfaq)