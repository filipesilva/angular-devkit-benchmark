"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const child_process_1 = require("child_process");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const pidusage = require('pidusage');
const pidtree = require('pidtree');
const treeKill = require('tree-kill');
// Cleanup when the parent process exits.
const defaultProcessExitCb = () => { };
let processExitCb = defaultProcessExitCb;
process.on('exit', () => {
    processExitCb();
    processExitCb = defaultProcessExitCb;
});
class LocalMonitoredProcess {
    constructor(command, useProcessTime = true) {
        this.command = command;
        this.useProcessTime = useProcessTime;
        this.stats = new rxjs_1.Subject();
        this.stdout = new rxjs_1.Subject();
        this.stderr = new rxjs_1.Subject();
        this.pollingRate = 100;
        this.stats$ = this.stats.asObservable();
        this.stdout$ = this.stdout.asObservable();
        this.stderr$ = this.stderr.asObservable();
    }
    run() {
        return new rxjs_1.Observable(obs => {
            const { cmd, cwd, args } = this.command;
            const spawnOptions = { cwd, shell: true };
            if (!this.useProcessTime) {
                this.resetElapsedTimer();
            }
            // Spawn the process.
            const childProcess = child_process_1.spawn(cmd, args, spawnOptions);
            // Emit output and stats.
            childProcess.stdout.on('data', (data) => this.stdout.next(data));
            childProcess.stderr.on('data', (data) => this.stderr.next(data));
            const statsSubs = rxjs_1.timer(0, this.pollingRate).pipe(operators_1.concatMap(() => rxjs_1.from(pidtree(childProcess.pid, { root: true }))), operators_1.concatMap((pids) => rxjs_1.from(pidusage(pids, { maxage: 5 * this.pollingRate }))), operators_1.map((statsByProcess) => {
                // Ignore the spawned shell in the total process number.
                const pids = Object.keys(statsByProcess)
                    .filter(pid => pid != childProcess.pid.toString());
                const processes = pids.length;
                // We want most stats from the parent process.
                const { pid, ppid, ctime, elapsed, timestamp } = statsByProcess[childProcess.pid];
                // CPU and memory should be agreggated.
                let cpu = 0, memory = 0;
                for (const pid of pids) {
                    cpu += statsByProcess[pid].cpu;
                    memory += statsByProcess[pid].memory;
                }
                return {
                    processes,
                    cpu,
                    memory,
                    pid,
                    ppid,
                    ctime,
                    elapsed: this.useProcessTime ? elapsed : (Date.now() - this.elapsedTimer),
                    timestamp,
                };
            }), operators_1.tap(stats => this.stats.next(stats)), operators_1.onErrorResumeNext()).subscribe();
            // Process event handling.
            // Killing processes cross platform can be hard, treeKill helps.
            const killChildProcess = () => {
                if (childProcess && childProcess.pid) {
                    treeKill(childProcess.pid, 'SIGTERM');
                }
            };
            // Convert process exit codes and errors into observable events.
            const handleChildProcessExit = (code, error) => {
                // Stop gathering stats and complete subjects.
                statsSubs.unsubscribe();
                this.stats.complete();
                this.stdout.complete();
                this.stderr.complete();
                // Kill hanging child processes and emit error/exit code.
                killChildProcess();
                if (error) {
                    obs.error(error);
                }
                obs.next(code);
                obs.complete();
            };
            childProcess.once('exit', handleChildProcessExit);
            childProcess.once('error', (err) => handleChildProcessExit(1, err));
            processExitCb = killChildProcess;
            // Cleanup on unsubscription.
            return killChildProcess;
        });
    }
    resetElapsedTimer() {
        if (this.useProcessTime) {
            throw new Error(`Cannot reset elapsed timer when using process time. Set 'useProcessTime' to false.`);
        }
        this.elapsedTimer = Date.now();
    }
}
exports.LocalMonitoredProcess = LocalMonitoredProcess;
