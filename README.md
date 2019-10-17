
toolbox for reddit [![Build status](https://ci.appveyor.com/api/projects/status/e4uru1b498486cdo/branch/master?svg=true)](https://ci.appveyor.com/project/creesch/reddit-moderator-toolbox-redesign/branch/master) 
[![DeepScan grade](https://deepscan.io/api/teams/5774/projects/7592/branches/79819/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5774&pid=7592&bid=79819) [![Chat on IRC](https://img.shields.io/badge/irc-%23toolbox-blue.svg)](http://webchat.snoonet.org/#toolbox) [![Discord](https://img.shields.io/discord/535490452066009090.svg?color=blue&label=discord&logo=discord&logoColor=fff)](https://discord.gg/8fGCykQ)
========================

Bundled extension of the /r/toolbox moderator tools for reddit.com

Documentation: https://www.reddit.com/r/toolbox/w/docs


## Contributing 

Thinking about contributing to toolbox? Awesome! [Here is some information to get you started!][contributing]

## Development

Building the extension is relatively easy through [Node.js][nodejs].

```sh
$ npm install          # Install dependencies
$ npm run build        # Build extension .zip files for Chrome and Firefox
$ npm run build-watch  # Automatically rebuild on file changes
$ npm run docs         # Build documentation of internal interfaces
```

Once you've built a .zip for your platform, you're ready to test! Remember to reload the extension between builds.

### Testing on Chrome
**Note:** It is not needed to build for chrome as it can be run directly from source. 

- Go to `chrome://extensions`.
- Check the "Developer mode" checkbox if it's not already checked.
- Click the "Load unpacked extension..." button.
- Load the `extension` directory.

### Testing on Firefox (Developer or Nightly Editions)

- Go to `about:debugging`.
- Click the "Load Temporary Add-on" button.
- Load the `/build/toolbox_v<version>_firefox.zip` file.

## Third-party Application Support

All shared features settings and data are stored in subreddit wikis through versioned JSON. Third party applications can use this data to hook into toolbox features like usernotes. Documentation for third-party application developers looking to integrate with toolbox can be found [on the wiki][third-party-docs].

## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs][saucelabs]

[nodejs]: https://nodejs.org/
[contributing]: /CONTRIBUTING.md
[third-party-docs]: https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/Subreddit-Wikis
[saucelabs]: https://saucelabs.com
