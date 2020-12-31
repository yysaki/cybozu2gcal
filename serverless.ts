import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'cybozu2gcal',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
  },
  // Add the serverless-webpack plugin
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    region: 'ap-northeast-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
  },
  functions: {
    cybozu2gcal: {
      handler: 'src/handler.cybozu2gcal',
      timeout: 900, // 15 * 60
      events: [
        {
          schedule: 'rate(2 hours)',
        },
        {
          http: {
            method: 'get',
            path: 'cybozu2gcal',
          },
        },
      ],
    },
  },
};

module.exports = serverlessConfiguration;
