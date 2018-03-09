[![Build Status](https://travis-ci.org/ujc/wait-for-stuff.svg?branch=master)](https://travis-ci.org/ujc/wait-for-stuff)

# wait-for-stuff
An extendable library that can wait for stuff to happen in a synchronous-yet-non-blocking manner.  
Instead of waiting for **`async\await`**, you can now simply wait for the following "stuff":

* **time** *(wait for x seconds to pass)*
* **date** *(wait until `date` is reached)*
* **predicate** *(wait until `prediacte` returns true)*
* **event** *(wait until `event` emits)*
* **promise** *(wait for `promise` to settle)*
* **generator** *(wait for `generator` to fully exhaust all values)*
* **stream** *(wait until `readable-stream` is fully read)*
* **callback** *(wait for node-style `callback` to be called)*
* **function** *(wait for custom callback `function` to be called)*
* **yield** *(wait for a generator to `yield` a speific value)*
* **value** *(wait for `object.property` to equal `value`)*
* **property** *(wait for `object.property` to exist)*
* **array** *(wait for `array` to contain some value)*
* **compose** *(compose a new waiter from two or more existing waiters)*
* **result** *(wait for a chain of waitables to return a non-waitable result)*




---
## Table of Contents
1. [Why?](#why)
2. [Install](#install)
3. [How it works](#how-it-works)
4. [Built-in waiters](#built-in-waiters)
    1.  [`wait.for.time()`](#wait-for-time)
    2.  [`wait.for.date()`](#wait-for-date)
    3.  [`wait.for.event()`](#wait-for-event)
    4.  [`wait.for.predicate()`](#wait-for-predicate)
    5.  [`wait.for.promise()`](#wait-for-promise)
    6.  [`wait.for.generator()`](#wait-for-generator)
    7.  [`wait.for.stream()`](#wait-for-stream)
    8.  [`wait.for.callback()`](#wait-for-callback)
    9.  [`wait.for.function()`](#wait-for-function)
    10. [`wait.for.yield()`](#wait-for-yield)
    11. [`wait.for.value()`](#wait-for-value)
    12. [`wait.for.property()`](#wait-for-property)
    13. [`wait.for.array()`](#wait-for-array)
5. [Middleware](#middleware)
    1. [`wait.use()`](#wait-use)
    2. [`wait.alias()`](#wait-alias)
6. [Composition](#composition)
    1. [`wait.compose()`](#wait-compose)
    2. [`wait.for.result()`](#wait-for-result)
7. [Contribute](#contribute)
8. [Test](#test)
9. [Related](#related)



---
## <a id="why">[#](#why)</a> Why ?
Because I'm tired of waiting for `await\async`, and want this code to work  
*(without blocking node's event-loop)*:

```javascript
var fs   = require('fs');
var wait = require('wait-for-stuff');

var myFile   = fs.createReadStream('my.json');
var contents = wait.for.stream(myFile);

// the stream has now been fully read, async in the
// background while my code is still nice-and-pretty, without
// worrying about async-code-execution-flow design patterns
// and such

// feel free to do something with the file contents now
```
<br /><br />




## <a id="install">[#](#install)</a> Install
```
npm install wait-for-stuff
```
<br /><br />





## <a id="how-it-works">[#](#how-it-works)</a> How it works
Behind the scenes, `wait-for-stuff` uses [deasync](https://www.npmjs.com/package/deasync) to do it's magic.  
This basically means that you can write your code in a **linear, sequential manner** - while still allowing async operations to complete in the background on the same execution block.  
<br /><br /><br />





## <a id="built-in-waiters">[#](#built-in-waiters)</a> Built-in waiters
`wait-for-stuff` is designed to be *middleware-oriented* - which is just a fancy way of saying you can add your own "stuff" to "wait for" based on your own logic.  
That said, it also comes with the following built-in waiters:  
<br /><br /><br />




<a id="wait-for-time">[#](#wait-for-time)</a>
**`wait.for.time(seconds)`**  
Waits until `seconds` number of seconds pass

```javascript
wait.for.time(3);
// 3 seconds have now passed
```
<br /><br />




<a id="wait-for-date">[#](#wait-for-date)</a>
**`wait.for.date(futureDateObject)`**  
Waits until the system time passes the date of `futureDateObject`.

`futureDateObject` must be a `Date` object.  
If `futureDateObject` is configured as a date that has already passed, the waiting will simply end immediately.

```javascript
var theFuture = new Date( new Date().getTime() + 5000 );
wait.for.date(theFuture);
// we are now in the future (though just by 5 seconds, so no biggy)
```
<br /><br />





<a id="wait-for-event">[#](#wait-for-event)</a>
**`wait.for.event(emitter, eventName)`**  
Waits until `emitter` emits the `eventName` event.  
Returns the data that the event emitted (if any).

```javascript
var eventData = wait.for.event(myEmitter, 'someEvent');

// if the event was emitted with just a single data argument,
// <eventData> will get that value

// if the event was emitted with multiple data arguments,
// <eventData> will be an array with those data arguments
```
<br /><br />





<a id="wait-for-predicate">[#](#wait-for-predicate)</a>
**`wait.for.predicate(fn)`**  
Waits until the `predicate` function returns a truthy value.  
This is useful if you need a simple mechanism to wait on your own custom application logic

```javascript
var isDone = false;
setTimeout(() => isDone = true, 5000);

wait.for.predicate(() => isDone);
// [5 seconds later]: isDone is now true, execution continues
```
<br /><br />





<a id="wait-for-condition">[#](#wait-for-condition)</a>
**`wait.for.condition`**  
Same as `wait.for.predicate`.  
This is just a convenience alias in case you prefer to use the word "condition" instead of "predicate"  
<br /><br /><br />




<a id="wait-for-promise">[#](#wait-for-promise)</a>
**`wait.for.promise(promise)`**  
Waits until `promise` is settled (either resolved or rejected).  
Returns the value that the promise was settled with.

```javascript
var resultOrError = wait.for.promise(new Promise(...));
```
<br /><br />






<a id="wait-for-generator">[#](#wait-for-generator)</a>
**`wait.for.generator(generator)`**  
Waits until the `generator` has fully exhausted all of it's yielded values.  
Returns the value that the generator function returns.

`generator` can either be a generator-function, or an actuale iterable-generator
*(the result of a generator-function)*

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





<a id="wait-for-stream">[#](#wait-for-stream)</a>
**`wait.for.stream(readableStream)`**  
Waits until `readableStream` has been fully read (ended).  
Returns the data that was read from the stream  
*(either as `string` or `buffer`, based on what the stream emitted as it's chunks)*

```javascript
var myFile       = fs.createReadStream('someFile.json');
var fileContents = wait.for.stream(myFile);
// fileContents now contains the contents of someFile.json
```
<br /><br />





<a id="wait-for-callback">[#](#wait-for-callback)</a>
**`wait.for.callback(nodeAsyncFunction, ...params)`**  
Waits until the `nodeAsyncFunction` has finished, passing to it any `params` that you supply.  
Returns one or more values that the `callback` got as it's arguments.

If the callback got just a single value, that value will be returned by `wait.for.callback()` *(usually either an error object or actual data)*.  
If the callback got more than a single value, an array-of-values is returned by `wait.for.callback()`. This array-of-values filters out `null` and `undefined` values. The order of the items in the array is the order in which they were passed into the callback.  
Also, if the after filtering for `null` and `undefined` values the array only contains a single element, that element is returned directly *(instead of returning an array with just a single element in it)*.

**NOTE:** If you want to always get an array as the return value, use **[#](#wait-for-function) `wait.for.function()`**

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





<a id="wait-for-function">[#](#wait-for-function)</a>
**`wait.for.function(customAsyncFunction, ...params)`**  
Waits until the `customAsyncFunction` has finished, passing to it any `params` that you supply.

Unlike `wait.for.callback()`, any-and-all arguments that were passed into the function will be returned as the complete `resultSet` of the `customAsyncFunction`.

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






<a id="wait-for-yield">[#](#wait-for-yield)</a>
**`wait.for.yield(generator, value)`**  
Waits until the `generator` has yielded the specified `value`.

`generator` can either be a generator-function, or an actuale iterable-generator  
*(the result of a generator-function)*

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






<a id="wait-for-value">[#](#wait-for-value)</a>
**`wait.for.value(owner, property, valueToWaitFor)`**  
Waits until the `owner[property]` matches `valueToWaitFor`.

`property` must be a string  
`owner` must be an object

```javascript
var myObject = { foo: 'bar'};
setTimeout(() => myObject.foo = '123', 5000);

wait.for.value(myObject, 'foo', '123');
// [5 seconds later]: myObject.foo now equals '123'
```
<br /><br />






<a id="wait-for-property">[#](#wait-for-property)</a>
**`wait.for.property(owner, property)`**  
Waits until `owner` has a property named `property`

`property` must be a string  
`owner` must be an object

```javascript
var myObject = {};
setTimeout(() => myObject.foo = true, 5000);

wait.for.property(myObject, 'foo');
// [5 seconds later]: myObject now has a property named 'foo'
```
<br /><br />






<a id="wait-for-array">[#](#wait-for-array)</a>
**`wait.for.array(array, value)`**  
Waits until `array` contains `value`

```javascript
var myArray = [];
setTimeout(() => myArray.push('hello world'), 1000);

wait.for.array(myArray, 'hello world');
```
<br /><br />





---
## <a id="middleware">[#](#middleware)</a> Middleware
This library aims to provide atomic structures with the built-in waiters.  
From these, you can construct any custom waiter for anything additional that you may need in your application.

Once you've built your own waiter-middleware - *or installed third-party waiter-middleware* - you can add it to `wait-for-stuff` using the **`wait.use(name, middleware)`** api.  
<br /><br /><br />

<a id="wait-use">[#](#wait-use)</a>
**`wait.use(name, middleware)`**  
Adds `middleware` as a waiter that can be used with the general `wait.for...` API, under **`wait.for.<name>`**.

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


**NOTE:** You can also use this api to overwrite existing waiters with your own logic.  
While this is possible to do, it is not recommended.  
<br /><br /><br />


<a id="wait-alias">[#](#wait-alias)</a>
**`wait.alias(originalName, alias)`**  
Allows you to create an alias of your own liking to an existing waiter.  
For example, **`wait.for.condition()`** is just an alias to **`wait.for.predicate()`**.

```javascript
wait.alias('promise', 'syncPromise');
wait.for.syncPromise(myPromise);  // just an alias to "wait.for.promise()"
```
<br /><br />




---
## <a id="composition">[#](#composition)</a> Composition
You can `compose` an advanced waiter by combining the work of two or more waiters together.  
This is done using `wait.compose(waiter1, waiter2, ...waiterN)`.  
The result is a new waiter that passes the return value from one waiter to the next, until all waiters have completed.

<a id="wait-compose">[#](#wait-compose)</a>
**`wait.compose(waiter1, waiter2, ...waiterN)`**  
Composes a new waiter from the waiters that are passed in.  
Waiters are exhausted from right-to-left - just like you would expect from the functionl-programming `compose` function

```javascript
function myComplexFunction(path, callback){
    fs.exists(path, result => {
        var stream = fs.createReadStream(path);
        callback(stream);
    });
};

// first we create a composed waiter
// it will first expect the arguments that should be passed into >wait.for.callback.
// the result of wait.for.callback is then passed into wait.for.stream.
// the final result is what wait.for.stream will have returned
//
// in our case, myComplexFunction() expects a callback, which then gets >a stream
// composition allows us to wait on both 'waiters'
var streamAndCallbackWaiter = wait.compose('stream', 'callback');
var result                  = streamAndCallback(myComplexFunction, __filename); // arguments for wait.for.callback

// result is the return value from wait.for.stream
```
<br /><br />






<a id="wait-for-result">[#](#wait-for-result)</a>
**`wait.for.result(waitable))`**  
Waits until a chain of waitables return a non-waitable result.  
For example, if you need to wait on a promise that returns another promise that returns a stream - you can just wait for the result of the final stream using **`wait.for.result`**.  

**`waitable`** can be any of the following:
* Promise
* Generator *(or the iterator-result of a generaotr)*
* Stream

```javascript
// a promise that returns a promise that returns a stream
var myComplexPromise = new Promise((res, rej) => {
    setTimeout(() => {
        res(new Promise((res, rej) => {
            setTimeout(() => res(fs.createReadStream('someFile.json')), 500);
        }));
    }, 500);
});

var result = wait.for.result(myComplexPromise);
// result is now a buffer holding the contents of 'someFile.json'
```
<br /><br />






## <a id="contribute">[#](#contribute)</a> Contribute
I hope people will find this module helpful - either as an alternative to asynchronous flow-execution patterns such as `await\async` *(until it's official release at least)* - or as a supplement to go along with what ever you're all ready using.

If you create your own waiter-middlewares, please do share them with the community.  
If you would like to have your waiter middlware added as a built-in to `wait-for-stuff`, please send a PR *(please also make sure to include tests)*  
<br /><br /><br />




## <a id="test">[#](#test)</a> Test
```
npm run test
```
<br /><br />





## <a id="related">[#](#related)</a> Related
* [deasync](https://www.npmjs.com/package/deasync)

