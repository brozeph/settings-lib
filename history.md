# v1.1.1 / 2019-02-11

* Adjusted babel dependencies to remove polyfill in favor of runtime

# v1.1.0 / 2019-01-09

* Added support for YAML files
* Added `strict` option for ensuring only `baseSettingsPath` keys are overriden in the resulting settings when `true`

# v1.0.2 / 2019-01-09

* Removed `gulp-coveralls` dependency to eliminate potential security risks

# v1.0.1 / 2019-01-07

* Fixed reference to main in `package.json`

# v1.0.0 / 2019-01-04

* Modernized code, removed `co` dependency and moved to `babel` for transpilation

# v0.3.0 / 2016-04-20

* Added alias of `baseSettingsPath` (in addition to `baseConfigPath`)

# v0.2.1 / 2016-04-19

* Fixed issue where environment config override file search was not properly working

# v0.2.0 / 2016-04-18

* Introduced native `Promise` support
* Moved to gulp for build tasks running
* Moved to eslint for code lint
* The first found match is applied when multiple environment override files are present

# v0.1.6 / 2015-11-16

* Fixed issue where `null` values in config caused type coercion to fail

# v0.1.5 / 2015-11-11

* Refined coercion of boolean types to work properly

# v0.1.4 / 2015-11-11

* Fixed issue where type coercion would not work properly on deeply nested configuration

# v0.1.3 / 2015-06-25

* Updated async module dependency

# v0.1.2 / 2015-05-28

* Adjusted command line and environment maps to attempt to coerce config override values based on the type found in the default settings

# v0.1.1 / 2015-03-19

* Increased verbosity of error when unable to parse JSON config

# v0.1.0 / 2015-03-18

* Added support for Node v0.12

# v0.0.5 / 2014-11-24

* Adjusted for changes in how jscoverage works

# v0.0.4 / 2014-11-24

* Updated dependencies

# v0.0.3 / 2014-11-24

* Fixed incorrect information in the readme.md

# v0.0.2 / 2014-02-25

* Added support for Travis CI builds
* Increased unit test coverage
* Updated dependency for Async

# v0.0.1 / 2013-11-26

* Initial release of library
