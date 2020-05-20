import * as core from '@actions/core';
import S3, { GetObjectRequest, ListObjectsOutput, ListObjectsRequest, PutObjectRequest } from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import * as glob from 'glob';
import { lookup } from 'mime-types';

export class Bucket {
  constructor(private s3: S3, private bucket: string) {
  }

  public async download(source: string, target: string = '') {
    source = this.clean(source);
    target = this.clean(target);

    const keys = await this.getKeysFromBucketPath(source);

    await keys.map(key => this.downloadFile(key, source, target));
  }

  public async upload(prefix: string, pattern: string, target: string = '') {
    prefix = this.cleanRight(prefix);
    pattern = this.cleanLeft(pattern);
    target = this.cleanRight(target);

    const fullPattern = `${prefix}/${pattern}`;

    const files = this.getFilesFromPattern(fullPattern);

    await files.map(file => this.uploadFile(prefix, file, target));
  }

  private async getKeysFromBucketPath(prefix: string): Promise<string[]> {
    const params: ListObjectsRequest = {
      Bucket: this.bucket,
      Prefix: prefix
    };

    return await this.s3.listObjects(params).promise()
      .then(this.extractKeys);

  }

  private getFilesFromPattern(sourcePattern: string): string[] {
    return glob.sync(sourcePattern);
  }

  private extractKeys(output: ListObjectsOutput): string[] {
    if (output.Contents === undefined) {
      return [];
    }

    return output.Contents
      .map(content => content.Key)
      .filter(key => key !== undefined)
      .map(key => key as string);
  }

  private clean(path: string) {
    path = this.cleanLeft(path);
    path = this.cleanRight(path);

    return path;
  }

  private cleanLeft(path: string): string {
    if (path.startsWith('/')) {
      return path.substring(1);
    }

    return path;
  }

  private cleanRight(path: string): string {
    if (path.endsWith('/')) {
      return path.substring(0, path.length - 1);
    }

    return path;
  }

  private async downloadFile(key: string, source: string, target: string): Promise<string> {
    const file = key.replace(source + '/', '');
    const filePath = `${target}/${file}`;
    const path = filePath.substring(0, filePath.lastIndexOf('/'));

    fs.mkdirSync(path, { recursive: true });

    const params: GetObjectRequest = {
      Bucket: this.bucket,
      Key: key
    };

    const body = await this.s3.getObject(params)
      .promise()
      .then(output => output.Body);

    fs.writeFileSync(filePath, body);

    core.info(`download: ${key} -> ${filePath}`);

    return filePath;
  }

  private async uploadFile(prefix: string, file: string, target: string): Promise<string> {
    let key = target;

    if (key !== '') {
      key += '/';
    }

    const type = lookup(file);

    key += file.replace(prefix + '/', '');

    const params: PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: fs.readFileSync(file),
      ContentType: type ? type : undefined
    };

    await this.s3.putObject(params).promise();

    core.info(`upload: ${file} -> ${key}`);

    return key;
  }
}
