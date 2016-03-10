'use strict';

const flow = require('../lib/flow.js');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('serial', () => {
    it('should execute functions in sequence', done => {
        var firstSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 'first');
        });
        var secondSpy = sinon.spy((data, next) => {
            setTimeout(next, 0, null, data + ' data');
        });
        flow.serial([firstSpy, secondSpy], (err, data) => {
            expect(data).to.be.equal('first data');
            expect(err).to.equal(null);
            expect(secondSpy.calledAfter(firstSpy)).to.be.true;
            done();
        });
    });
    it('should work on empty data', () => {
        flow.serial([], (err, data) => {
            expect(data).to.deep.equal([]);
            expect(err).to.equal(null);
        });
    });
    it('callback should be called once', done => {
        var firstSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 0);
        });
        var secondSpy = sinon.spy((data, next) => {
            setTimeout(next, 0, null, data + 1);
        });
        var thirdSpy = sinon.spy((data, next) => {
            setTimeout(next, 0, null, data + 2);
        });
        flow.serial([firstSpy, secondSpy, thirdSpy], (err, data) => {
            expect(data).to.equal(3);
            expect(err).to.be.null;
            expect(this).to.have.been.calledOnce;
            done();
        });
    });
    it('should call callback if error', done => {
        var firstSpy = sinon.spy(next => {
            setTimeout(next, 0, new Error('Error!'), 0);
        });
        var secondSpy = sinon.spy((data, next) => {
            setTimeout(next, 0, null, data + 1);
        });
        flow.serial([firstSpy, secondSpy], (err, data) => {
            expect(err.message).to.equal('Error!');
            expect(this).to.have.been.calledOnce;
            expect(secondSpy.notCalled).to.be.true;
            done();
        });
    });
});
describe('parallel', () => {
    it('should process the data in the correct order', done => {
        var firstSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 0);
        });
        var secondSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 1);
        });
        flow.parallel([firstSpy, secondSpy], (err, data) => {
            expect(data.length).to.equal(2);
            expect(err).to.be.null;
            expect(data[0]).to.equal(0);
            expect(data[1]).to.equal(1);
            done();
        });
    });
    it('should work on empty data', () => {
        flow.parallel([], (err, data) => {
            expect(data).to.deep.equal([]);
            expect(err).to.be.null;
        });
    });
    it('callback should be called once', done => {
        var firstSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 0);
        });
        var secondSpy = sinon.spy(next => {
            setTimeout(next, 0, new Error('Error!'), 1);
        });
        var thirdSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 2);
        });
        var callback = (err, data) => {
            expect(err.message).to.equal('Error!');
            expect(thirdSpy).to.have.been.calledOnce;
            expect(callback).to.have.been.calledOnce;
            done();
        };
        flow.parallel([firstSpy, secondSpy, thirdSpy], callback);
    });
    it('should run all functions, if there are errors', done => {
        var firstSpy = sinon.spy(next => {
            setTimeout(next, 0, new Error('Error!'), 0);
        });
        var secondSpy = sinon.spy(next => {
            setTimeout(next, 0, new Error('Error!!'), 1);
        });
        var thirdSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 2);
        });
        var callback = (err, data) => {
            expect(err.message).to.equal('Error!');
            expect(thirdSpy).to.have.been.calledOnce;
            expect(callback).to.have.been.calledOnce;
            done();
        };
        flow.parallel([firstSpy, secondSpy, thirdSpy], callback);
    });
    it('should run all functions, if the limit is less than the number of functions', done => {
        var firstSpy = sinon.spy(next => {
            setTimeout(next, 800, null, 0);
        });
        var secondSpy = sinon.spy(next => {
            setTimeout(next, 1000, null, 1);
        });
        var thirdSpy = sinon.spy(next => {
            setTimeout(next, 500, null, Date.now());
        });
        var startTime = Date.now();
        flow.parallel([firstSpy, secondSpy, thirdSpy], 2, (err, data) => {
            expect(data[0]).to.equal(0);
            expect(data[1]).to.equal(1);
            expect(data[2] - startTime).to.be.least(800);
            done();
        });
    });
    it('should return [], if limit is equal 0', done => {
        var firstSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 0);
        });
        var secondSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 1);
        });
        var thirdSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 2);
        });
        flow.parallel([firstSpy, secondSpy, thirdSpy], 0, (err, data) => {
            expect(data).to.deep.equal([]);
            expect(err).to.be.null;
            done();
        });
    });
    it('should run all functions, if limit is greater than the number of functions', done => {
        var firstSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 0);
        });
        var secondSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 1);
        });
        var thirdSpy = sinon.spy(next => {
            setTimeout(next, 0, null, 2);
        });
        flow.parallel([firstSpy, secondSpy, thirdSpy], 4, (err, data) => {
            expect(data).to.deep.equal([0, 1, 2]);
            expect(err).to.be.null;
            done();
        });
    });
});

describe('map', () => {
    it('should process the data in the correct order', done => {
        var spy = sinon.spy((data, next) => {
            setTimeout(next, 0, null, data);
        });
        flow.map([0, 1, 2], spy, (err, data) => {
            expect(data.length).to.equal(3);
            expect(err).to.equal(null);
            expect(data[0]).to.equal(0);
            expect(data[1]).to.equal(1);
            expect(data[2]).to.equal(2);
            done();
        });
    });
    it('should work on empty data', done => {
        var spy = sinon.spy((data, next) => {
            setTimeout(next, 0, null, data);
        });
        flow.map([], spy, (err, data) => {
            expect(data).to.deep.equal([]);
            expect(err).to.equal(null);
            done();
        });
    });
    it('callback should be called once', done => {
        var spy = sinon.spy((data, next) => {
            setTimeout(next, 0, new Error('Error!'), data);
        });
        var callback = (err, data) => {
            expect(err.message).to.equal('Error!');
            expect(callback).to.have.been.calledOnce;
            done();
        };
        flow.map([0, 1, 2], spy, callback);
    });
    it('should process all the data', done => {
        var spy = sinon.spy((data, next) => {
            setTimeout(next, 0, null, data);
        });
        flow.map([0, 1, 2], spy, (err, data) => {
            expect(data[0]).to.equal(0);
            expect(data[1]).to.equal(1);
            expect(data[2]).to.equal(2);
            expect(spy).to.have.been.calledThrice;
            done();
        });
    });
});

describe('makeAsync', () => {
    it('should correctly process the data', done => {
        var syncFunction = (a, b) => {
            return a + b;
        };
        var asynFunction = flow.makeAsync(syncFunction);
        asynFunction(1, 2, (err, data) => {
            expect(data).to.equal(3);
            expect(err).to.be.null;
            done();
        });
    });
    it('should run callback with error', done => {
        var syncFunction = (a, b) => {
            throw new Error('Error!');
        };
        var asynFunction = flow.makeAsync(syncFunction);
        asynFunction(1, 2, (err, data) => {
            expect(err.message).to.equal('Error!');
            done();
        });
    });
    it('should run functions in parallel', done => {
        var asynSum = flow.makeAsync((a, b) => {
            return a + b;
        });
        var asynSub = flow.makeAsync((a, b) => {
            return a - b;
        });
        var spySum = sinon.spy(next => {
            asynSum(1, 2, (err, data) => {
                next(null, data);
            });
        });
        var spySub = sinon.spy(next => {
            asynSub(2, 1, (err, data) => {
                next(null, data);
            });
        });
        flow.parallel([spySum, spySub], (err, data) => {
            expect(err).to.be.null;
            expect(data[0]).to.equal(3);
            expect(data[1]).to.equal(1);
            done();
        });
    });
});
