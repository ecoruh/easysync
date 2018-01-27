const sinon = require('sinon');
const Semaphore = require('../semaphoreClass');

describe('semaphore test', () => {
  it('should not wait if signalled sufficiently', (done) => {
    const clock = sinon.useFakeTimers();
    const semaphore = new Semaphore(1, 1000);
    semaphore.waitPromise()
      .then(() => {
        clock.restore();
        done();
      });
    semaphore.signal();
  });

  it('should not wait if signalled already', (done) => {
    const clock = sinon.useFakeTimers();
    const semaphore = new Semaphore(1, 1000);
    semaphore.signal();
    semaphore.waitPromise()
      .then(() => {
        clock.restore();
        done();
      });
  });

  it('should not wait on all waits if signalled sufficiently', (done) => {
    const clock = sinon.useFakeTimers();
    const semaphore = new Semaphore(3, 1000);
    semaphore.waitPromise()
      .then(() => semaphore.waitPromise())
      .then(() => {
        clock.restore();
        done();
      });
    semaphore.signal();
    semaphore.signal();
    semaphore.signal();
  });


  it('should timeout if not signalled', (done) => {
    const clock = sinon.useFakeTimers();
    const semaphore = new Semaphore(1, 1000);
    semaphore.waitPromise()
      .then(() => {
        clock.restore();
        done();
      });
    clock.next();
  });

});
