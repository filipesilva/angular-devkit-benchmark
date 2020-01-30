/// <reference types="node" />
import { Observable } from 'rxjs';
import { Command } from './command';
import { AggregatedProcessStats, MonitoredProcess } from './interfaces';
export declare class LocalMonitoredProcess implements MonitoredProcess {
    private command;
    private useProcessTime;
    private stats;
    private stdout;
    private stderr;
    private pollingRate;
    stats$: Observable<AggregatedProcessStats>;
    stdout$: Observable<Buffer>;
    stderr$: Observable<Buffer>;
    private elapsedTimer;
    constructor(command: Command, useProcessTime?: boolean);
    run(): Observable<number>;
    resetElapsedTimer(): void;
}
