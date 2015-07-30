![Atlasboard](https://bitbucket.org/atlassian/atlasboard/raw/master/screenshots/wallboard8x6.png)

## Build status

[![Build Status](https://drone.io/bitbucket.org/atlassian/atlasboard/status.png)](https://drone.io/bitbucket.org/atlassian/atlasboard/latest)

## Installation

`npm install -g atlasboard`


## Creating your first wallboard

After installing Atlasboard as a global module, you may want to do this:

`atlasboard new mywallboard`


to generate your wallboard.


## Importing your first package

You probably want to reuse the dashboards, widgets and jobs that people have already created.

The [Atlassian package](https://bitbucket.org/atlassian/atlasboard-atlassian-package) is a good start. Atlasboard packages are installed as submodules. You need to initialise a git repository first. Just type:

    git init
    git submodule add https://bitbucket.org/atlassian/atlasboard-atlassian-package packages/atlassian

Don't forget to setup your credentials (globalAuth.json file)!

## Documentation

[Check out the wiki](https://bitbucket.org/atlassian/atlasboard/wiki/Home)

## More information

Check out the [Atlasboard website](http://atlasboard.bitbucket.org).

## Release history

### 0.13.0

- Fix issue #98: Expose pushUpdate functions to jobs to push updates to the widget independently of the scheduler interval cycle
- Internal scheduler refactoring. Remove singletons

### 0.12.0

- Added a check to change the NPM command executed based on platform

### 0.11.0

- Remove console-helper
- Allow custom templates to be defined in the local wallboard
- Add bower to manage Atlasboard core front-end dependencies
- Bump jQuery to 2.x. IE8 not supported anymore (if it ever was)
- Unique events for widgets, even if they have the same combination of job, widget name and configuration.
- Use "disabled" text instead of default error icon when widget is disabled
- Send the AtlasBoard version in the User-Agent (request job dependency)
- Fix deprecation warnings in use of Express
- Warning when multiple callback execution detected in a job

### 0.10.0

- Enable the cookie jar for request
- Introduce install command and --noinstall option to start command
- Add HipChat roomInfo endpoint and support for api v2
- Upgrade request to ^2.53.0
- Add support for expanding environment variables in globalAuth.json
- Send errors to the client immediately (ignoring retry settings) on the first run
- Always send error events to the client
- Don't use absolute links / proxy support

### 0.9.0

- Fix warning icon image
- Use spin.js instead of an image spinner
- Bump gridster to 0.5.6
- Bump rickshaw to 1.5
- Add an experimental confluence library to assist in fetching pages using Content API
- Make sure config is never undefined
- Fixing schedulers so job execution doesn't overlap if it takes too long

### 0.8.0

- Improve project and job scaffolding
- Add unit test to new job template
- Bump up a bunch of dependencies (it was about time!)
- Improve socket.io reconnect
- Add new shinny 8x6 grid size screenshot

### 0.7.0

- Allow configurable (per dashboard) grid size (issue #64)
- Bump up cheerio to 0.13.1
- Bump up grister to 0.5.1
- Avoid widget title wrapping
- related to issue #64
- Fix package.json "bin" attribute relative path.

### 0.6.0

- FIX: Issue #62. Properly namespace widget CSS by working with AST rules
- Issue #50 and #60. Make easier developing new jobs by adding filters to atlasboard start
- Refactor commands
- Added more unit tests
- Install only production dependencies on atlasboard start
- Ensure that we return pg clients to the connection pool
- Other minor fixes

### 0.5.6

- Added easyRequest for easier querying HTTP resources.

### 0.5.5

- Upping rickshaw graphics

### 0.5.4

- workaround was clearing the cache)

### 0.5.3

- FIX: Issue #53 Two versions of colors on disk throw.
- Some refactoring and some of the pending code style changes.
- Add build status using drone.io
- package order resolution in widgets
- FIX: Function.prototype.apply expect array in second arguments

### 0.5.2

- Add moment as job dependency
- Add underscore job dependency
- Add async dependency for jobs
- Use non-minified versions for easy browser debugging
- Add/remove widget-level loading class for better styling context

### 0.5.1

- Issue #42: fixed small regression for reconnects

### 0.5.0

- Move packages from packages to samples/project/packages to avoid users build the dashboard in an atlasboard clone.
- Clearer error message when job not found
- Add {"start": "atlasboard start"} to project scaffold package.json
- Error 500 rendering stylesheets/application.css
- Issue #42: Nicer handling of error messages in the UI
- Add rickshaw library to atlasboard core
- Add postreSQL job dependency
- Move third party assets to a separate third-party folder
- Add storage dependency. Refactor dependency injection.
- Issue #28 Add support for credentials file path

### 0.4.0

- Change widget naming to not include widget id anymore
- Added default config file so the custom one gets extended from this one.
- Fix default dashboard so it has the necessary widgets to fill the whole screen.
- Reorganize tests.
- Use logger to wrap the error when a dashboard has the wrong format.
- Make job manager error proof in case config file doesn't exists. If config file exists and it is invalid it should throw error.
- Added hipchat integration. New hipchat dependency.
- Allow fetching resources from widget folder.
- Display error and exit if http server port is in use
- Fix problem when displaying error with prevent the widget from displaying data again.
- A dashboard name must match /^[a-zA-Z0-9_-]*$/ to be valid.
- Other minor fixes.

### 0.3.1

- FIX: Require node 0.8 or higher in package.json

### 0.3.0

- Real-time logging visualization!.
- Issue #13: "generate dashboard" generates files in a sub-folder.
- Removed sample dashboard from atlasboard.
- Ability to disable dashboards by setting enabled:false in dashboard config file.
- Job task is executed in the context of the job object, so we can manage state across executions.
- Error handling and logging on jobs
- Prevent XSS in log viewer.
- Extra test coverage
- Disable logging by default through the config file
- Use connect-assets to serve css (and parse stylus)
- Enable serving of custom images from dashboards
- Improve startup banner

### 0.2.0

- can now resize browser and scale AtlasBoard.
- use connect-asset for common assets, since we are fetching now widget assets on demand.

### 0.1.1

- new atlasboard "list" command.
- handle errors on child process when executing "npm install".
- use minified versions of javascript libraries.

### 0.1.0

- first release after some important changes in the core architecture.
