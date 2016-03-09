'use strict';

const flow = require('../lib/flow.js');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('serial', () => {
    it('should execute functions in sequence', () => {
        var firstSpy = sinon.spy(next => {
            next(null, 'first');
        });
        var secondSpy = sinon.spy((data, next) => {
            next(null, data + ' data');
        });
        flow.serial([firstSpy, secondSpy], (err, data) => {
            expect(data === 'first data').to.be.true;
            expect(err).to.equal(null);
            expect(secondSpy.calledAfter(firstSpy)).to.be.true;
        });
    });
    it('should work on empty data', () => {
        flow.serial([], (err, data) => {
            expect(data).to.deep.equal([]);
            expect(err).to.equal(null);
        });
    });
    it('callback should be called once', () => {
        var firstSpy = sinon.spy(next => {
            next(null, 0);
        });
        var secondSpy = sinon.spy((data, next) => {
            next(null, data + 1);
        });
        var thirdSpy = sinon.spy((data, next) => {
            next(null, data + 1);
        });
        flow.serial([firstSpy, secondSpy, thirdSpy], (err, data) => {
            expect(data).to.equal(2);
            expect(err).to.be.null;
            expect(this).to.have.been.calledOnce;
        });
    });
    it('should call callback if error', () => {
        var firstSpy = sinon.spy(next => {
            next(true, 0);
        });
        var secondSpy = sinon.spy((data, next) => {
            next(null, data + 1);
        });
        flow.serial([firstSpy, secondSpy], (err, data) => {
            expect(err).to.be.true;
            expect(this).to.have.been.calledOnce;
            expect(secondSpy.notCalled).to.be.true;
        });
    });
});
describe('parallel', () => {
    it('should process the data in the correct order', () => {
        var firstSpy = sinon.spy(next => {
            next(null, 0);
        });
        var secondSpy = sinon.spy(next => {
            next(null, 1);
        });
        flow.parallel([firstSpy, secondSpy], (err, data) => {
            expect(data.length).to.equal(2);
            expect(err).to.be.null;
            expect(data[0]).to.equal(0);
            expect(data[1]).to.equal(1);
        });
    });
    it('should work on empty data', () => {
        flow.parallel([], (err, data) => {
            expect(data).to.deep.equal([]);
            expect(err).to.be.null;
        });
    });
    it('callback should be called once', () => {
        var firstSpy = sinon.spy(next => {
            next(null, 0);
        });
        var secondSpy = sinon.spy(next => {
            next(new Error('Error!'), 1);
        });
        var thirdSpy = sinon.spy(next => {
            next(null, 2);
        });
        flow.parallel([firstSpy, secondSpy, thirdSpy], (err, data) => {
            expect(err.message).to.equal('Error!');
            expect(this).to.have.been.calledOnce;
            expect(thirdSpy).to.have.been.calledOnce;
        });
    });
    it('should run all functions, if there are errors', () => {
        var firstSpy = sinon.spy(next => {
            next(new Error('Error!'), 0);
        });
        var secondSpy = sinon.spy(next => {
            next(new Error('Error!!'), 1);
        });
        var thirdSpy = sinon.spy(next => {
            next(null, 2);
        });
        flow.parallel([firstSpy, secondSpy, thirdSpy], (err, data) => {
            expect(err.message).to.equal('Error!');
            expect(this).to.have.been.calledOnce;
            expect(thirdSpy).to.have.been.calledOnce;
        });
    });
    it('should run all functions, if the limit is less than the number of functions', () => {
        var firstSpy = sinon.spy(next => {
            setTimeout(() => (next(null, 0)), 5000);
        });
        var secondSpy = sinon.spy(next => {
            setTimeout(() => (next(null, 1)), 1000);
        });
        var thirdSpy = sinon.spy(next => {
            setTimeout(() => (next(null, 2)), 500);
        });
        flow.parallel([firstSpy, secondSpy, thirdSpy], 2, (err, data) => {
            expect(data[0]).to.equal(0);
            expect(data[1]).to.equal(1);
            expect(data[2]).to.equal(2);
        });
    });
    it('should return [], if limit is equal 0', () => {
        var firstSpy = sinon.spy(next => {
            next(null, 0);
        });
        var secondSpy = sinon.spy(next => {
            next(null, 1);
        });
        var thirdSpy = sinon.spy(next => {
            next(null, 2);
        });
        flow.parallel([firstSpy, secondSpy, thirdSpy], 0, (err, data) => {
            expect(data).to.deep.equal([]);
            expect(err).to.be.null;
        });
    });
    it('should run all functions, if limit is greater than the number of functions', () => {
        var firstSpy = sinon.spy(next => {
            next(null, 0);
        });
        var secondSpy = sinon.spy(next => {
            next(null, 1);
        });
        var thirdSpy = sinon.spy(next => {
            next(null, 2);
        });
        flow.parallel([firstSpy, secondSpy, thirdSpy], 4, (err, data) => {
            expect(data).to.deep.equal([0, 1, 2]);
            expect(err).to.be.null;
        });
    });
});

describe('map', () => {
    it('should process the data in the correct order', () => {
        var spy = sinon.spy((data, next) => {
            next(null, data);
        });
        flow.map([0, 1, 2], spy, (err, data) => {
            expect(data.length).to.equal(3);
            expect(err).to.equal(null);
            expect(data[0]).to.equal(0);
            expect(data[1]).to.equal(1);
            expect(data[2]).to.equal(2);
        });
    });
    it('should work on empty data', () => {
        var spy = sinon.spy((data, next) => {
            next(null, data);
        });
        flow.map([], spy, (err, data) => {
            expect(data).to.deep.equal([]);
            expect(err).to.equal(null);
        });
    });
    it('callback should be called once', () => {
        var spy = sinon.spy((data, next) => {
            next(new Error('Error!'), data);
        });
        flow.map([0, 1, 2], spy, (err, data) => {
            expect(err.message).to.equal('Error!');
            expect(this).to.have.been.calledOnce;
        });
    });
    it('should process all the data', () => {
        var spy = sinon.spy((data, next) => {
            next(null, data);
        });
        flow.map([0, 1, 2], spy, (err, data) => {
            expect(data[0]).to.equal(0);
            expect(data[1]).to.equal(1);
            expect(data[2]).to.equal(2);
            expect(spy).to.have.been.calledThrice;
        });
    });
});

describe('makeAsync', () => {
    it('should correctly process the data', () => {
        var syncFunction = (a, b) => {
            return a + b;
        };
        var asynFunction = flow.makeAsync(syncFunction);
        asynFunction(1, 2, (err, data) => {
            expect(data).to.equal(3);
            expect(err).to.be.null;
        });
    });
    it('should run callback with error', () => {
        var syncFunction = (a, b) => {
            throw new Error('Error!');
        };
        var asynFunction = flow.makeAsync(syncFunction);
        asynFunction(1, 2, (err, data) => {
            expect(err.message).to.equal('Error!');
        });
    });
    it('should run functions in parallel', () => {
        var syncSum = (a, b) => {
            return a + b;
        };
        var syncSub = (a, b) => {
            return a - b;
        };
        var asynSum = flow.makeAsync(syncSum);
        var asynSub = flow.makeAsync(syncSub);
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
        });
    });
});
