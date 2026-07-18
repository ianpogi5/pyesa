import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  ListDistributionsCommand,
} from "@aws-sdk/client-cloudfront";

export function createS3Store(bucket) {
  const s3 = new S3Client({});

  return {
    async getJson(key) {
      try {
        const res = await s3.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        );
        return JSON.parse(await res.Body.transformToString());
      } catch (err) {
        if (err.name === "NoSuchKey") return null;
        throw err;
      }
    },

    // no-cache matches the deploy workflow's header for non-asset files:
    // browsers must revalidate, or clients heuristically cache stale JSON
    // (Cache-Control-less responses are "fresh" for 10% of their age)
    async putJson(key, obj) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: JSON.stringify(obj, null, 2),
          ContentType: "application/json",
          CacheControl: "no-cache",
        }),
      );
    },

    async putText(key, text, contentType) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: text,
          ContentType: contentType,
          CacheControl: "no-cache",
        }),
      );
    },

    async putBinary(key, buffer, contentType) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: "no-cache",
        }),
      );
    },

    async list(prefix) {
      const keys = [];
      let token;
      do {
        const res = await s3.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: token,
          }),
        );
        for (const obj of res.Contents || []) keys.push(obj.Key);
        token = res.IsTruncated ? res.NextContinuationToken : undefined;
      } while (token);
      return keys;
    },

    async remove(key) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

let cachedDistributionId = process.env.DISTRIBUTION_ID || null;

export function createInvalidator(bucket) {
  const cf = new CloudFrontClient({});

  async function findDistributionId() {
    if (cachedDistributionId) return cachedDistributionId;
    const res = await cf.send(new ListDistributionsCommand({}));
    for (const dist of res.DistributionList?.Items || []) {
      const hit = dist.Origins?.Items?.some((origin) =>
        origin.DomainName?.startsWith(`${bucket}.s3`),
      );
      if (hit) {
        cachedDistributionId = dist.Id;
        return dist.Id;
      }
    }
    throw new Error(`No CloudFront distribution found for bucket ${bucket}`);
  }

  return async function invalidate(paths) {
    const id = await findDistributionId();
    await cf.send(
      new CreateInvalidationCommand({
        DistributionId: id,
        InvalidationBatch: {
          CallerReference: `pyesa-api-${Date.now()}`,
          Paths: { Quantity: paths.length, Items: paths },
        },
      }),
    );
  };
}
