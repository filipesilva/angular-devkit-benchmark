/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare class Command {
    cmd: string;
    args: string[];
    cwd: string;
    expectedExitCode: number;
    constructor(cmd: string, args?: string[], cwd?: string, expectedExitCode?: number);
    toString(): string;
}
