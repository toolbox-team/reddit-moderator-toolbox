# Contributor guidelines

Thinking about contributing to toolbox? Awesome! Here is some information to get you started! 

## Reporting bugs 

We ask that you first make a post in the [/r/toolbox](https://www.reddit.com/r/toolbox) subreddit before submitting an issue here. This in order to keep clutter out of the issues on github as much as possible. 

## Contributing documentation

You don't need to be a programmer to contribute! User documentation is something that can almost always be improved. So if you want to contribute and can't contribute code have a look at the [/r/toolbox documentation pages](https://www.reddit.com/r/toolbox/wiki) 

## Contributing code 

New contributions to toolbox are always welcome, there are some guidelines we ask you to follow. 

### Code/Programming style guidelines 

Since toolbox is a project that receives contributions from multiple people from various programming backgrounds it is important to be aware of style conventions. Our programming style guidelines aim is to make it easier for someone who starts work on toolbox to familiarize themselves with the style conventions agreed upon in toolbox.

The document can be found [in this wiki article](../../wiki/Programming-style-guide).

### Contributing completely new functionality 

We welcome new functionality, however it is always possible that someone is already working on something you have thought up or that we have not implemented something deliberately. So if you are considering coding new functionality it is always a good idea to first check. Simply make an issue here on GitHub or [contact the team on Discord or IRC](../../wiki/Contacting-the-toolbox-team)

### Existing utility functions

We have a lot of utility functions in toolbox ready to be used for background operations as well as interface building. So when you need a specific sort of function it is always a good idea make sure to check if it does not already exist. 

You can find the documentation for all this on the following locations:

- [JSDoc code documentation](code_jsdocs.md) WIP
- [Toolbox module documentation](../../wiki/Module-Structure) details how the general toolbox module structure works. 
- Team members on Discord or IRC. We try to keep the documentation updated but it very much is a work in progress. So when things are unclear don't be afraid to simply ask. 

## Project structure

- `/`: root directory containing scripting for building toolbox and configuration for development related things (linting, git configuration files). 
- `extension/`: root directory of the extension itself. Contains the manifests. From here the unpacked extension can be loaded for development. 
- `extension/data/`: Directory containing the functional code of toolbox. All files starting with `tb` are toolbox core scripts.
- `extension/data/tbmodule.js`: Modules are loaded into toolbox through this.
- `extension/data/tbstorage.js`: Everything storage related. 
- `extension/data/tbui.js`: Handles creating UI elements.
- `extension/data/tbutils.js`: TBUtils is one of the core blocks on which toolbox is build. It contains most of functions used to interact with reddit.
- `extension/data/background/`: Contains extension background scripts
- `extension/data/images/`: Images used by toolbox.
- `extension/data/libs/`: Contains javascript libraries used by toolbox
- `extension/data/modules/`: Contains the individual toolbox modules. 
- `extension/data/styles/`: Contains all CSS


## Loading toolbox into your browser

##### Chrome

1. Go to `Menu->Tools->Extensions` and tick the `Developer Mode` checkbox.
1. Click `Load unpacked extension` and select the `/extension` folder.
1. Any time you make changes, you must go back to the `Menu->Tools->Extensions` page and `Reload` the extension.

##### Firefox

1. Go to `about:debugging` and tick the `Enable add-on debugging` checkbox.
1. Click `Load Temporary Add-on` and select `/extension`/manifest.json`.
1. Any time you make changes, you must go back to the `about:debugging` page and `Reload` the extension.
