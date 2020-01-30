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
exports.defaultReporter = (logger) => (process, groups) => {
    const toplevelLogger = logger;
    const indentLogger = new core_1.logging.IndentLogger('benchmark-indent-logger', toplevelLogger);
    const formatMetric = (metric) => core_1.tags.oneLine `
    ${metric.name}: ${metric.value.toFixed(2)} ${metric.unit}
    ${metric.componentValues ? `(${metric.componentValues.map(v => v.toFixed(2)).join(', ')})` : ''}
  `;
    groups.forEach(group => {
        toplevelLogger.info(`${group.name}`);
        group.metrics.forEach(metric => indentLogger.info(formatMetric(metric)));
    });
};
