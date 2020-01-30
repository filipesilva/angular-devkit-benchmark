"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
class Command {
    constructor(cmd, args = [], cwd = process.cwd(), expectedExitCode = 0) {
        this.cmd = cmd;
        this.args = args;
        this.cwd = cwd;
        this.expectedExitCode = expectedExitCode;
    }
    toString() {
        const { cmd, args, cwd } = this;
        const argsStr = args.length > 0 ? ' ' + args.join(' ') : '';
        return `${cmd}${argsStr} (at ${cwd})`;
    }
}
exports.Command = Command;
