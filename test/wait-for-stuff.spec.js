var EventEmitter = require('events').EventEmitter;
var fs           = require('fs');
var should       = require('chai').should();
var wait         = require('../index.js');



describe('wait-for-stuff', function(){
    this.timeout(10000);

    it('waits-for: time', () => {
        var isDone = false;

        setTimeout(() => isDone=true, 1000);
        wait.for.time(1.1);

        isDone.should.be.true;
    });

    it('waits-for: promise.resolve', () => {
        var myPromise = new Promise(resolve => {
            setTimeout(() => resolve(123), 1000);
        });

        var promiseResult = wait.for.promise(myPromise);
        promiseResult.should.equal(123);
    });

    it('waits-for: promise.reject', () => {
        var myPromise = new Promise((resolve, reject) => {
            setTimeout(() => reject('boo'), 1000);
        });

        var promiseResult = wait.for.promise(myPromise);
        promiseResult.should.equal('boo');
    });

    it('waits-for: predicate', () => {
        var now = new Date().getTime();
        var didOneSecondPass = () => (new Date().getTime() - now) >= 1000;

        wait.for.predicate(didOneSecondPass);
        didOneSecondPass().should.be.true;
    });

    it('waits-for: condition (predicate alias)', () => {
        var now = new Date().getTime();
        var didOneSecondPass = () => (new Date().getTime() - now) >= 1000;

        wait.for.predicate(didOneSecondPass);
        didOneSecondPass().should.be.true;
    });

    it('waits-for: value', () => {
        var myObject = { foo: 'bar' };

        setTimeout(() => myObject.foo = 'baz', 1000);
        wait.for.value(myObject, 'foo', 'baz');

        myObject.foo.should.equal('baz');
    });

    it('waits-for: property', () => {
        var myObject = {};

        setTimeout(() => myObject.foo = 'bar', 1000);
        wait.for.property(myObject, 'foo');

        should.exist(myObject.foo);
    });

    it('waits-for: event (single event data)', () => {
        var myEmitter = new EventEmitter();

        setTimeout(() => myEmitter.emit('foo', 'bar'), 1000);

        var eventData = wait.for.event(myEmitter, 'foo');
        eventData.should.equal('bar');
    });

    it('waits-for: event (mulltiple event data)', () => {
        var myEmitter = new EventEmitter();

        setTimeout(() => myEmitter.emit('foo', 'bar', 'baz'), 1000);

        var eventData = wait.for.event(myEmitter, 'foo');
        eventData[0].should.equal('bar');
        eventData[1].should.equal('baz');
    });

    it('waits-for: date', () => {
        var futureDate = new Date( new Date().getTime() + 1000 );
        wait.for.date(futureDate);

        var newNow = new Date().getTime();
        var delta  = newNow - futureDate;
        delta.should.be.below(100);
    });

    it('waits-for: stream', () => {
        var readableStream = fs.createReadStream(__filename);
        var buffer         = wait.for.stream(readableStream);

        buffer.toString().should.match(/wait-for-stuff/);
    });

    it('waits-for: yield', () => {
        var count = 0;

        function* myGenerator(){
            while (true) { yield ++count }
        }

        wait.for.yield(myGenerator, 3);
        count.should.equal(3);
    });

    it('waits-for: generator', () => {
        function* myGenerator(){
            var count;
            while (count++ < 5) { yield count }
            return 'foo';
        }

        var value = wait.for.generator(myGenerator);
        value.should.equal('foo');
    });

    it('waits-for: generator (as iterable)', () => {
        function* myGenerator(){
            var count;
            while (count++ < 5) { yield count }
            return 'foo';
        }

        var iterable = myGenerator();
        var value    = wait.for.generator(iterable);
        value.should.equal('foo');
    });

    it('waits-for: callback', () => {
        var result = wait.for.callback(fs.readFile, __filename);
        result.toString().should.include('waits-for: callback');
    });

    it('waits-for: function', () => {
        var resultSet = wait.for.function(fs.readFile, __filename);
        var error     = resultSet[0];
        var buffer    = resultSet[1];

        should.not.exist(error);
        buffer.toString().should.include('waits-for: function');
    });

    it('waits-for: array', () => {
        var myArray = [];
        setTimeout(() => myArray.push('hello world'), 1000);
        wait.for.array(myArray, 'hello world');
        myArray.should.contain('hello world');
    });

    it('waits-for: result', () => {
        // a promise that returns a promise that returns a stream
        var myComplexPromise = new Promise((res, rej) => {
            setTimeout(() => {
                res(new Promise((res, rej) => {
                    setTimeout(() => res(fs.createReadStream(__filename)), 500);
                }));
            }, 500);
        });

        var result = wait.for.result(myComplexPromise);
        result.toString().should.contain('waits-for: result');
    });

    it('extension: middleware', () => {
        wait.use('twoSeconds', () => {
            wait.for.time(2);
        });

        wait.for.twoSeconds.should.be.a('function');

        var start = new Date().getTime();
        wait.for.twoSeconds();
        var end = new Date().getTime();

        (end - start).should.be.above(1999);
    });

    it('extension: alias', () => {-
        wait.alias('time', 'anotherTime');
        wait.for.anotherTime.should.equal(wait.for.time);
    });

    it('extension: compose', () => {
        function myComplexFunction(path, callback){
            fs.exists(path, result => {
                var stream = fs.createReadStream(path);
                callback(stream);
            });
        };

        var streamAndCallback = wait.compose('stream', 'callback');
        var result            = streamAndCallback(myComplexFunction, __filename);

        result.toString().should.include('extension: compose');
    });
});