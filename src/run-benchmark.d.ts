/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BaseException, logging } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { Command } from './command';
import { BenchmarkReporter, Capture, MetricGroup } from './interfaces';
export interface RunBenchmarkOptions {
    command: Command;
    captures: Capture[];
    reporters: BenchmarkReporter[];
    iterations?: number;
    retries?: number;
    expectedExitCode?: number;
    logger?: logging.Logger;
}
export declare class MaximumRetriesExceeded extends BaseException {
    constructor(retries: number);
}
export declare function runBenchmark({ command, captures, reporters, iterations, retries, logger, }: RunBenchmarkOptions): Observable<MetricGroup[]>;
