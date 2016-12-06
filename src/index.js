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

    // NODE_ENV hack is required until
    // https://github.com/GoogleCloudPlatform/cloud-errors-nodejs/issues/79
    // will be resolved
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    this._client = errorReporter.start(options);
    process.env.NODE_ENV = previousNodeEnv;
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

    const promises = [];

    if (meta) {
      const errors = this.extractErrorsFromMeta(meta);
      errors.forEach((error) => {
        const stackTrace = Array.isArray(error.stack) ? error.stack.join("\n") : error.stack;
        promises.push(
          new Promise((resolve, reject) => {
            this._client.report(error, meta.request, stackTrace, (reportError) => {
              if (reportError) {
                console.log('Failed to send error to Stackdriver Error Reporting.', reportError);
                return reject(reportError);
              }
              return resolve();
            })
          })
        );
      });
    }

    Promise.all(promises)
      .then(() => callback(null, true))
      .catch((error) => callback(error, false));
  }

  /**
   * Extracts all errors from Winston metadata.
   *
   * @param {Object} data - Winston meta data.
   * @return {Array}
   */
  extractErrorsFromMeta(data) {

    const errors = [];

    if (isPlainObject(data)) {
      if (data.stack) {
        errors.push(data);
      } else {
        forOwn(data, (value) => {
          errors.concat(this.extractErrorsFromMeta(value));
        });
      }
    } else if (Array.isArray(data)) {
      data.forEach((value) => {
        errors.concat(this.extractErrorsFromMeta(value));
      });
    }

    return errors;
  }
}

export default StackdriverErrorReporting