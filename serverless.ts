import type { AWS } from '@serverless/typescript';
import { S3_BUCKET_NAME } from './src/config';

const serverlessConfiguration: AWS = {
  service: 'cybozu2gcal',
  frameworkVersion: '2',
  custom: {
    'serverless-layers': {
      dependenciesPath: 'package.json',
      packageManager: 'yarn',
      layersDeploymentBucket: S3_BUCKET_NAME,
    },
    webpack: {
      packager: 'yarn',
      webpackConfig: './webpack.config.ts',
    },
  },
  plugins: ['serverless-webpack', 'serverless-layers'],
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
