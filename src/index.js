import forOwn from 'for-own'
import isPlainObject from 'is-plain-object'
import errorReporter from '@google/cloud-errors'
import {Transport} from 'winston/lib/winston/transports/transport'

/**
 * Winston transport for Stackdriver Error Reporting service.
 */
class StackdriverErrorReporting extends Transport {

  /**
   * Class constructor.
   *
   * @param {Object} options Configuration options.
   */
  constructor(options = {}) {

    super(options);

    this.name = 'StackdriverErrorReporting';
    this.level = options.level || 'error';
    this.mode = options.mode.toLowerCase() || 'api';
    this.serviceContext = options.serviceContext || {service: 'unknown', version: 'unknown'};
    if (this.mode !== 'console' && this.mode !== 'api') {
      throw new Error('StackdriverErrorReporting: parameter "mode" is expected to be "console" or "api".');
    }

    if (this.mode === 'api') {
      // NODE_ENV hack is required until
      // https://github.com/GoogleCloudPlatform/cloud-errors-nodejs/issues/79
      // will be resolved
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      this._client = errorReporter.start(options);
      process.env.NODE_ENV = previousNodeEnv;
    }
  }

  /**
   * Send entry to Stackdriver Error Reporting.
   *
   * @param {String} level - Winston log entry level.
   * @param {String} message - Log entry message.
   * @param {Object} meta - Winston meta information.
   * @param {Function} callback - Callback to let Winston know we are done.
   */
  log(level, message, meta, callback) {

    const promise = (this.mode === 'api')
      ? this.logApi(level, message, meta)
      : this.logConsole(level, message, meta);

    promise
      .then(() => callback(null, true))
      .catch((error) => callback(error, false));
  }

  /**
   * Send entry to Stackdriver Error Reporting with a help of console.log().
   *
   * @param {String} level - Winston log entry level.
   * @param {String} message - Log entry message.
   * @param {Object} meta - Winston meta information.
   * @return {Promise}
   */
  logConsole(level, message, meta) {

    const eventTime = (new Date()).toISOString();
    const errors = this.extractErrorsFromMeta(meta);
    errors.forEach((error) => {

      const stackTrace = Array.isArray(error.stack) ? error.stack.join("\n") : error.stack;
      const message = JSON.stringify({
        eventTime,
        message: stackTrace,
        severity: level.toUpperCase(),
        serviceContext: this.serviceContext,
      });
      if (meta.context) {
        message.context = meta.context;
      }

      console.log(message);
    });

    return Promise.resolve();
  }

  /**
   * Send entry to Stackdriver Error Reporting with a help of API.
   *
   * @param {String} level - Winston log entry level.
   * @param {String} message - Log entry message.
   * @param {Object} meta - Winston meta information.
   * @return {Promise}
   */
  logApi(level, message, meta) {

    const promises = [];

    const errors = this.extractErrorsFromMeta(meta);
    errors.forEach((error) => {

      const stackTrace = Array.isArray(error.stack) ? error.stack.join("\n") : error.stack;
      promises.push(
        new Promise((resolve, reject) => {
          let request = null;
          if (meta.context && meta.context.httpRequest) {
            request = meta.context.httpRequest;
          }
          this._client.report(error, request, stackTrace, (reportError) => {
            if (reportError) {
              console.log('Failed to send error to Stackdriver Error Reporting.', reportError);
              return reject(reportError);
            }
            return resolve();
          })
        })
      );
    });

    return Promise.all(promises);
  }

  /**
   * Extracts all errors from Winston metadata.
   *
   * @param {Object} data - Winston meta data.
   * @return {Array}
   */
  extractErrorsFromMeta(data) {

    let errors = [];

    if (data.stack) {
      errors.push(data);
    } else if (isPlainObject(data)) {
      forOwn(data, (value) => {
        errors = errors.concat(this.extractErrorsFromMeta(value));
      });
    } else if (Array.isArray(data)) {
      data.forEach((value) => {
        errors = errors.concat(this.extractErrorsFromMeta(value));
      });
    }

    return errors;
  }
}

export default StackdriverErrorReporting