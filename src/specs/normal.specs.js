"use strict";
/**
 * Mocha/Chai test specs for individual module-related tests
 *
 * @author Jim Armstrong
 *
 * @version 1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Normal Distribution test files
var Normal_1 = require("../app/libs/Normal");
var Chai = require("chai");
require("mocha");
var expect = Chai.expect;
// Test Suites
describe('Standard Normal', function () {
    it('properly constructs std. normal', function () {
        var normal = new Normal_1.TSMT$Normal();
        expect(normal.mean).to.equal(0);
        expect(normal.std).to.equal(1);
    });
    it('mean/std dev. mutators work correctly', function () {
        var normal = new Normal_1.TSMT$Normal();
        normal.mean = -1;
        normal.std = NaN;
        expect(normal.mean).to.equal(-1);
        expect(normal.std).to.equal(1);
        normal.mean = 2.0;
        normal.std = 0.2;
        expect(normal.mean).to.equal(2);
        expect(normal.std).to.equal(0.2);
    });
    it('property evaluates standard normal dist', function () {
        var normal = new Normal_1.TSMT$Normal();
        expect(normal.normaldist(0)).to.equal(0.5);
        expect(Math.abs(normal.normaldist(0.5) - 0.69146) < 0.001).to.be.true;
        expect(Math.abs(normal.normaldist(-0.5) - 0.30854) < 0.001).to.be.true;
        expect(Math.abs(normal.normaldist(1.0) - 0.84134) < 0.001).to.be.true;
        expect(Math.abs(normal.normaldist(-1.0) - 0.15866) < 0.001).to.be.true;
        expect(Math.abs(normal.normaldist(2.0) - 0.97725) < 0.001).to.be.true;
        expect(Math.abs(normal.normaldist(-2.0) - 0.02275) < 0.001).to.be.true;
        expect(Math.abs(normal.normaldist(4.0) - 0.99997) < 0.001).to.be.true;
        expect(Math.abs(normal.normaldist(-4.0) - 0.00003) < 0.001).to.be.true;
    });
});
describe('u = 2.0, s = 1.5', function () {
    it('property evaluates normal dist', function () {
        var normal = new Normal_1.TSMT$Normal();
        normal.mean = 2.0;
        normal.std = 1.5;
        // lower cumulative
        expect(Math.abs(normal.normaldist(0) - 0.09121) < 0.001).to.be.true;
    });
});
describe('inverse standard normal', function () {
    it('property evaluates inverse normal dist', function () {
        var normal = new Normal_1.TSMT$Normal();
        expect(normal.invnormaldist(0.5)).to.equal(0);
        expect(Math.abs(normal.invnormaldist(0.99997) - 4.013) < 0.001).to.be.true;
        expect(Math.abs(normal.invnormaldist(0.8) - 0.842) < 0.001).to.be.true;
        expect(Math.abs(normal.invnormaldist(0.84134) - 1) < 0.001).to.be.true;
        expect(Math.abs(normal.invnormaldist(0.02275) + 2) < 0.001).to.be.true;
        expect(Math.abs(normal.invnormaldist(0.975) - 1.96) < 0.001).to.be.true;
    });
});
describe('prediction interval', function () {
    it('property computes percentage of area covered by n std. deviations', function () {
        var normal = new Normal_1.TSMT$Normal();
        expect(Math.abs(normal.predictionInterval(0.5) - 0.3829) < 0.001).to.be.true;
        expect(Math.abs(normal.predictionInterval(1) - 0.6827) < 0.001).to.be.true;
        expect(Math.abs(normal.predictionInterval(2) - 0.9545) < 0.001).to.be.true;
        expect(Math.abs(normal.predictionInterval(3) - 0.9973) < 0.001).to.be.true;
    });
});
describe('inverse prediction interval', function () {
    it('property computes std. dev. required to cover specified area under curve', function () {
        var normal = new Normal_1.TSMT$Normal();
        // very close to 1
        expect(Math.abs(normal.inversePredictionInterval(0.6826895) - 1.0) < 0.001).to.be.true;
        // approx 2
        expect(Math.abs(normal.inversePredictionInterval(0.9544997) - 1.998) < 0.001).to.be.true;
        // approx 3
        expect(Math.abs(normal.inversePredictionInterval(0.9973002) - 2.995) < 0.001).to.be.true;
        // approx 4
        expect(Math.abs(normal.inversePredictionInterval(0.9999366) - 3.993) < 0.001).to.be.true;
        // approx 5
        expect(Math.abs(normal.inversePredictionInterval(0.9999994) - 4.986) < 0.001).to.be.true;
    });
});
describe('evaluate general normal function', function () {
    it('property evaluates N(x) for u = 0 and s = 1', function () {
        var normal = new Normal_1.TSMT$Normal();
        expect(Math.abs(normal.getNormal(1.0) - 0.2419) < 0.001).to.be.true;
        expect(Math.abs(normal.getNormal(2.0) - 0.0534) < 0.001).to.be.true;
    });
    it('property evaluates N(x) for u = 1 and s = 0.5', function () {
        var normal = new Normal_1.TSMT$Normal();
        normal.mean = 1.0;
        normal.std = 0.5;
        expect(Math.abs(normal.getNormal(1.0) - 0.7978) < 0.001).to.be.true;
        expect(Math.abs(normal.getNormal(2.0) - 0.108) < 0.001).to.be.true;
        normal.mean = 0;
        normal.std = 0.4472135955;
        expect(Math.abs(normal.getNormal(0) - 0.892) < 0.001).to.be.true;
    });
    // note derivative evaluation is visually evaluated as part of extended normal quad bezier graphing
});
//# sourceMappingURL=normal.specs.js.map