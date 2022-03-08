# Settings Library

This library provides easy access to configuration from multiple sources (JSON, YAML, environment variables or command line switch parameters) and combines them, in layers, starting with a base file (if provided), adding environment settings to this and finally applying any command line switches that have been configured. While not limited or constrained to a specific approach, this library may be used to easily facilitate [The Twelve-Factor App](https://12factor.net/config) configuration methodology in your applications.

A base configuration file can be specified that contains settings necessary for development. Subsequent configuration can be applied to augment and override configuration settings in the base config, either via NODE_ENV, other environment variables, via command line switches or all of the above!

This module is useful in that it allows you to abstract configuration management from your application and deployment at runtime, thus enabling you to avoid checking in sensitive configuration values (i.e. usernames, passwords, secret keys, etc.) to source control. Effectively, one should never commit configuration values into a source code repository and the litmus test for [The Twelve-Factor App](https://12factor.net/config) methodology is that the codebase could be made open source, at any moment, without compromising security credentials.

[![Build Status](https://secure.travis-ci.org/brozeph/settings-lib.png)](http://travis-ci.org/brozeph/settings-lib)
[![Coverage Status](https://coveralls.io/repos/brozeph/settings-lib/badge.png)](https://coveralls.io/r/brozeph/settings-lib)

## Installation

```Javascript
npm install --save settings-lib
```

## Usage

### initialize

The `initialize` method will read in all configuration, from each source, compile the details and then return a configuration Javascript object for subsequent usage within your application. This method supports an optional callback, can be executed as a Promise or can return from an async/await call.

Below is an example using a callback:

```Javascript
const options = { baseSettingsPath : './config/config.json' };
const settings = require('settings-lib'),

settings.initialize(options, function (err, config) {
  // work with config
});
```

The `initialize` method also supports promises natively:

```Javascript
const options = { baseSettingsPath : './config/config.json' };
const settings = require('settings-lib'),

settings
  .initialize(options)
  .then((config) => {
    // work with config
  })
  .catch((err) => {
    // handle any loading / parsing errors
  });
```

The `initialize` method may also be called within an `async` function:

```javascript
import settings from 'settings-lib';

const options = { baseSettingsPath : './config/config.json' };

async function main () {
  let config;

  try {
    config = await settings.initialize(options);
    // work with config
  } catch (ex) {
    // handle any loading / parsing errors
  }
}
```

## Options

The `options` parameter is optional. When it is not supplied or when only a portion of it is supplied, the default values (as shown below) take precidence for any fields that are missing.

```Javascript
defaultOptions = {
  baseSettingsPath : '',
  commandLineSwitches : ['--config-file'],
  environmentSearchPaths : ['./', './config', './settings'],
  readCommandLineMap : {},
  readEnvironmentMap : {},
  strict : false
};
```

### Base Settings Path

The base configuration (`baseSettingsPath`) is specified as a file path in the options object when calling `initialize(options, callback)`. If no `baseSettingsPath` field exists or the value is blank, the settings library will attempt to construct configuration via environment based configuration and command line based configuration. The base settings path may be either a YAML (`.yml`) or JSON (`.json`) file.

### Strict

The strict value works in conjunction with the `baseSettingsPath` provided via the options. When `strict` is specified as `true`, only the fields defined in the `baseSettingsPath` configuration file will be used and can be overridden when all settings from various sources are combined. This means that additional settings values that are defined in the environment specific override (i.e. `develop.json` when `NODE_ENV=develop` exists) will be ignored if the keys aren't specified in the file at the `baseSettingsPath`. By default, the value of `strict` is set to `false` and any new key/value pairs present in the environment override files augment and are added to the base settings when not originally specified.

### Environment Search Paths

Environment search paths are supplied as an array to the field `environmentSearchPaths` in the options parameter. When specified, any value supplied in the `NODE_ENV` environment variable will be used to attempt to locate a similarly named `.json` or a `.yml` file. If both a `.json` file and a `.yml` file exist, the `.yml` file values will be the ones loaded.

For example, notice the following command line:

```Bash
NODE_ENV=develop node app.js
```

In the above example, settings-lib will attempt to locate a file named `develop.json` in each of the supplied environment search paths. The latest configuration file found will be the one used, so if there are multiple matches, only one configuration file (the last one matched) will be used. In the above example, if a file exists in `./config/develop.json`, that file will be loaded and will override any settings specified in the base configuration. If there exists both a `./config/develop.json` and a `./config/develop.yml`, the the YAML file will be used.

### Command Line Switches

Command line switches work similarly to environment search paths. They can be supplied as an array to the settings-lib and any command line arguments supplied to the node application will be searched to determine if a configuration file is found.

For example, notice the following command line:

```Bash
node app.js --config-file "./config/production.json"
```

In the above example, settings-lib will attempt to locate the file specifed (`./config/production.json`) provided that options includes `--config-file` as a switch in the commandLineSwitches field specified within options at initialization (by default, `--config-file` is used when settings-lib is initialized with no options).

### Read Environment Mapping

In the event that you wish to override specific configuration keys directly via an environment variable, specify and environment variable mapping in the options when initializing the module:

```Javascript
var
  settings = require('settings-lib'),
  options = {
    readEnvironmentMap : {
      APP_HOSTNAME : 'server.hostname'
    }
  };

settings.initialize(options, function (err, config) {
  // work with config
  console.log('hostname: %s', config.server.hostname);
});
```

When executing your node application, supply the configured environment variable:

```Bash
APP_HOSTNAME=myapp.mydomain.com node app.js
```

### Read Command Line Mapping

Similar to environment variable configuration key mapping, command line configuration key mapping is possible as well. Specify a command line key mapping in the options when initializing the module:

```Javascript
var
  settings = require('settings-lib'),
  options = {
    readCommandLineMap : {
      '--hostname' : 'server.hostname'
    }
  };

settings.initialize(options, function (err, config) {
  // work with config
  console.log('hostname: %s', config.server.hostname);
});
```

When executing your node application, supply the configured environment variable:

```Bash
node app.js --hostname myapp.mydomain.com
```
