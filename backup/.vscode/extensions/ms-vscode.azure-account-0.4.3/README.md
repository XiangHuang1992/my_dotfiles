# Azure Account and Sign-In
The Azure Account extension provides a single Azure sign-in and subscription filtering experience for all other Azure extensions. It makes Azure's Cloud Shell service available in VS Code's integrated terminal.

## Commands


| Command |  |
| --- |---|
| `Azure: Sign In`  | Sign in to your Azure subscription.
| `Azure: Sign Out` | Sign out of your Azure subscription.
| `Azure: Select Subscriptions` | Pick the set of subscriptions you want to work with. Extensions should respect this list and only show resources within the filtered subscriptions.
| `Azure: Create an Account`  | If you don't have an Azure Account, you can [sign up](https://azure.microsoft.com/en-us/free/?utm_source=campaign&utm_campaign=vscode-azure-account&mktingSource=vscode-azure-account) for one today and receive $200 in free credits.
| `Azure: Open Bash in Cloud Shell`<sup>1</sup> | Open a new terminal running Bash in Cloud Shell.
| `Azure: Open PowerShell in Cloud Shell`<sup>1</sup> | Open a new terminal running PowerShell in Cloud Shell.
| `Azure: Upload to Cloud Shell`<sup>1</sup> | Upload a file to your Cloud Shell storage account
<sup>1</sup> On Windows: Requires Node.js 6 or later to be installed (https://nodejs.org).

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](https://github.com/microsoft/vscode-azure-account/blob/master/mailto:opencode@microsoft.com) with any additional questions or comments.

## License
[MIT](https://github.com/microsoft/vscode-azure-account/blob/master/LICENSE.md)