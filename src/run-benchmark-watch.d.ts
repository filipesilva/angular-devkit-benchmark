import { Observable } from 'rxjs';
import { Command } from './command';
import { MetricGroup } from './interfaces';
import { RunBenchmarkOptions } from './run-benchmark';
export interface RunBenchmarkWatchOptions extends RunBenchmarkOptions {
    watchMatcher: string;
    watchTimeout?: number;
    watchCommand: Command;
}
export declare function runBenchmarkWatch({ command, captures, reporters, iterations, retries, logger, watchMatcher, watchTimeout, watchCommand, }: RunBenchmarkWatchOptions): Observable<MetricGroup[]>;
