[![Build status](https://ci.appveyor.com/api/projects/status/e4uru1b498486cdo/branch/master?svg=true)](https://ci.appveyor.com/project/creesch/reddit-moderator-toolbox-redesign/branch/master)
  

[![Discord](https://img.shields.io/discord/535490452066009090.svg?color=blue&label=discord&logo=discord&logoColor=fff)](https://discord.gg/8fGCykQ) [![Chat on IRC](https://img.shields.io/badge/irc-%23toolbox-blue.svg)](http://webchat.snoonet.org/#toolbox)


toolbox for reddit
========================

Bundled extension of the /r/toolbox moderator tools for reddit.com

Documentation: https://www.reddit.com/r/toolbox/w/docs


# Contributing 

Thinking about contributing to toolbox? Awesome! [Here is some information to get you started!](/CONTRIBUTING.md)

# Development

## Chrome

- Go to `chrome://extensions`.
- Check the "Developer mode" checkbox if it's not already checked.
- Click the "Load unpacked extension..." button.
- Load the `extension` directory.

Reload the extension when needed.

## Firefox (developer or nightly edition)

- Go to `about:debugging`.
- Click the "Load Temporary Add-on" button.
- Point to `extension/manifest.json`.

Reload the addon when needed.

# Building

**Note that it is not needed to use the build process for development purposes, all supported browsers can run the unpacked version of toolbox directly from the `/extension` directory**

Building is relatively easy through [nodejs](https://nodejs.org/)

Navigate to the root of the toolbox folder and install the dependencies

```sh
$ npm install
```

To build toolbox now simply run

```sh
$ npm run build
```

This will create a zip file which can be used in both Chrome as well as Firefox versions that support web extensions.

If you also want to update the code documentation you run

```sh
$ npm run docs
```

### Third party support

All shared features settings and data are stored in subreddit wikis through versioned json. Third party applications can use this data to hook into toolbox features like usernotes.

Examples:

- https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/JSON:-usernotes
- https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/JSON:-toolbox-config

### Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs][homepage]

[homepage]: https://saucelabs.com
