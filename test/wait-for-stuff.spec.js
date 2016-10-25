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
});