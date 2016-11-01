[![Build Status](https://travis-ci.org/ujc/wait-for-stuff.svg?branch=master)](https://travis-ci.org/ujc/wait-for-stuff)

# wait-for-stuff
An extendable library that can wait for stuff to happen in a synchronous-yet-non-blocking manner.  
Instead of waiting for **`async\await`**, you can now simply wait for the following "stuff":

* **time** *(wait for x seconds to pass)*
* **date** *(wait until `date` is reached)*
* **event** *(wait until `event` emits)*
* **predicate** *(wait until `prediacte` returns true)*
* **promise** *(wait for `promise` to settle)*
* **stream** *(wait until `readable-stream` is fully read)*
* **value** *(wait for `object.property` to equal `value`)*
* **property** *(wait for `object.property` to exist)*
* **yield** *(wait for a generator to `yield` a speific value)*
* **generator** *(wait for `generator` to fully exhaust all values)*
* **callback** *(wait for node-style `callback` to be called)*
* **function** *(wait for custom callback `function` to be called)*
* **array** *(wait for `array` to contain some value)*
* **compose** *(compose a new waiter from two or more existing waiters)*
* *(chainable \ follow-through waiters are coming soon)*


---
## Table of Contents
* [Why?](#why)
* [Install](#install)
* [How it works](#how-it-works)
* [Built-in waiters](#built-in-waiters)
  * [`wait.for.time`](#wait-for-time)

---
## <a id="why">#</a> Why ?
Because I'm tired of waiting for `await\async`, and want this code to work  
*(without blocking node's event-loop)*:

```javascript
var fs     = require('fs');
var wait   = require('wait-for-stuff');
var myFile = fs.createReadStream('my.json');

var fileContents = wait.for.stream(myFile);
// the stream has now been fully read, async in the
// background while my code is still nice-and-pretty, without
// worrying about async-code-execution-flow design patterns
// and such

// feel free to do something with the file contents now
```


---
## <a id="install">#</a> Install
```
npm install wait-for-stuff
```


---
## <a id="how-it-works">#</a> How it works
Behind the scenes, `wait-for-stuff` uses [deasync](https://www.npmjs.com/package/deasync) to do it's magic.  
This basically means that you can **write your code in a linear, sequential manner - while still allowing async operations to complete in the background on the same execution block**.


---
## <a id="built-in-waiters">#</a> Built-in waiters
`wait-for-stuff` is designed to be *middleware-oriented* - which is just a fancy way of saying you can add your own "stuff" to "wait for" based on your own logic.  
That said, it also comes with the following built-in waiters:

<a id="wait-for-time">[#](#wait-for-time)</a>
**`wait.for.time(seconds)`**  
Waits until `seconds` number of seconds pass

```javascript
wait.for.time(3);
// 3 seconds have now passed
```
<br /><br />


**`wait.for.promise(promise)`**  
waits until `promise` is settled (either resolved or rejected).  
Returns the value that the promise was settled with.

```javascript
var resultOrError = wait.for.promise(new Promise(...));
```
<br /><br />


**`wait.for.predicate(fn)`** waits until the `predicate` function returns a truthy value. this is useful if you need a simple mechanism to wait on your own custom application logic

```javascript
var isDone = false;
setTimeout(() => isDone = true, 5000);

wait.for.predicate(() => isDone);
// [5 seconds later]: isDone is now true, execution continues
```
<br /><br />
**`wait.for.condition`** same as `wait.for.predicate`. this is just a convenience alias in case you prefer to use the word "condition" instead of "predicate"
<br /><br />


**`wait.for.value(owner, property, valueToWaitFor)`** waits until the `owner[property]` matches `valueToWaitFor`.

`property` must be a string.

`owner` must be an object

```javascript
var myObject = { foo: 'bar'};
setTimeout(() => myObject.foo = '123', 5000);

wait.for.value(myObject, 'foo', '123');
// [5 seconds later]: myObject.foo now equals '123'
```
<br /><br />



**`wait.for.property(owner, property)`** waits until `owner` has a property named `property`

`property` must be a string.

`owner` must be an object

```javascript
var myObject = {};
setTimeout(() => myObject.foo = true, 5000);

wait.for.property(myObject, 'foo');
// [5 seconds later]: myObject now has a property named 'foo'
```
<br /><br />


**`wait.for.event(emitter, eventName)`** waits until `emitter` emits the `eventName` event. returns the data that the event emitted (if any).

```javascript
var eventData = wait.for.event(myEmitter, 'someEvent');
// if the event was emitted with just a single data argument,
// <eventData> will get that value

// if the event was emitted with multiple data arguments,
// <eventData> will be an array with those data arguments
```
<br /><br />



**`wait.for.date(futureDateObject)`** waits until the system time passes the date of `futureDateObject`.

`futureDateObject` must be a `Date` object. if `futureDateObject` is configured as a date that has already passed the waiting will simply end immediately.

```javascript
var theFuture = new Date( new Date().getTime() + 5000 );
wait.for.date(theFuture);
// we are now in the future (though just by 5 seconds, so no biggy)
```
<br /><br />


**`wait.for.stream(readableStream)`** waits until `readableStream` has been fully read (ended). returns the data that was read from the stream (either as `string` or `buffer`, based on what the stream emitted as it's chunks)

```javascript
var myFile       = fs.createReadStream('someFile.json');
var fileContents = wait.for.stream(myFile);
// fileContents now contains the contents of someFile.json
```
<br /><br />




**`wait.for.yield(generator, value)`** waits until the `generator` has yielded the specified `value`.

`generator` can either be a generator-function, or an actuale iterable-generator *(the result of a generator-function)*

```javascript
function* myGeneratorFunction(){
    count = 0;
    while (true) { yield ++count }
}

wait.for.yield(myGeneratorFunction, 5);
// count is now 5


//////////////////////////////////////////////////////
// alternative (pass in the actual iterable-generator)
function* myGeneratorFunction(){
    count = 0;
    while (true) { yield ++count }
}

var iterable = myGeneratorFunction();

wait.for.yield(iterable, 5);
```
<br /><br />




**`wait.for.generator(generator)`** waits until the `generator` has fully exhausted all of it's yielded values. returns the value that the generator function returns.

`generator` can either be a generator-function, or an actuale iterable-generator *(the result of a generator-function)*

```javascript
function* myGeneratorFunction(){
    count = 0;
    while (count < 10) { yield ++count }
    return 'complete!';
}

var result = wait.for.generator(myGeneratorFunction);
// result === 'complete!'


//////////////////////////////////////////////////////
// alternative (pass in the actual iterable-generator)
function* myGeneratorFunction(){
    count = 0;
    while (count < 10) { yield ++count }
    return 'complete!';
}

var iterable = myGeneratorFunction();
var result   = wait.for.generator(iterable);
// result === 'complete!'
```
<br /><br />



**`wait.for.callback(nodeAsyncFunction, ...params)`** waits until the `nodeAsyncFunction` has finished, passing to it any `params` that you supply.

**note:** with node-style callbacks, there's usually an `error` as the first argument, and any possible `data` argument comes after that. either of these might will be null if the other isn't, and there can be more than one `data` argument. `wait.for.callback` will make an attempt to simplify the result value when possible.

**see also:** **`wait.for.function`** *(below)*

```javascript
// instead of this:
// -----------------------------------------------
// fs.readFile('foo.json', function(err, data){
//     do something with err or data
// });
// -----------------------------------------------

var errOrData = wait.for.callback(fs.readFile, 'foo.json');


///////////////////////////////////////////////////////
// or, if unlike fs.readFile, the function may pass
// more than just "err" or "data":

// instead of this:
// moreComplexFunc('foo.json', function(err, data1, data2, data3){
//     do something with err, or data1 + data2 + data3
// });

var errOrResultSet = wait.for.callback(moreComplexFunc, 'foo.json');

// errOrResultSet will either be 'err',
// or an array containing [data1, data2, data3] in order
```
<br /><br />




**`wait.for.function(customAsyncFunction, ...params)`** waits until the `customAsyncFunction` has finished, passing to it any `params` that you supply.

unlike `wait.for.callback`, any arguments that were passed into the callback will be returned as the complete `resultSet` of the `customAsyncFunction`

```javascript
// instead of this:
// -----------------------------------------------
// fs.readFile('foo.json', function(err, data){
//     do something with err or data
// });
// -----------------------------------------------

var resultSet = wait.for.function(fs.readFile, 'foo.json');

// resultSet is an array of [err, data] in order
```
<br /><br />




**`wait.for.array(array, value)`** waits until `array` contains `value`

```javascript
var myArray = [];
setTimeout(() => myArray.push('hello world'), 1000);

wait.for.array(myArray, 'hello world');
```
<br /><br />



---
## Middleware
this library tries to provide atomic structures with the built-in waiters. from these basic waiters, you should be able to construct any custom waiter for anything you can think of *(and I sure hope you will).*

once you've built your own waiter-middleware, you can add it to `wait-for-stuff` using the **`wait.use(name, middleware)`** api.

**`wait.use(name, middleware)`** adds `middleware` as an additional waiter to `wait-for-stuff` under **`wait.for.<name>`**.

```javascript
var wait = require('wait-for-stuff');

wait.use('minutes', minutes => {
    wait.for.seconds(minutes * 60);
    return;
});


// later on in your code, when you need to wait for X minutes
// to pass - which totally makes sense in node applications (;
wait.for.minutes(2);
// [2 minutes later]: code execution continues
```
<br /><br />

**note** you can also use this api to overwrite existing waiters with your own logic. while this is not recommended, it is possible.



**`wait.alias(originalName, alias)`** allows you to create an alias of your own liking to some waiter. for example, the built-in **`wait.for.condition`** waiter is just an alias to **`wait.for.predicate`**.




---
## Composition
you can compose your own "complex" waiter by combining the work of two or more waiters.
this is done by calling `wait.compose(waiter1, waiter2, ...waiterN)`. the result is a new waiter that passes
the return value from each waiter to the next, until all waiters have completed.

**`wait.compose(waiter1, waiter2, ...waiterN)`** composes a new waiter from the waiters that are passed in.
waiters are exhausted from right-to-left - just like you would expect from the functionl-programming `compose` function

```javascript
function myComplexFunction(path, callback){
    fs.exists(path, result => {
        var stream = fs.createReadStream(path);
        callback(stream);
    });
};

// first we create a composed waiter
// it will first expect the arguments that should be passed into wait.for.callback.
// the result of wait.for.callback is then passed into wait.for.stream.
// the final result is what wait.for.stream will have returned
//
// in our case, myComplexFunction() expects a callback, which then gets a stream
// composition allows us to wait on both 'waiters'
var streamAndCallbackWaiter = wait.compose('stream', 'callback');
var result                  = streamAndCallback(myComplexFunction, __filename); // arguments for wait.for.callback

// result is the return value from wait.for.stream
result.toString().should.include('extension: compose');
```
<br /><br />





--
## Contribute
I hope many people will find this module helpful - either as an alternative to asynchronous flow-execution patterns such as await\async (while we wait) etc.. - or as a supplement to go along with what ever you're allready using.

If you create your own waiter middlewares, please do share them with the community.

If you would like to have your waiter middlware added as a built-in to `wait-for-stuff`, please send me PR (please also make sure to include tests)



---
## Test
```
npm run test
```
<br /><br />


---
## Related
* [deasync](https://www.npmjs.com/package/deasync)

