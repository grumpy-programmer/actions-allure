import * as core from '@actions/core';
import S3 from 'aws-sdk/clients/s3';
import { Bucket } from './bucket';

const s3 = new S3();

const bucketName = core.getInput('bucket-name', { required: true });
const bucketResultsPath = core.getInput('bucket-results-path');
const bucketReportPath = core.getInput('bucket-report-path');

const allureResultsPath = core.getInput('allure-results-path', { required: true });
const allureResultsPattern = core.getInput('allure-results-pattern', { required: true });

const allureReportPath = core.getInput('allure-report-path', { required: true });
const allureReportPattern = core.getInput('allure-report-pattern', { required: true });

const bucket = new Bucket(s3, bucketName);

async function postRun() {
  core.info('Upload results and report');
  await bucket.upload(allureResultsPath, allureResultsPattern, bucketResultsPath);
  await bucket.upload(allureReportPath, allureReportPattern, bucketReportPath);
}

postRun()
  .catch(e => core.error(e));
