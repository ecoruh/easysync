
const winston = require('winston');
const random = require('./random');
/**
 * @description Resolves a promise when its signal stack is full or timeout expires
 *
 * @example
    let workClosedSemaphore = new Semaphore(10);

    cluster.on('message') {
      workClosedSemaphore.signal();
    }

    doStuff.then(() => workClosedSemaphore.waitPromise())
    .then(() => {
      assert(workClosedSemaphore.signalCount === 10);
    });
 */
module.exports = class Semaphore {
  /**
   * @param {string} capacity - Promise resolves when this is reached
   * @param {integer} timeout - Promise resolves when this expires after first call to waitPromise()
   */
  constructor(capacity, timeout = 60000) {
    this.capacity = capacity;
    this.signalCount = 0;
    this.name = random.name();
    this.timeout = timeout;
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  /**
   * Resets the timer to be set when waitPromise() is called next
   */
  resetTimer() {
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }
  }

  /**
   * Resets the object state back to post constructor state
   */
  reset() {
    this.signalCount = 0;
    this.name = random.name();
    this.resetTimer();
}

  /**
   * If this is the first call after the object is constructed or reset()
   * called then a safety timer is wound for releasing the caller in case
   * not sufficient calls to signal() is received during the timeout period.
   * Returns a promise without promise being called thereby holding
   * the caller in wait state until signalCount reaches the capacity
   * or timeout occurs.
   */
  waitPromise() {
    winston.info(`Semaphore ${this.name} - waiting..`);
    if (!this.timeoutID) {
      this.timeoutID = setTimeout(() => {
        if (this.resolve) {
          winston.info(`Semaphore ${this.name} - resolved by timeout`);
          this.resolve();
        }
      }, this.timeout);
    }
    return this.promise;
  }

  /**
   * Increases the signalCount towards the capacity.
   * If the capacity is reached the waiters are released
   * by calling the promise resolve().
   */
  signal() {
    if (this.signalCount < this.capacity) {
      this.signalCount += 1;
    }
    winston.info(`Semaphore ${this.name} - signalled ${this.signalCount} times`);
    if (this.signalCount === this.capacity) {
      if (this.resolve) {
        winston.info(`Semaphore ${this.name} - resolved by signals`);
        this.resolve();
      }
    }
  }
}
