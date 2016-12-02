Stackdriver Error Reporting transport for Winston logger
========================================================


Overview
--------

This package is [Winston] logger transport that sends errors to [Stackdriver Error Reporting] service.

It's based on [@google/cloud-errors] library.


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

This transport supports 100% same configuration options as [@google/cloud-errors] library.
The only additional option is `options.level` that controls minimal log entry level that should be sent to Stackdriver.


### How it works

When log entry reaches this transport, it will search `meta` object of log entry for objects that looks like errors
(with `message` and `stack` properties defined).
After that, all errors will be delivered to [Stackdriver Error Reporting] service.

If `meta.request` property is defined, it will be attached to error as it's context.


[//]: # (These are reference links used in the body of this document)

[Winston]: <https://github.com/winstonjs/winston>
[Stackdriver Error Reporting]: <https://cloud.google.com/error-reporting/>
[@google/cloud-errors]: <https://github.com/GoogleCloudPlatform/cloud-errors-nodejs>