
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
   *                            or last call to signal()
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
   * Stops the timer if started already
   */
  stopTimer() {
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }
  }

  /**
   * Start the timer if not started already
   */
  startTimer() {
    if (!this.timeoutID) {
      this.timeoutID = setTimeout(() => {
        if (this.resolve) {
          winston.info(`Semaphore ${this.name} - resolved by timeout`);
          this.resolve();
        }
      }, this.timeout);  
    }
  }

  /**
   * Stops the current timer and restarts it
   */
  restartTimer() {
    this.stopTimer();
    this.startTimer();
  }

  /**
   * Resets the object state back to post constructor state
   */
  reset() {
    this.signalCount = 0;
    this.name = random.name();
    this.stopTimer();
}

  /**
   * If this is the first call after the object is constructed or reset()
   * was called then a safety timer is set for releasing the caller in case
   * signal() is not called at all. Returns a promise without promise 
   * being called thereby holding the caller in wait state until signalCount 
   * reaches the capacity or timeout occurs.
   */
  waitPromise() {
    winston.info(`Semaphore ${this.name} - waiting..`);
    this.startTimer();
    return this.promise;
  }

  /**
   * Restarts the timer then increases the signalCount towards the capacity.
   * If the capacity is reached the waiters are released by calling 
   * the promise resolve(). 
   */
  signal() {
    this.restartTimer();
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
