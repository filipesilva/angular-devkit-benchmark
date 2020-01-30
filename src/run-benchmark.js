"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const monitored_process_1 = require("./monitored-process");
const utils_1 = require("./utils");
class MaximumRetriesExceeded extends core_1.BaseException {
    constructor(retries) {
        super(`Maximum number of retries (${retries}) for command was exceeded.`);
    }
}
exports.MaximumRetriesExceeded = MaximumRetriesExceeded;
function runBenchmark({ command, captures, reporters = [], iterations = 5, retries = 5, logger = new core_1.logging.NullLogger(), }) {
    let successfulRuns = 0;
    let failedRuns = 0;
    const notDoneYet = new core_1.BaseException('Not done yet.');
    const processFailed = new core_1.BaseException('Wrong exit code.');
    const debugPrefix = () => `Run #${successfulRuns + 1}:`;
    let aggregatedMetricGroups = [];
    // Run the process and captures, wait for both to finish, and average out the metrics.
    return new rxjs_1.Observable(obs => {
        const monitoredProcess = new monitored_process_1.LocalMonitoredProcess(command);
        const metric$ = captures.map(capture => capture(monitoredProcess.stats$));
        obs.next([monitoredProcess, ...metric$]);
    }).pipe(operators_1.tap(() => logger.debug(`${debugPrefix()} starting`)), operators_1.concatMap(([monitoredProcess, ...metric$]) => rxjs_1.forkJoin(monitoredProcess.run(), ...metric$)), operators_1.throwIfEmpty(() => new Error('Nothing was captured')), operators_1.concatMap(results => {
        const [processExitCode, ...metrics] = results;
        if (processExitCode != command.expectedExitCode) {
            logger.debug(`${debugPrefix()} exited with ${processExitCode} but `
                + `${command.expectedExitCode} was expected`);
            return rxjs_1.throwError(processFailed);
        }
        logger.debug(`${debugPrefix()} finished successfully`);
        return rxjs_1.of(metrics);
    }), operators_1.map(newMetricGroups => {
        // Aggregate metric groups into a single one.
        if (aggregatedMetricGroups.length === 0) {
            aggregatedMetricGroups = newMetricGroups;
        }
        else {
            aggregatedMetricGroups = aggregatedMetricGroups.map((_, idx) => utils_1.aggregateMetricGroups(aggregatedMetricGroups[idx], newMetricGroups[idx]));
        }
        successfulRuns += 1;
        return aggregatedMetricGroups;
    }), operators_1.concatMap(val => successfulRuns < iterations ? rxjs_1.throwError(notDoneYet) : rxjs_1.of(val)), 
    // This is where we control when the process should be run again.
    operators_1.retryWhen(errors => errors.pipe(operators_1.concatMap(val => {
        // Always run again while we are not done yet.
        if (val === notDoneYet) {
            return rxjs_1.of(val);
        }
        // Otherwise check if we're still within the retry threshold.
        failedRuns += 1;
        if (failedRuns < retries) {
            return rxjs_1.of(val);
        }
        if (val === processFailed) {
            return rxjs_1.throwError(new MaximumRetriesExceeded(retries));
        }
        // Not really sure what happened here, just re-throw it.
        return rxjs_1.throwError(val);
    }))), operators_1.tap(groups => reporters.forEach(reporter => reporter(command, groups))), operators_1.take(1));
}
exports.runBenchmark = runBenchmark;
