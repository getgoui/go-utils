import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'go-utils',
  outputTargets: [
    {
      type: 'dist',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
      footer: '',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
  globalScript: 'src/global/global.ts',
};
