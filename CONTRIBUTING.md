# Contributor guidelines

Thinking about contributing to toolbox? Awesome! We accept a variety of different types of contributions:

## Issues and Ideas

We welcome bug reports and feature requests. Please submit those to [/r/toolbox](https://www.reddit.com/r/toolbox) rather than creating a Github issue unless you've already talked to us about your issue or idea, to help us minimize clutter.

## Documentation

Our [user documentation pages](https://www.reddit.com/r/toolbox/wiki) can always use help, and contributing doesn't require coding knowledge! If you know how to use Toolbox and want to help the project, check out our docs wiki.

We also accept edits to [our Github wiki](https://github.com/toolbox-team/reddit-moderator-toolbox/wiki), which holds documentation for our internal processes and for third-party developers looking to integrate toolbox settings and data into their tools. Working on it will require a fair bit of techincal knowledge, but we welcome feedback and changes there as well.

## Contributing Code

We review and accept pull requests for new features and bug fixes. Here's some information that will be useful for developers looking to get started:

### Code/Programming style guidelines

Since toolbox is a project that receives contributions from multiple people from various programming backgrounds, it's important to be aware of style conventions. We have [a dev wiki article](https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/Programming-style-guide) that explains some of our setup.

### Contributing completely new functionality

We welcome new functionality, however it is always possible that someone is already working on something you have thought up or that we have not implemented something deliberately. So if you are considering coding new functionality it is always a good idea to first check. Simply make an issue here on GitHub or [contact the team on Discord or IRC](https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/Contacting-the-toolbox-team).

### Existing utility functions

We have a lot of utility functions in toolbox ready to be used for background operations as well as interface building. So when you need a specific sort of function it is always a good idea make sure to check if it does not already exist.

You can find the documentation for all this on the following locations:

- [JSDoc source code documentation](https://toolbox-team.github.io/source-docs/) Note: Not yet entirely complete, more documentation for code is an ongoing effort.
- [Toolbox module documentation](https://github.com/toolbox-team/reddit-moderator-toolbox/wiki/Toolbox-Module-Structure) details how the general toolbox module structure works.
- Team members on Discord. We try to keep the documentation updated but it very much is a work in progress. So when things are unclear don't be afraid to simply ask.

## Project structure

- `/`: root directory containing scripting for building toolbox and configuration for development related things (linting, git configuration files).
- `extension/`: root directory of the extension itself. Contains the manifests. From here the unpacked extension can be loaded for development.
- `extension/data/`: Directory containing the functional code of toolbox. All files starting with `tb` are toolbox core scripts.
- `extension/data/tbmodule.jsx`: Modules are loaded into toolbox through this.
- `extension/data/tbstorage.js`: Everything storage related.
- `extension/data/tbui.js`: Handles creating UI elements.
- `extension/data/tbhelpers.js`: Contains standalone utility functions. Public functions all are part of the `TBHelpers` object.
- `extension/data/tbapi.ts`: Contains reddit api utility functions. Public functions all are part of the `TBApi` object.
- `extension/data/tbcore.js`: TBCore is one of the core blocks on which toolbox is build. It contains a lot of information about the state of toolbox and reddit.
- `extension/data/background/`: Contains extension background scripts
- `extension/data/images/`: Images used by toolbox.
- `extension/data/modules/`: Contains the individual toolbox modules.
- `extension/data/styles/`: Contains all CSS

## Building, testing, and dev scripts

Building the extension is relatively easy through [Node.js](https://nodejs.org/en/). We use [Rollup](https://www.rollupjs.org/) to bundle the extension's Javascript code and manually copy over assets including images and the `manifest.json` file via [rollup-plugin-copy](https://www.npmjs.com/package/rollup-plugin-copy). Additionally, some browser-specific processing is applied to the manifest to work around some browser-specific incompatibilities. Build output goes to `build/chrome` and `build/firefox`.

```sh
$ npm install           # Install dependencies
$ npm run build         # Build extension
$ npm run build:watch   # Automatically rebuild on file changes
$ npm run docs          # Build documentation of internal interfaces
```

You won't need to mess with these for development, but `npm run build` takes the following environment variables:'

- `BUILD_TYPE`: One of `dev`, `beta`, `stable`; defaults to `dev`. Beta and stable builds are meant for distribution to others and are typically made by CI; dev builds are almost always what you want when building locally.
- `BUILD_SHA`: Commit hash of the commit that's being built. Leaving it unset for dev builds is normal, since your changes probably aren't committed yet anyway, but the build will yell at you if you try to generate a `beta` or `stable` release without it since those are meant to be distributed to others.

Once you've built the extension, you can load it up in your browser for testing:

## Testing on Chromium-Based browsers

- Go to `chrome://extensions` (`edge://extensions`, etc.).
- Check the "Developer mode" checkbox if it's not already checked.
- Click the "Load unpacked extension..." button.
- Chromium asks for the extension directory, so load the `build/chrome` directory.

## Testing on Firefox

- Go to `about:debugging`.
- Click "This Firefox" in the sidebar.
- Click "Load Temporary Add-on...".
- Firefox asks for a zip or the manifest file, so load the `build/firefox/manifest.json` file.

## Maintainer Information: Versioning

Toolbox version numbers are identified by a major.minor.patch stable release identifier (e.g. `6.1.13`) and an incrementing build number within each stable release. A beta release uses the version number of the stable release it will eventually be a part of (i.e. beta releases should not use a major.minor.patch which is already used by a stable release). Whenever a release is first made on a new major.minor.patch version (beta or stable), the build number resets to 1; subsequent releases increment the build number further, including the final stable release.

Git tags of stable releases use only the major.minor.patch identifier with a `v` prefix (e.g. `v6.1.13`). Beta releases also include a `-beta.#` suffix, where `#` is the build number (e.g. `v7.0.0-beta.1`).

The manifest `version` field combines the major.minor.patch and the build number into a single four-segment version string (e.g. `6.1.13.1`). The `version_name` field uses only the major.minor.patch, in addition to whatever fun name is selected for the release (e.g. `6.1.13 "Delaying Donkey"`).

As an example, a release timeline might look something like this:

| Manifest `version` | Git tag         | Release type |
| ------------------ | --------------- | ------------ |
| `6.1.13.1`         | `v6.1.13`       | stable       |
| `7.0.0.1`          | `v7.0.0-beta.1` | beta         |
| `7.0.0.2`          | `v7.0.0-beta.2` | beta         |
| `7.0.0.3`          | `v7.0.0`        | stable       |

### Tagging a New Release

1. Make sure the working directory is clear and you're on the `master` branch.
2. Run `npm run release`. This script will prompt you for the new four-segment version number, then the release name.
   - Ensure the major.minor.patch is set correctly. You should only need to update this if the previous release was a stable release.
   - If the previous release was a beta release, increment the build number by 1. If the previous release was a stable release, instead reset the build number _to_ 1.
   - We generally only change the release name for major or minor bumps. If you're making a stable release and didn't change this during the beta series, make sure you update this to something appropriate for the new release. Tradition dictates it should be an adjective related to the development of the release, and an animal which start with the same letter.

   The script will then automatically commit and tag the release in your local clone.
3. Verify that the commit created by the release script contains nothing except changes to the version strings in the manifest files.
4. Push the commit and tag: `git push && git push --tags`.

Once your tag is pushed to Github, the CI pipeline will generate release builds and automatically submit them to extension stores. Beta releases will be sent only to the beta listings; stable releases will result in updates to both the stable _and_ beta listings, with the beta listing receiving a beta-flagged build containing otherwise the same code.
