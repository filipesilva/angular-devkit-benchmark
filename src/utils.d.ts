/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AggregatedMetric, Metric, MetricGroup } from './interfaces';
export declare const max: (v1: number, v2: number) => number;
export declare const cumulativeMovingAverage: (acc: number, val: number, accSize: number) => number;
export declare const aggregateMetrics: (m1: Metric | AggregatedMetric, m2: Metric | AggregatedMetric) => AggregatedMetric;
export declare const aggregateMetricGroups: (g1: MetricGroup, g2: MetricGroup) => MetricGroup;
