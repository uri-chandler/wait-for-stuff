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
var deasync = require('deasync');
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
    }
};
///////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////
// built-in waiters                                      //
///////////////////////////////////////////////////////////
// the following are the built-in waiters that come with
// the wait-for-stuff module
//
// - time           (wait x seconds)
// - date           (wait for some future date)
// - promise        (wait for promise to settle)
// - predicate      (wait for predicate function to return true)
// - value          (wait for value to match)
// - property       (wait for property to exist)
// - event          (wait for event to be emitted)
// - stream         (wait for a readable stream to end)
//
// * generator      (coming soon)
// * callback       (coming soon)
//
// each of these are added to the main $wait module by
// calling the ".use(waiter-middleware)" api of the main
// wait-for-stuff object ($wait)
//
// see README.md for more info on each of these waiters
///////////////////////////////////////////////////////////
$wait.use('time', seconds => {
    if (typeof seconds !== 'number') {
        throw new Error('<wait-for-sync>.for.time(..) :: invalid <seconds> argument' + seconds);
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
    return;
});

$wait.use('promise', promise => {
    var isDone = false;
    var result = null;

    promise
        .then(value => { result = value; isDone = true })
        .catch(err  => { result = err;   isDone = true });

    deasync.loopWhile(() => !isDone);
    return result;
});

$wait.use('predicate', predicate => {
    deasync.loopWhile(() => !predicate());
    return;
});

$wait.use('value', (owner, propertyName, valueToWaitFor) => {
    deasync.loopWhile(() => owner[propertyName] !== valueToWaitFor);
    return;
});

$wait.use('property', (owner, property) => {
    deasync.loopWhile(() => (property in owner) === false);
    return;
});

$wait.use('event', (emitter, eventName) => {
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
    deasync.loopWhile(() => new Date().getTime() < date.getTime() );
    return;
});

$wait.use('stream', readableStream => {
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


// as a convenience, we add 'condition' as an alias to 'predicate'
$wait.alias('predicate', 'condition');
///////////////////////////////////////////////////////////



module.exports = $wait;