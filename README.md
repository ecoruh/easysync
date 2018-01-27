# easysync
Light weight synchronisation library for node.js

## class Semaphore
Use when you want to wait on events occurred specific number of times then resume execution.


 ```
     let workClosedSemaphore = new Semaphore(10);

    cluster.on('message') {
      workClosedSemaphore.signal();
    }

    doStuff.then(() => workClosedSemaphore.waitPromise())
    .then(() => {
      assert(workClosedSemaphore.signalCount === 10);
    });
```
