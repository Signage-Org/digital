// @flow
/* eslint no-console: 0 */

import Rx from 'rxjs';

export function logMessage(stage: string, message: string, data: mixed) {
  console.log(
    JSON.stringify({
      type: 'message',
      stage,
      message,
      data,
    })
  );
}

export function logQueueLength(stage: string, length: number) {
  console.log(
    JSON.stringify({
      type: 'queue length',
      stage,
      length,
    })
  );
}

export function logNonfatalError(stage: string, err: Error, data?: mixed) {
  console.log(
    JSON.stringify({
      type: 'error',
      fatal: false,
      stage,
      error: `${err.toString()}`,
      data,
    })
  );
}

// Operator that waits for a promise to resolve or reject before continuing.
// Uses concatMap to keep strict ordering of Promises. Will push an error if a
// Promise rejects.
export function awaitPromise<T>(
  obs: Rx.Observable<Promise<T>>
): Rx.Observable<T> {
  return obs.concatMap((p: Promise<T>) => {
    return Rx.Observable.create(out => {
      p.then(
        v => {
          out.next(v);
          out.complete();
        },
        err => {
          out.error(err);
        }
      );
    });
  });
}

type ErrorStreamSummary = {|
  errorCount: number,
  lastError: ?Error,
|};

// Use with let to insert an fallback retry in an observable chain. The
// observable must run its operation when it's subscribed to for the retry to
// have any effect.
export function retryWithFallback<T>(
  maxRetries: number,
  retryDelay: number,
  callbacks: { error?: (error: Error) => mixed } = {}
): (Rx.Observable<T>) => Rx.Observable<T> {
  // retryWhen will re-subscribe to the observable we've been attached to.
  return retryableStream =>
    retryableStream.retryWhen(errorStream =>
      errorStream
        // We use scan to maintain a count of how many errors have already
        // happened, since retryWhen gives an observable stream of all errors
        // the original observable threw. We save the lastError so we can report
        // and throw it.
        .scan(
          ({ errorCount }: ErrorStreamSummary, error) => ({
            errorCount: errorCount + 1,
            lastError: error,
          }),
          {
            errorCount: 0,
            lastError: null,
          }
        )
        .switchMap(({ errorCount, lastError }: ErrorStreamSummary) => {
          if (errorCount > maxRetries) {
            // Sending an error down the errorStream will terminate retryWhen's
            // retrying.
            return Rx.Observable.throw(lastError);
          } else {
            // Lets us report transient errors to the stage, even though they're
            // being retried.
            if (callbacks.error && lastError) {
              callbacks.error(lastError);
            }

            // We delay sending a value to errorStream so that retryWhen waits
            // with a backoff before re-subscribing. Squaring the errorCount
            // causes an exponential backoff: e.g. 5s, 10s, 20s.
            return Rx.Observable.timer(retryDelay * (2 ^ (errorCount - 1)));
          }
        })
    );
}

// Operator that institutes a one-at-a-time queue into the observable stream.
// Pass it an operator to apply to
//
// Reports the length of the queue.
//
// This operator does not cause the observable it modifies to error, since that
// would terminate any persistent loops going on, but instead calls its error
// callback and pushes an Empty to stop the observable stream.
export function queue<T, U>(
  operator: (Rx.Observable<T>) => Rx.Observable<U>,
  callbacks: {
    length?: number => mixed,
    error?: (Error, T) => mixed,
  } = {}
): (Rx.Observable<T>) => Rx.Observable<U> {
  let queueLength = 0;

  return observable =>
    observable
      // This handler will get called on every observed value as fast as they
      // come in, so we use it to keep track of the current queue length in
      // concatMap.
      .do(() => {
        queueLength++;

        if (callbacks.length) {
          callbacks.length(queueLength);
        }
      })
      // concatMap queues values (WARNING: it has no limit to its queue, so we
      // have no backpressure) and waits for each observable to complete before
      // running the next one, which effectively pipelines our input operator.
      .concatMap((val: T) =>
        // We make a new observable for the value off the queue,
        Rx.Observable
          .of(val)
          .let(operator)
          // We always catch at the end of this chain because errors will bubble
          // back into concatMap, cancelling any values currently in its queue.
          .catch((error: Error) => {
            if (callbacks.error) {
              callbacks.error(error, val);
            }

            // This allows the complete operator below to run, decrementing our
            // queue length.
            return Rx.Observable.empty();
          })
          .do({
            complete: () => {
              queueLength--;

              if (callbacks.length) {
                callbacks.length(queueLength);
              }
            },
          })
      );
}
