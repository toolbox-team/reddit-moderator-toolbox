# Contributor guidelines

Thinking about contributing to toolbox? Awesome! Here is some information to get you started! 

## Reporting bugs 

We ask that you first make a post in the [/r/toolbox](https://www.reddit.com/r/toolbox) subreddit before submitting an issue here. This in order to keep clutter out of the issues on github as much as possible. 

## Contributing code 

New contributions to toolbox are always welcome, there are some guidelines we ask you to follow. 

### Code/Programming style guidelines 

Since toolbox is a project that receives contributions from multiple people from various programming backgrounds it is important to be aware of style conventions. Our programming style guidelines aim is to make it easier for someone who starts work on toolbox to familiarize themselves with the style conventions agreed upon in toolbox.

The document can be found [here in our wiki](https://github.com/creesch/reddit-moderator-toolbox/wiki/Programming-style-guide).

### Contributing completely new functionality 

We welcome new functionality, however it is always possible that someone is already working on something you have thought up or that we have not implemented something deliberately. So if you are considering coding new functionality it is always a good idea to first check. Either on irc or by making an issue about it on github. 

### Try to make use of existing utility functions

We have a lot of utility functions in toolbox ready to be used for background operations as well as interface building. So when you need a specific sort of function make sure to check if it does not already exist. This is even more important when dealing with reddit DOM manipulation and information scraping. Reddit has the habbit of presenting data in a multitude of different ways depending on the location and the time of the month, a lot of the functionality in our utility code has been refined over the years to account for that.

You can find the documentation for all this on the following locations 

- [TBUtils](https://github.com/creesch/reddit-moderator-toolbox/wiki/TBUtils-function-calls) contains the main bulk of the utility functions. 
- [TBui](https://github.com/creesch/reddit-moderator-toolbox/wiki/TBui-function-class) takes care of most of our interface needs. 
- [Toolbox module documentation](https://github.com/creesch/reddit-moderator-toolbox/wiki/Toolbox-module-notes) details how the general toolbox module structure works. 





## Loading toolbox into your browser

##### Chrome

1. Go to `Menu->Tools->Extensions` and tick the `Developer Mode` checkbox.
1. Click `Load unpacked extension` and select the `/extension` folder.
1. Any time you make changes, you must go back to the `Menu->Tools->Extensions` page and `Reload` the extension.

##### Microsoft Edge

1. Go to `about:flags` and tick the `Enable extension developer features` checkbox.
1. Click `Load extension` on the extensions menu and select the `/extension`.
1. Any time you make changes, you must go back to the `Menu->Extensions` page, go to the extension's settings and `Reload` the extension.

##### Firefox

1. Go to `about:debugging` and tick the `Enable add-on debugging` checkbox.
1. Click `Load Temporary Add-on` and select `/extension`/manifest.json`.
1. Any time you make changes, you must go back to the `about:debugging` page and `Reload` the extension.
