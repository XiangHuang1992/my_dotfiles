# Visual Studio Code Tools for AI
Visual Studio Code Tools for AI is an extension to build, test, and deploy Deep Learning / AI solutions. It seamlessly integrates with Azure Machine Learning for robust experimentation capabilities, including but not limited to submitting data preparation and model training jobs transparently to different compute targets. Additionally, it provides support for custom metrics and run history tracking, enabling data science reproducibility and auditing. Enterprise ready collaboration, allow to securely work on project with other people.

Get started with deep learning using [Microsoft Cognitive Toolkit (CNTK)](http://www.microsoft.com/en-us/cognitive-toolkit), [Google TensorFlow](https://www.tensorflow.org), [PyTorch](https://pytorch.org/), or other deep-learning frameworks today.  

## Quick Links

**Getting Started**

- [Release notes](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/releasenotes.md)
- [Installation](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/installation.md)
- [Start Page](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/startPage.md)
- [Prepare development environment](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/prepare-localmachine.md)
- [Deep learning sample recipes](https://github.com/Microsoft/samples-for-ai)
- [View deep learning document in VS Code](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/docviewer.md)
- [Frequently Asked Questions](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/faq.md)
- [Feedback](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/feedback.md)

**Quickstarts**

- [TensorFlow + Python](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/tensorflow-local.md)
- [Create AI project from samples gallery](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-00-project-from-azuremachinelearning-gallery.md)
- [Train models in the cloud](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-01-submitting-training-jobs.md)
- [Manage job history](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-02-job-view.md)
- [Manage storage](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-03-storage-explorer.md)
- [Train models in PAI](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-05-pai.md) 
- [Open Jupyter notebooks in VS Code](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-06-jupyter.md)
- [Run TensorBoard locally in VS Code](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-07-tensorboard.md)

## Supported Operating Systems
Currently this extension supports the following 64-bit operating systems:
- Windows
- macOS

## Features

### Develop deep learning and AI solutions across Windows and MacOS
VS Code Tools for AI is a cross-platform extension that supports deep learning frameworks including [Microsoft Cognitive Toolkit (CNTK)](http://www.microsoft.com/en-us/cognitive-toolkit), [Google TensorFlow](https://www.tensorflow.org), [PyTorch](https://pytorch.org/), and more.  

Because it's an IDE we've enabled familiar code editor features like syntax highlighting, IntelliSense (auto-completion) and text auto formatting. You can interactively test your deep learning application in your local environment using step-through debugging on local variables and models. 

![deep learning ide](https://raw.githubusercontent.com/Microsoft/vscode-tools-for-ai/master/docs/media/deeplearning-ide.png)

### Get started quickly with the Start Page  
Tools for AI Start Page is built to accelerate your start in AI world with 
- Easy instructions to guide you to build your first AI application within 3 steps;
- AI inferencing/training samples and AI related learning materials for you to quickly learn and build your own AI solutions. 

![sample explorer](https://raw.githubusercontent.com/Microsoft/vscode-tools-for-ai/master/docs/media/homepage/startPage.PNG)

[Learn more about Start Page](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/startPage.md)  

### View deep learning document in VS Code
VS Code Tools for AI is shipped with document for some common deep learning frameworks. You can manage and browse the document in VS Code and search for API reference in editor window through simple command.

![doc viewer](https://raw.githubusercontent.com/Microsoft/vscode-tools-for-ai/master/docs/media/docviewer/docviewer.png)


### Find and share examples via the gallery  
Visual Studio Code Tools for AI is integrated with Azure Machine Learning to make it easy to browse through a gallery of sample experiments using CNTK, TensorFlow, MMLSpark and more. This makes it easy to learn and share with others. 

[Learn more about creating projects from the sample gallery](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-00-project-from-azuremachinelearning-gallery.md)

![AML sample explorer](https://raw.githubusercontent.com/Microsoft/vscode-tools-for-ai/master/docs/media/aml-samples/sampleexplorer.png)

### Scale out deep learning model training and/or inferencing to the cloud
This extension makes it easy to train models on your local computer or you can submit jobs to the cloud by using our integration with Azure Machine Learning. You can submit jobs to different compute targets like Spark clusters, Azure GPU virtual machines and more. Besides, [Open Platform for AI (PAI)](https://github.com/Microsoft/pai) is also supported.

[Learn more about training models in the cloud](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-01-submitting-training-jobs.md)
 
![submit job](https://raw.githubusercontent.com/Microsoft/vscode-tools-for-ai/master/docs/media/job/submit-target.png)

### View recent job performance and details
Once the jobs are submitted, you can list the jobs, check the job details and download models, logs, etc. from the run history.

[Learn more about job history](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-02-job-view.md)

![Job View](https://raw.githubusercontent.com/Microsoft/vscode-tools-for-ai/master/docs/media/job/job-view.png)

### Manage storage on compute targets
The extension provides a storage explorer which enables you to manage your files on remote machines, PAI clusters, etc. You can create/delete folders, upload/download files within the VS Code easily.

[Learn more about storage explorer](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-03-storage-explorer.md)

![Storage View](https://raw.githubusercontent.com/Microsoft/vscode-tools-for-ai/master/docs/media/storage/StorageExplorer.png)

### Jupyter notebook server manager
The extension implements a built-in Jupyter server notebook server manager, which enables you to open a Jupyter notebook inside VS Code for viewing and editing.

[Learn more about Jupyter notebook in VS Code](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-06-jupyter.md)

![Jupyter View](https://raw.githubusercontent.com/Microsoft/vscode-tools-for-ai/master/docs/media/jupyter/jupyter_webview.png)

### Run TensorBoard locally in VS Code

The extension enables you to run TensorBoard in VS Code and view the model graph in an external browser. You could shutdown the TensorBoard server anytime in the VS Code terminal.

[Learn more about TensorBoard](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-07-tensorboard.md)

![TensorBoard View](https://raw.githubusercontent.com/Microsoft/vscode-tools-for-ai/master/docs/media/tensorboard/tensorboard_browser.png)

## Commands
The extension provides several commands in the Command Palette for working with deep learning and machine learning:
- **AI: Azure - Login**:  Login to Azure to access resources used by Azure ML.
- **AI: Azure - Set Subscription**:  Set your Azure Subscription to use for Azure ML.
- **AI: Open Azure ML Sample Explorer**: Quickly get started with machine learning and deep learning experimentation by downloading sample projects you can run and modify to meet your needs.
- **AI: Azure ML - Open Terminal**: Open Azure ML CLI terminal to access full feature set.
- **AI: Add Platform Configuration**: Configure compute target (remote VM, PAI cluster) used for training job.
- **AI: Edit Platform Configuration**: Modify compute target settings.
- **AI: Remove Platform Configuration**: Remove a compute target configuration.
- **AI: Submit Job**: Submit a training job to remote Linux VMs, PAI clusters etc.
- **AI: Edit Job Properties**: Modify job settings.
- **AI: List Jobs**: View list of recent jobs you've submitted and their details.
- **AI: Open Storage Explorer**: View and manage storage on remote compute targets.
- **AI: Local - Run TensorBoard**: Run TensorBoard locally.

## Support
Support for this extension is provided on our [GitHub Issue Tracker](http://github.com/Microsoft/vscode-tools-for-ai/issues). You can submit a bug report, a feature suggestion or participate in discussions.

## Code of Conduct
This project has adopted the [Microsoft Open Source Code of Conduct]. For more information see the [Code of Conduct FAQ] or contact [opencode@microsoft.com] with any additional questions or comments.

## Privacy Statement
The [Microsoft Enterprise and Developer Privacy Statement] describes the privacy statement of this software.

## License
This extension is subject to the terms of the [End User License Agreement]. 

[Microsoft Enterprise and Developer Privacy Statement]:https://go.microsoft.com/fwlink/?LinkId=786907&lang=en7
[Microsoft Open Source Code of Conduct]:https://opensource.microsoft.com/codeofconduct/
[Code of Conduct FAQ]:https://opensource.microsoft.com/codeofconduct/faq/
[opencode@microsoft.com]:mailto:opencode@microsoft.com
[End User License Agreement]:https://www.visualstudio.com/license-terms/mlt552233/