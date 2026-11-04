import { s3 } from './s3.js';

export function storageReady(env) {
  return Boolean(
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.AWS_ENDPOINT_URL_S3 &&
    env.AWS_REGION &&
    env.DBRIJ_BUCKET
  );
}

export async function putFile(env, key, bytes, mime, levelId) {
  await s3(env, 'PUT', key, bytes, mime);
  return 'd:' + key;
}

export async function getFile(env, storedKey) {
  if (storedKey.startsWith('d:')) {
    return s3(env, 'GET', storedKey.slice(2));
  }
  throw new Error("Unknown storage prefix");
}

export async function deleteFile(env, storedKey) {
  if (storedKey.startsWith('d:')) {
    return s3(env, 'DELETE', storedKey.slice(2));
  }
  throw new Error("Unknown storage prefix");
}
