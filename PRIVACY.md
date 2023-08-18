Toolbox has access to the same information on reddit as the account(s) with which you use it.

The toolbox development team highly values privacy, these are the measures we have taken in order to protect the privacy of people using toolbox:

- Toolbox purposely lacks the technical means to send back any data back to the toolbox development team. ^[1]
- Any data accessed is used for toolbox functionality.
- If accessed data needs to be stored it is either stored on reddit (user notes, toolbox subreddit configuration, settings export) or in the local browser extension settings (personal settings, cache). No data is stored outside of reddit or out of reach of the person using toolbox.
- Data stored on reddit is stored through wiki pages. It is only stored in wiki pages of subreddits where the account using toolbox has access as moderator with the permissions to edit those pages. Any write action on a wiki page is accompanied with a settings change on the wiki page that makes sure only moderators have access to the written data.

---

_[1]_ toolbox is open-source, you can check the code and used webextension permissions on the repository here. No code is modified before the extension is released to the chrome store or mozilla AMO. Here is how you access the code of the installed version to verify this claim:

- Edge: `C:\Program Files\WindowsApps` will contain the installed extension.
- Chrome: Open `chrome://version/` and look for `Profile Path` which is the directory containing extensions.
- Firefox: Navigate to [your profile directory](https://support.mozilla.org/en-US/kb/profiles-where-firefox-stores-user-data) and then to the `extensions` subdirectory. You'll find `yes@jetpack.xpi` which can be opened as zip file.
