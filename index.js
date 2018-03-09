///////////////////////////////////////////////////////////
// wait-for-stuff                                        //
///////////////////////////////////////////////////////////
// an extendable library that can wait for stuff to happen
// in a synchronous-but-not-blocking manner
//
// by default, wait-for-stuff provides waiters for time,
// promises, predicates, value-maps, finite-generators, and
// callbacks
//
// additional waiters can be added by means of "middleware"
// so that you can either use existing one (like from npm
// etc) or create new ones yourself
///////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////
// dependencies                                          //
///////////////////////////////////////////////////////////
var deasync      = require('deasync');
var stream       = require('stream');
var EventEmitter = require('events').EventEmitter;
///////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////
// module globals                                        //
///////////////////////////////////////////////////////////
var $waiters = [];
///////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////
// the main wait-for-stuff object                        //
///////////////////////////////////////////////////////////
// this is the final wait-for-stuff object that you get
// when you require the module
//
// notice that even the built-in modules are actually added
// by using the extend-with-middleware ".use(..)" APi
///////////////////////////////////////////////////////////
var $wait = {
    for: {}, // namespace for all the waiter-middleware

    use: function use(...args) {
        var name, waiterMiddleware;

        if (args.length === 1 && typeof args[0] === 'function' && args[0].name){
            name             = args[0].name;
            waiterMiddleware = args[0];
        }

        if (args.length === 2 && typeof args[0] === 'string' && args[0].length > 0 && typeof args[1] === 'function'){
            name             = args[0];
            waiterMiddleware = args[1];
        }

        if (args.length === 1 && typeof args[0] === 'object' && typeof args[0].name === 'string' && args[0].length > 1 && typeof args[0].fn === 'function'){
            name             = args[0].name;
            waiterMiddleware = args[0].fn;
        }

        if (!name || !waiterMiddleware){
            throw new Error('<wait-for-stuff>.use(..) :: invalid arguments');
        }

        this.for[name] = waiterMiddleware;
    },

    alias: function alias(originalName, alias) {
        if (this.for[originalName]){
            this.for[alias] = this.for[originalName];
        }
    },

    compose: function compose(...waiters){
        waiters.reverse();

        // first, let's make sure that all the requested waiters really exist,
        // otherwise the user might get bad side-effects
        waiters.forEach(waiter => {
            if (typeof this.for[waiter] !== 'function'){
                throw new Error(`wait.compose() :: cannot compose unknown waiter "${waiter}"`);
            }
        });

        // the composed function simply passes the result from each waiter to the next,
        // and once all waiters have completed we extract the final return value and return that
        return function(...args){
            var result = args;

            waiters.forEach(waiter => {
                result = [$wait.for[waiter].apply(null, result)];
            });

            return result[0];
        }
    }
};
///////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////
// built-in waiters                                      //
///////////////////////////////////////////////////////////
// the following are the built-in waiters that come with
// the wait-for-stuff module
//
// each of these are added to the main $wait module by
// calling the ".use(waiter-middleware)" api of the main
// wait-for-stuff object ($wait)
//
// see README.md for more info on each of these waiters
///////////////////////////////////////////////////////////
$wait.use('time', seconds => {
    if (typeof seconds !== 'number') {
        throw new Error('wait.for.time(..) :: invalid <seconds> argument ' + seconds);
    }

    var isDone   = false;
    var start    = new Date().getTime();
    var msToWait = seconds * 1000;

    var interval = setInterval(() => {
        var now   = new Date().getTime();
        var delta = now - start;

        if (delta >= msToWait){
            clearInterval(interval);
            isDone = true;
        }
    }, 25);

    deasync.loopWhile(() => !isDone);
});

$wait.use('promise', promise => {
    if (!(promise instanceof Promise)){
        throw new Error('wait.for.promise(..) :: invalid <promise> argument ' + promise);
    }

    var isDone = false;
    var result = null;

    promise
        .then(value => { result = value; isDone = true })
        .catch(err  => { result = err;   isDone = true });

    deasync.loopWhile(() => !isDone);
    return result;
});

$wait.use('predicate', predicate => {
    if (typeof predicate !== 'function'){
        throw new Error('wait.for.predicate(..) :: invalid <promise> argument ' + predicate);
    }

    var isDone = false;

    deasync.loopWhile(() => {
        if (isDone){
            return false;
        }

        isDone = predicate();
        return !isDone;
    });
});

$wait.use('value', (owner, propertyName, valueToWaitFor) => {
    if (typeof owner !== 'object'){
        throw new Error('wait.for.value(..) :: invalid <owner> argument ' + owner);
    }

    if (typeof propertyName !== 'string'){
        throw new Error('wait.for.value(..) :: invalid <propertyName> argument ' + propertyName);
    }

    deasync.loopWhile(() => owner[propertyName] !== valueToWaitFor);
});

$wait.use('property', (owner, property) => {
    if (typeof owner !== 'object'){
        throw new Error('wait.for.property(..) :: invalid <owner> argument ' + owner);
    }

    if (typeof property !== 'string'){
        throw new Error('wait.for.property(..) :: invalid <property> argument ' + property);
    }

    deasync.loopWhile(() => (property in owner) === false);
});

$wait.use('event', (emitter, eventName) => {
    if (typeof emitter.on !== 'function' && typeof emitter.emit !== 'function'){
        throw new Error('wait.for.event(..) :: invalid <emitter> argument ' + emitter);
    }

    if (typeof eventName !== 'string'){
        throw new Error('wait.for.event(..) :: invalid <eventName> argument ' + eventName);
    }

    var isDone    = false;
    var eventData = null;

    emitter.on(eventName, (...args) => {
        eventData = args;
        isDone    = true;
    });

    deasync.loopWhile(() => !isDone);
    return eventData.length === 1 ? eventData[0] : eventData;
});

$wait.use('date', date => {
    if (!(date instanceof Date)){
        throw new Error('wait.for.date(..) :: invalid <date> argument ' + date);
    }

    deasync.loopWhile(() => new Date().getTime() < date.getTime() );
});

$wait.use('stream', readableStream => {
    if (!(readableStream instanceof stream.Readable)){
        throw new Error('wait.for.stream(..) :: invalid <readableStream> argument ' + readableStream);
    }

    var isDone = false;
    var data   = [];

    readableStream.on('data', chunk => data.push(chunk));
    readableStream.on('end', ()     => isDone = true   );

    deasync.loopWhile(() => !isDone);

    if (data[0] instanceof Buffer){
        data = Buffer.concat(data);
    }

    if (typeof data[0] === 'string'){
        data = data.join('');
    }

    return data;
});

$wait.use('yield', (generator, value) => {
    var nextValue = null;
    var isDone    = false;

    if (generator.constructor.name === 'GeneratorFunction') {
        generator = generator();
    }

    if (typeof generator.next !== 'function'){
        throw new Error('wait.for.yield(..) :: invalid <generator> argument ' + generator);
    }

    deasync.loopWhile(() => {
        if (nextValue === value) {
            isDone = true;
        }

        if (isDone){
            return false;
        }
        else {
            nextValue = generator.next().value;
            return true;
        }
    });

    return nextValue;
});

$wait.use('generator', generator => {
    var nextValue = null;

    if (generator.constructor.name === 'GeneratorFunction') {
        generator = generator();
    }

    if (typeof generator.next !== 'function'){
        throw new Error('wait.for.generator(..) :: invalid <generator> argument ' + generator);
    }

    deasync.loopWhile(() => {
        nextValue = generator.next();
        return !nextValue.done;
    });

    return nextValue.value;
});

$wait.use('callback', (nodeAsyncFunction, ...args) => {
    if (typeof nodeAsyncFunction !== 'function'){
        throw new Error('wait.for.callback(..) :: invalid <nodeAsyncFunction> argument ' + nodeAsyncFunction);
    }

    var isDone = false;
    var result = null;

    nodeAsyncFunction(...args, (...resultSet) => {
        result = resultSet.filter(r => r !== null && r !== undefined);
        isDone = true;
    });

    deasync.loopWhile(() => !isDone);
    return result.length > 1 ? result : result[0]
});

$wait.use('function', (customAsyncFunction, ...args) => {
    if (typeof customAsyncFunction !== 'function'){
        throw new Error('wait.for.function(..) :: invalid <customAsyncFunction> argument ' + customAsyncFunction);
    }

    var isDone = false;
    var result = null;

    customAsyncFunction(...args, (...resultSet) => {
        result = resultSet;
        isDone = true;
    });

    deasync.loopWhile(() => !isDone);
    return result;
});

$wait.use('array', (array, value) => {
    if (!(array instanceof Array)){
        throw new Error('wait.for.array(..) :: invalid <array> argument ' + array);
    }

    deasync.loopWhile(() => !array.includes(value));
});

$wait.use('result', waitable => {

    // Promise
    if (waitable instanceof Promise){
        return $wait.for.result( $wait.for.promise(waitable) )
    }

    // GeneratorFunction
    if (waitable.constructor.name === 'GeneratorFunction') {
        return $wait.for.result( $wait.for.generator(waitable) )
    }

    // Iterable
    if (typeof waitable.next === 'function') {
        return $wait.for.result( $wait.for.generator(waitable) )
    }

    // Stream
    if (waitable instanceof stream.Readable){
        return $wait.for.result( $wait.for.stream(waitable) )
    }

    // non-identifiable waitable
    return waitable;
});

// as a convenience, we add 'condition' as an alias to 'predicate'
$wait.alias('predicate', 'condition');
///////////////////////////////////////////////////////////



module.exports = $wait;