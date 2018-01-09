/**
 * the labels plotable provides  for barchart are not ideal for now
 * for instance they are cut off via height from some bars
 */
import {groupBy, range} from 'lodash';
import approximate from '../approximate/index';


const drawLabel = (opts, foreground) => {
  const {width, height, x, y, value, color, suffix, prefix} = opts;
  foreground
    .append('foreignObject')
    .attr('width', width)
    .attr('height', height)
    .attr('x', x)
    .attr('y', y)
    .append('xhtml:body')
    .html(width > 30 && height > 20 ?
      `<span class="custom-label" style="color: ${color}">
            ${prefix}${approximate(value)}${suffix}
        </span>`
      : '<span></span>');
};

const getValuesFromEntity = (entity) => {
  const rect = entity.selection._groups[0][0];
  const width = rect.width.baseVal.value;
  const height = rect.height.baseVal.value;
  const value = entity.datum.value;
  const y = rect.y.baseVal.value + (height / 2);
  const x = rect.x.baseVal.value;
  return {width, height, y, x, value };
};

const getGroupValues = (entities) => {
  const groups = groupBy(entities, (obj) => obj.datum.group);
  const groupKeys = Object.keys(groups);
  const lastKey = groupKeys[groupKeys.length - 1];
  const groupLength = groups[groupKeys[0]].length;
  return range(groupLength).map((index) => {
    return groupKeys.reduce((all, key) => {
      const entity = groups[key][index];
      const entityValues = getValuesFromEntity(entity);
      const sum = all.sum + entityValues.value;
      if (lastKey === key) {
        const y = entityValues.y - (entityValues.height / 2) - 15;
        return {...entityValues, value: sum, y};
      }
      return {...all, sum};
    }, {sum: 0});
  });
};

export const createCustomLabels = (config, plot) => {
  const foreground = plot.foreground();
  const {prefix = ' ', suffix = ' '} = config;
  const entities = plot.entities();
  entities.forEach(entity => {
    const entityValues = getValuesFromEntity(entity);
    drawLabel({...entityValues, color: 'white', prefix, suffix}, foreground);
  });
  if (!entities[0].datum.group) return false;
  const groupEntities = getGroupValues(entities);
  groupEntities.forEach(group => {
    drawLabel({...group, prefix, color: 'black', suffix}, foreground);
  });
};
