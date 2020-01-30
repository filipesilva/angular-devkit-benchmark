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
const child_process_1 = require("child_process");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const monitored_process_1 = require("./monitored-process");
const run_benchmark_1 = require("./run-benchmark");
const utils_1 = require("./utils");
function runBenchmarkWatch({ command, captures, reporters = [], iterations = 5, retries = 5, logger = new core_1.logging.NullLogger(), watchMatcher, watchTimeout = 10000, watchCommand, }) {
    let successfulRuns = 0;
    let failedRuns = 0;
    const debugPrefix = () => `Run #${successfulRuns + 1}:`;
    // Run the process and captures, wait for both to finish, and average out the metrics.
    const monitoredProcess = new monitored_process_1.LocalMonitoredProcess(command, false);
    const processFailed = new core_1.BaseException('Wrong exit code.');
    // Gather stats until the stdout contains the matched text.
    const stats$ = monitoredProcess.stats$.pipe(operators_1.takeUntil(monitoredProcess.stdout$.pipe(operators_1.first(stdout => stdout.toString().includes(watchMatcher)), operators_1.timeout(watchTimeout))));
    return rxjs_1.combineLatest([
        monitoredProcess.run().pipe(operators_1.startWith(undefined), operators_1.tap(processExitCode => {
            if (processExitCode !== undefined && processExitCode != command.expectedExitCode) {
                logger.debug(`${debugPrefix()} exited with ${processExitCode} but `
                    + `${command.expectedExitCode} was expected`);
                throw processFailed;
            }
        })),
        monitoredProcess.stdout$.pipe(operators_1.filter(stdout => stdout.toString().includes(watchMatcher)), operators_1.take(1)),
    ]).pipe(operators_1.timeout(watchTimeout), operators_1.concatMap(() => {
        const { cmd, cwd, args } = watchCommand;
        failedRuns = 0;
        return rxjs_1.of(null)
            .pipe(operators_1.tap(() => {
            var _a;
            const { status, error } = child_process_1.spawnSync(cmd, args, { cwd });
            monitoredProcess.resetElapsedTimer();
            if (status != command.expectedExitCode) {
                logger.debug(`${debugPrefix()} exited with ${status}\n${(_a = error) === null || _a === void 0 ? void 0 : _a.message}`);
                throw processFailed;
            }
            // Reset fail counter for this iteration.
            failedRuns = 0;
        }), operators_1.tap(() => logger.debug(`${debugPrefix()} starting`)), operators_1.concatMap(() => rxjs_1.forkJoin(captures.map(capture => capture(stats$)))), operators_1.throwIfEmpty(() => new Error('Nothing was captured')), operators_1.tap(() => logger.debug(`${debugPrefix()} finished successfully`)), operators_1.tap(() => successfulRuns++), operators_1.repeat(iterations), operators_1.retryWhen(errors => errors
            .pipe(operators_1.concatMap(val => {
            // Check if we're still within the retry threshold.
            failedRuns++;
            return failedRuns < retries ? rxjs_1.of(val) : rxjs_1.throwError(val);
        }))));
    }), operators_1.retryWhen(errors => errors
        .pipe(operators_1.concatMap(val => {
        // Check if we're still within the retry threshold.
        failedRuns++;
        if (failedRuns < retries) {
            return rxjs_1.of(val);
        }
        return rxjs_1.throwError(val === processFailed ?
            new run_benchmark_1.MaximumRetriesExceeded(retries) :
            val);
    }))), operators_1.take(iterations), operators_1.reduce((acc, val) => acc.map((_, idx) => utils_1.aggregateMetricGroups(acc[idx], val[idx]))), operators_1.tap(groups => reporters.forEach(reporter => reporter(command, groups))));
}
exports.runBenchmarkWatch = runBenchmarkWatch;
