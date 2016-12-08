Stackdriver Error Reporting transport for Winston logger
========================================================

[![Build Status](https://travis-ci.org/findanyemail/winston-transport-stackdriver-error-reporting.svg?branch=master)](https://travis-ci.org/findanyemail/winston-transport-stackdriver-error-reporting "Build Status")
[![Code Climate](https://codeclimate.com/github/findanyemail/winston-transport-stackdriver-error-reporting/badges/gpa.svg)](https://codeclimate.com/github/findanyemail/winston-transport-stackdriver-error-reporting "Code Climate")
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/findanyemail/winston-transport-stackdriver-error-reporting/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/findanyemail/winston-transport-stackdriver-error-reporting/?branch=master "Scrutinizer Code Quality")
[![NPM Version](https://img.shields.io/npm/v/@findanyemail/winston-transport-stackdriver-error-reporting.svg)](https://www.npmjs.com/package/@findanyemail/winston-transport-stackdriver-error-reporting "NPM Version")

Overview
--------

This package is [Winston] logger transport that sends errors to [Stackdriver Error Reporting] service.

It's able to work in two modes:

1. Logging to stdout compatible with [Google Container Engine];
2. Logging via an API with a help of [@google/cloud-errors] library.



Usage and Configuration
-----------------------

Simply add this to your Winston transports array:

```js
    winston.configure({
      transports: [
        new StackdriverErrorReporting(options),
      ],
    });
```

This transport supports 100% same configuration options as [@google/cloud-errors] library, and uses API transport by default.
The only additional option is `options.level` that controls minimal log entry level that should be sent to Stackdriver.

If you want to use stdout logging mode, all you need is to switch mode and set your `serviceContext`:

```js
    winston.configure({
      transports: [
        new StackdriverErrorReporting({
          mode: 'console',
          serviceContext: {
            service: 'my service',
            version: '1.0.0'
          }
        }),
      ],
    });
```


How it works
------------

When log entry reaches this transport, it will search `meta` object of log entry for objects that looks like errors
(with `stack` property defined).
After that, all errors will be delivered to [Stackdriver Error Reporting] service.

If `meta.context` property is defined, it will be attached to error as it's context.
Please see [Stackdriver Error Reporting documentation](https://cloud.google.com/error-reporting/docs/formatting-error-messages) for details.


[//]: # (These are reference links used in the body of this document)

[Winston]: <https://github.com/winstonjs/winston>
[Google Container Engine]: <https://cloud.google.com/container-engine/>
[Stackdriver Error Reporting]: <https://cloud.google.com/error-reporting/>
[@google/cloud-errors]: <https://github.com/GoogleCloudPlatform/cloud-errors-nodejs>