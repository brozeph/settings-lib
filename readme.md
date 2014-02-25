# Settings Library

This library intends to allow configuration settings from multiple config sources to be combined, in layers, starting with a base configuration, adding environment settings to that and finally applying command line settings.

This module allows an application to specify a base configuration file that contains settings necessary for development. Subsequent configuration file overrides can be applied to override configuration settings in the base config, either via NODE_ENV, other environment variables, via command line switches or all of the above.

[![Dependency Status](https://gemnasium.com/brozeph/settings-lib.png)](https://gemnasium.com/brozeph/settings-lib)
[![Coverage Status](https://coveralls.io/repos/brozeph/settings-lib/badge.png)](https://coveralls.io/r/brozeph/settings-lib)

## Installation

```Javascript
npm install settings-lib
```

## Usage

```Javascript
var
  settings = require('settings'),
  options = {};

settings.initialize(options, function (err, config) {
  // work with config
});
```

## Options

The `options` parameter is optional. When it is not supplied or when only a portion of it is supplied, the default options take precidence.

```Javascript
defaultOptions = {
  baseConfigPath : '',
  commandLineSwitches : ['--config-file'],
  environmentSearchPaths : ['./', './config', './settings'],
  readCommandLineMap : {},
  readEnvironmentMap : {}
};
```

### Base Config Path

The base configuration path is specified as a single string value in the options object passed to settings via `initialize(options, callback)`. If no baseConfigPath field exists or the value is blank, the settings library will attempt to construct configuration via environment based configuration and command line based configuration.

### Environment Search Paths

Environment search paths are supplied as an array to the field `environmentSearchPaths` in the options parameter. When specified, any value supplied in the `NODE_ENV` environment variable will be used to attempt to locate a `.json` file.

For example, notice the following command line:

```Bash
NODE_ENV=develop node app.js
```

In the above example, settings-lib will attempt to locate a file named `develop.json` in each of the supplied environment search paths. The first configuration file found will be the one used, so if there are multiple matches, only one configuration file (the first matched) will be used. In the above example, if a file exists in `./config/develop.json`, that file will be loaded and will override any settings specified in the base configuration.

### Command Line Switches

Command line switches work similarly to environment search paths. They can be supplied as an array to the settings-lib and any command line arguments supplied to the node application will be searched to determine if a configuration file is found.

For example, notice the following command line:

```Bash
node app.js --config-file "./config/production.json"
```

In the above example, settings-lib will attempt to locate the file specifed (`./config/production.json`) provided that options includes `--config-file` as a switch in the commandLineSwitches field specified within options at initialization (by default, `--config-file` is used when settings-lib is initialized with no options).

### Read Environment Mapping

### Read Command Line Mapping
