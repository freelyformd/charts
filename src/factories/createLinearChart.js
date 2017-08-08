import Plottable from "plottable";
import approximate from "approximate-number";
import {createChartTable} from "./createTable";
import {createTitle} from "./createTitle";
import {createColorLegend} from "./createLegend";
import {makeUnique} from "./createDataset";
import {createCategoryScale, createLinearScale} from "./createScale";
import {createCategoryAxis, createNumericAxis} from "./createAxis";
import {createLinearAxisGridLines} from "./createGrid";
import {createScaleAnimator} from "./createAnimator";

/**
 * @typedef {Object} LinearCategoryChart
 * @private
 * @property {string} type - Type
 * @property {string} title - Title
 * @property {'left'|'center'|'right'} titleAlignment=left - Title Alignment
 * @property {('vertical'|'horizontal')} orientation=vertical - Orientation
 * @property {indicator} groupBy - Groups
 * @property {Labeling} labeling - Labeling
 * @property {string[]} colors - Colors
 * @property {indicator} coloring - Color Indicator
 * @property {NumericAxis} linearAxis - Linear Axis
 * @property {CategoryAxis} categoryAxis - Category Axis
 * @property {ColorLegend} legend - Legend
 */

export const createLinearChart = ({element, plot, config}) => {

  const {

    title = null,

    titleAlignment = 'left',

    orientation = 'vertical',

    groupBy,

    colors = [],

    coloring = null,

    labeling,

    linearAxis,

    categoryAxis,

    legend = {},

    // ... more config

  } = config;

  const categoryScale = createCategoryScale(categoryAxis);
  const linearScale = createLinearScale(linearAxis);
  const colorScale = new Plottable.Scales.Color();

  const table = createChartTable({

    title: createTitle({title, titleAlignment}),

    chart: createPlotAreaWithAxes(orientation, {

      plotArea: createPlotWithGridlines({
        plot: createLinearPlot({plot, orientation, categoryScale, linearScale, labeling}),
        grid: createLinearAxisGridLines({...linearAxis, orientation, scale: linearScale})
      }),

      linearAxis: createNumericAxis({...linearAxis, axisScale: linearScale, axisOrientation: orientation}),

      categoryAxis: createCategoryAxis({...categoryAxis, axisScale: categoryScale, axisOrientation: orientation})
    }),

    legend: createColorLegend(colorScale, legend),

    legendPosition: legend.position || 'bottom'
  });

  const animate = createScaleAnimator(500);

  table.renderTo(element);

  return {
    linearScale,

    categoryScale,

    colorScale,

    table,

    addData: (data = []) => {

      const groupIds = makeUnique(data.map(d => d[groupBy]));

      if (legend.showLegend) {
        colorScale
          .domain(groupIds.map(groupId => groupId || 'Unknown'))
          .range(groupIds.map((d, i) => colors[i] || '#abc'));
      }

      const datasets = groupIds.map((groupId, index) =>
        data
          .filter(d => d[groupBy] === groupId)
          .map((item) => {
            return {
              group: groupId,
              label: item[categoryAxis.indicator],
              value: item[linearAxis.indicator],
              color: item[coloring] || colors[index] || '#abc',
              opacity: 1,
            }
          })
      );

      if (plot.datasets().length) {
        const sums = [];

        for (let i = 0; i < Math.max.apply(null, datasets.map(d => d.length)); i++) {
          sums[i] = datasets.reduce((sum, set) => sum + (set[i] ? set[i].value : 0), 0)
        }

        const axisMaximum = Math.max.apply(null, sums);

        animate([linearScale], [linearAxis.axisMinimum || 0, axisMaximum]);
      }

      plot.datasets(datasets.map(d => new Plottable.Dataset(d)));
    },

    destroy() {
      table.destroy();
    }

  };
};

export const createPlotWithGridlines = ({plot, grid}) => {
  return grid ? new Plottable.Components.Group([grid, plot]) : plot
};

export const createLinearPlot = ({plot, orientation, categoryScale, linearScale, labeling = {}}) => {
  const {
    showLabels = true, prefix = '', suffix = ''
  } = labeling;

  if (showLabels && plot.labelsEnabled) {
    plot
      .labelFormatter(d => `${prefix}${approximate(d)}${suffix}`)
      .labelsEnabled(showLabels)
  }

  return plot
    .attr('stroke', d => d.color)
    .attr('fill', d => d.color)
    .attr('fill-opacity', d => d.opacity)
    .x(d => orientation === 'vertical' ? d.label : d.value, orientation === 'vertical' ? categoryScale : linearScale)
    .y(d => orientation === 'horizontal' ? d.label : d.value, orientation === 'horizontal' ? categoryScale : linearScale);
};

const createPlotAreaWithAxes = (orientation, {linearAxis, plotArea, categoryAxis}) => {
  const plotAreaWithAxes = orientation === 'vertical' ?
    [[linearAxis, plotArea], [null, categoryAxis]] :
    [[categoryAxis, plotArea], [null, linearAxis]];

  return new Plottable.Components.Table(plotAreaWithAxes);
};