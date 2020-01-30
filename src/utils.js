"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Prefers to keep v1 when both are equal.
exports.max = (v1, v2) => v2 > v1 ? v2 : v1;
exports.cumulativeMovingAverage = (acc, val, accSize) => (val + accSize * acc) / (accSize + 1);
exports.aggregateMetrics = (m1, m2) => {
    if ((m1.name != m2.name) || (m1.unit != m2.unit)) {
        throw new Error('Cannot aggregate metrics with different names or units:');
    }
    const m1Values = m1.componentValues ? m1.componentValues : [m1.value];
    const m2Values = m2.componentValues ? m2.componentValues : [m2.value];
    return {
        name: m1.name,
        unit: m1.unit,
        // m1.value already holds an average if it has component values.
        value: m2Values.reduce((acc, val, idx) => exports.cumulativeMovingAverage(acc, val, idx + m1Values.length), m1.value),
        componentValues: [...m1Values, ...m2Values],
    };
};
exports.aggregateMetricGroups = (g1, g2) => {
    if (g1.name != g2.name || g1.metrics.length != g2.metrics.length) {
        throw new Error('Cannot aggregate metric groups with different names.');
    }
    return {
        name: g1.name,
        metrics: g1.metrics.map((_, idx) => exports.aggregateMetrics(g1.metrics[idx], g2.metrics[idx])),
    };
};
