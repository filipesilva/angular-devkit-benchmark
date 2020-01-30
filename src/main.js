#!/usr/bin/env node
"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const fs_1 = require("fs");
const minimist = require("minimist");
const operators_1 = require("rxjs/operators");
const command_1 = require("../src/command");
const default_reporter_1 = require("../src/default-reporter");
const default_stats_capture_1 = require("../src/default-stats-capture");
const run_benchmark_1 = require("../src/run-benchmark");
const run_benchmark_watch_1 = require("./run-benchmark-watch");
async function main({ args, stdout = process.stdout, stderr = process.stderr, }) {
    // Show usage of the CLI tool, and exit the process.
    function usage(logger) {
        logger.info(core_1.tags.stripIndent `
    benchmark [options] -- [command to benchmark]

    Collects process stats from running the command.

    Options:
        --help                    Show this message.
        --verbose                 Show more information while running.
        --exit-code               Expected exit code for the command. Default is 0.
        --iterations              Number of iterations to run the benchmark over. Default is 5.
        --retries                 Number of times to retry when process fails. Default is 5.
        --cwd                     Current working directory to run the process in.
        --output-file             File to output benchmark log to.
        --overwrite-output-file   If the output file should be overwritten rather than appended to.
        --prefix                  Logging prefix.
        --watch-matcher           Text to match in stdout to mark an iteration complete.
        --watch-timeout           The maximum time in 'ms' to wait for the text specified in the matcher to be matched. Default is 10000.
        --watch-script            Script to run before each watch iteration.

    Example:
        benchmark --iterations=3 -- node my-script.js
  `);
    }
    // Parse the command line.
    const argv = minimist(args, {
        boolean: ['help', 'verbose', 'overwrite-output-file'],
        string: [
            'watch-matcher',
            'watch-script',
        ],
        default: {
            'exit-code': 0,
            'iterations': 5,
            'retries': 5,
            'output-file': null,
            'cwd': process.cwd(),
            'prefix': '[benchmark]',
            'watch-timeout': 10000,
        },
        '--': true,
    });
    // Create the DevKit Logger used through the CLI.
    const logger = new core_1.logging.TransformLogger('benchmark-prefix-logger', stream => stream.pipe(operators_1.map(entry => {
        if (argv['prefix']) {
            entry.message = `${argv['prefix']} ${entry.message}`;
        }
        return entry;
    })));
    // Log to console.
    logger
        .pipe(operators_1.filter(entry => (entry.level != 'debug' || argv['verbose'])))
        .subscribe(entry => {
        let color = x => core_1.terminal.dim(core_1.terminal.white(x));
        let output = stdout;
        switch (entry.level) {
            case 'info':
                color = s => s;
                break;
            case 'warn':
                color = core_1.terminal.yellow;
                output = stderr;
                break;
            case 'error':
                color = core_1.terminal.red;
                output = stderr;
                break;
            case 'fatal':
                color = (x) => core_1.terminal.bold(core_1.terminal.red(x));
                output = stderr;
                break;
        }
        output.write(color(entry.message) + '\n');
    });
    // Print help.
    if (argv['help']) {
        usage(logger);
        return 0;
    }
    const commandArgv = argv['--'];
    const { 'watch-timeout': watchTimeout, 'watch-matcher': watchMatcher, 'watch-script': watchScript, 'exit-code': exitCode, 'output-file': outFile, iterations, retries, } = argv;
    // Exit early if we can't find the command to benchmark.
    if (watchMatcher && !watchScript) {
        logger.fatal(`Cannot use --watch-matcher without specifying --watch-script.`);
        return 1;
    }
    if (!watchMatcher && watchScript) {
        logger.fatal(`Cannot use --watch-script without specifying --watch-matcher.`);
        return 1;
    }
    // Exit early if we can't find the command to benchmark.
    if (!commandArgv || !Array.isArray(argv['--']) || argv['--'].length < 1) {
        logger.fatal(`Missing command, see benchmark --help for help.`);
        return 1;
    }
    // Setup file logging.
    if (outFile !== null) {
        if (argv['overwrite-output-file']) {
            fs_1.writeFileSync(outFile, '');
        }
        logger.pipe(operators_1.filter(entry => (entry.level != 'debug' || argv['verbose'])))
            .subscribe(entry => fs_1.appendFileSync(outFile, `${entry.message}\n`));
    }
    // Run benchmark on given command, capturing stats and reporting them.
    const cmd = commandArgv[0];
    const cmdArgs = commandArgv.slice(1);
    const command = new command_1.Command(cmd, cmdArgs, argv['cwd'], exitCode);
    const captures = [default_stats_capture_1.defaultStatsCapture];
    const reporters = [default_reporter_1.defaultReporter(logger)];
    logger.info(`Benchmarking process over ${iterations} iterations, with up to ${retries} retries.`);
    logger.info(`  ${command.toString()}`);
    try {
        let res$;
        if (watchMatcher && watchScript) {
            res$ = run_benchmark_watch_1.runBenchmarkWatch({
                command, captures, reporters, iterations, retries, logger,
                watchCommand: new command_1.Command('node', [watchScript]), watchMatcher, watchTimeout,
            });
        }
        else {
            res$ = run_benchmark_1.runBenchmark({ command, captures, reporters, iterations, retries, logger });
        }
        const res = await res$.pipe(operators_1.toArray()).toPromise();
        if (res.length === 0) {
            return 1;
        }
    }
    catch (error) {
        if (error.message) {
            logger.fatal(error.message);
        }
        else {
            logger.fatal(error);
        }
        return 1;
    }
    return 0;
}
exports.main = main;
if (require.main === module) {
    const args = process.argv.slice(2);
    main({ args })
        .then(exitCode => process.exitCode = exitCode)
        .catch(e => { throw (e); });
}
