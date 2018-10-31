## Version 0.3.0
* Release date: Sept 24, 2018
* Release status: Public Preview

## What's new in this version
* Added support for [Azure Machine Learning Services Public Preview](https://azure.microsoft.com/en-us/services/machine-learning-services/). Use the new Azure activity bar in VS Code to leverage Azure Machine Learning to:
  * Manage Experiments and key metrics for your experiments
  * Create Compute resources in Azure to train your models and deploy your models using Azure Batch AI, Azure Kubernetes and/or Azure Container Instances
  * Register Models to keep track and version them over time
  * Deploy Models - Easily create docker images and deploy your models in a hosted service in Azure


## Version 0.2.0
* Release date: Aug 25, 2018
* Release status: Public Preview

## What's new in this version
* When first starting Tools for AI, an installation page is shown for guiding local AI development environment setup. Users can launch a one-click installer from this page to install required software packages into the default Python environment.
* We design a new start page to help users build first AI application / train first AI Model within 3 steps. The start page also contains useful AI examples and development resources.
* View local Jupyter notebooks.
* Built-in documentation search for TensorFlow / Keras / PyTorch APIs. Right-click the function name, and select “Search in Documentation Viewer” context menu.
* Docker image list is updated for job submission to remote machines. And a new all-in-one docker image  including all popular AI / DL frameworks is provided.
* A more proactive feedback channel is built - will prompt user to give feedback when some conditions met.
* Azure Batch AI support is temporarily removed, will get the support of Batch AI back soon.
* Telemetry and stability improvement.

## Version 0.1.9
* Release date: Jun 8, 2018
* Release status: Public Preview

## What's new in this version
* Hot fix: Unable to load configurations in VS Code 1.24.0

## Version 0.1.8
* Release date: May 4, 2018
* Release status: Public Preview

## What's new in this version
* Improve job management experience.
* Preview job assets such as stderr, stdout, or model files in standard VS Code editor windows.
* After a job asset is downloaded, kindly notify users to open it in VS Code or reveal in OS file explorer.
* For a remote machine job, list its assets in job detail page, and add an "Open Storage Explorer" button to visit the job directory.
* Print detailed operation logs in the output window.
* Storage Explorer uses VS Code built-in icons for files and folders.
* Use notification dialog to improve configuration (in JSON) editing experience.
* Experimental support for Open Platform for AI (PAI).
    * Submit training projects to PAI clusters.
    * Manage jobs and files with GUI tools.
* Bug fixes and stability improvements.

## Version 0.1.7
* Release date: Feb 9, 2018
* Release status: Public Preview

## What's new in this version
* Optimize web page presentation for job list, job detail, sample gallery and sample detail.
* Manage storage for Azure Batch AI clusters, remote machines etc. on side bar. Please launch Storage Explorer from command palette (Ctrl + Shift + p) or right-clicking endpoint nodes.
* Support per-project configuration of Azure ML Workbench path.
* Support per-machine configuration of password and private key path.
* Bug fixes and stability improvements.

## Version 0.1.6
* Release date: Dec 19, 2017
* Release status: Public Preview

## What's new in this version
* Hotfix for compatibile with some other extensions.
* Other minor bugs fix

## Version 0.1.5
* Release date: Dec 15, 2017
* Release status: Public Preview

## What's new in this version
* Support Azure Batch AI
* Other minor bugs fix

## Version 0.1.4
* Release date: Nov 8, 2017
* Release status: Public Preview

## What's new in this version
* Allow set Azure Login timeout in Settings (default: 300 sec)
* Other minor bugs fix

## Version 0.1.3
* Release date: Nov 1, 2017
* Release status: Public Preview

## What's new in this version
* Improve Azure login and azure resource quick pick experience.
* Improve file browse by the new APIs provided by VS code 1.17.
* Fix authorize bugs in Remote Machine.
* Fix resource group select bug in create Azure ML project.
* Other minor bugs fix.

## Version 0.1.2
* Release date: Oct 9, 2017
* Release status: Public Preview

## What's new in this version
* Fix PATH issue of local submission environments.

## Version 0.1.1
* Release date: Sep 25, 2017
* Release status: Public Preview

## What's new in this version
Initial Release