import { createHandler } from "./lib/router.mjs";
import { createS3Store, createInvalidator } from "./lib/store-s3.mjs";

const bucket = process.env.S3_BUCKET;

export const handler = createHandler({
  store: createS3Store(bucket),
  invalidate: createInvalidator(bucket),
  env: {
    PASSCODE: process.env.PASSCODE,
    DOMAIN: process.env.DOMAIN,
  },
});
