"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const operators_1 = require("rxjs/operators");
const utils_1 = require("./utils");
exports.defaultStatsCapture = (stats) => {
    const seed = {
        elapsed: 0,
        avgProcesses: 0,
        peakProcesses: 0,
        avgCpu: 0,
        peakCpu: 0,
        avgMemory: 0,
        peakMemory: 0,
    };
    return stats.pipe(operators_1.reduce((acc, val, idx) => ({
        elapsed: val.elapsed,
        avgProcesses: utils_1.cumulativeMovingAverage(acc.avgProcesses, val.processes, idx),
        peakProcesses: utils_1.max(acc.peakProcesses, val.processes),
        avgCpu: utils_1.cumulativeMovingAverage(acc.avgCpu, val.cpu, idx),
        peakCpu: utils_1.max(acc.peakCpu, val.cpu),
        avgMemory: utils_1.cumulativeMovingAverage(acc.avgMemory, val.memory, idx),
        peakMemory: utils_1.max(acc.peakMemory, val.memory),
    }), seed), operators_1.map(metrics => ({
        name: 'Process Stats',
        metrics: [
            { name: 'Elapsed Time', unit: 'ms', value: metrics.elapsed },
            { name: 'Average Process usage', unit: 'process(es)', value: metrics.avgProcesses },
            { name: 'Peak Process usage', unit: 'process(es)', value: metrics.peakProcesses },
            { name: 'Average CPU usage', unit: '%', value: metrics.avgCpu },
            { name: 'Peak CPU usage', unit: '%', value: metrics.peakCpu },
            { name: 'Average Memory usage', unit: 'MB', value: metrics.avgMemory * 1e-6 },
            { name: 'Peak Memory usage', unit: 'MB', value: metrics.peakMemory * 1e-6 },
        ],
    })));
};
