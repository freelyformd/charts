// @flow
interface Chart {
  update(data: Object[]): void;
}

type DrawArguments = {
  element: Element,
  config: Object,
  data: Object[],
}

type Color = {
  name: string,
  color: string,
}

export const palette: Map<string, string> = new Map();

export const setColorPalette = (colors: Color[]) => {
  colors.forEach(({name, color}) => palette.set(name, color));
};

export const draw = (args: DrawArguments) => {
  const {element, data, config: {colors, ...config}} = args;

  //noinspection UnnecessaryLocalVariableJS
  const promise: Promise<Chart> = new Promise(function (resolve, reject) {
    if (!config.type) return reject(new Error('No chart type specified'));

    // $FlowFixMe
    import(`./charts/${config.type}.js`)
      .then(function (factory) {
        const chart: Chart = factory.default(
          element,
          // Substitute color indicators
          config.coloring ?
            data.map(d => ({
              ...d,
              [config.coloring]: palette.get(d[config.coloring]) || d[config.coloring]
            })) :
            data,

          {
            ...config,

            // Substitute colors[]
            colors: palette.size && colors ?
              colors.map(color => palette.get(color) || color) :
              colors,
          }
        );

        resolve(chart);
      })
      .catch(error => {
        reject(error)
      })
  });
  return promise;

};

export default draw;
