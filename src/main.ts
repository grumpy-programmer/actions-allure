import * as core from '@actions/core';
import S3 from 'aws-sdk/clients/s3';
import { Bucket } from './bucket';

const s3 = new S3();

const bucketName = core.getInput('bucket-name', { required: true });
const bucketReportPath = core.getInput('bucket-report-path');
const allureResultsPath = core.getInput('allure-results-path', { required: true });

const bucket = new Bucket(s3, bucketName);

async function run() {
  core.info('Download report history');
  await bucket.download(`${bucketReportPath}/history`, `${allureResultsPath}/history`);
}

run()
  .catch(e => core.error(e));

