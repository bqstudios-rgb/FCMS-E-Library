import { s3 } from './s3.js';
import * as aw from './appwrite.js';

export function storageReady(env) {
  const dbrij = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_ENDPOINT_URL_S3 && env.AWS_REGION && env.DBRIJ_BUCKET;
  const appw = env.APPWRITE_ENDPOINT && env.APPWRITE_PROJECT && env.APPWRITE_BUCKET && env.APPWRITE_KEY;
  return Boolean(dbrij && appw);
}

export async function putFile(env, key, bytes, mime, levelId) {
  if (levelId === 'lvl_100' || levelId === 'lvl_200') {
    await s3(env, 'PUT', key, bytes, mime);
    return 'd:' + key;
  }
  if (levelId === 'lvl_300' || levelId === 'lvl_400') {
    await aw.putFile(env, key, bytes, mime);
    return 'a:' + key;
  }
  throw new Error("Invalid level ID");
}

export async function getFile(env, storedKey) {
  if (storedKey.startsWith('d:')) {
    return s3(env, 'GET', storedKey.slice(2));
  }
  if (storedKey.startsWith('a:')) {
    return aw.getFile(env, storedKey.slice(2));
  }
  throw new Error("Unknown storage prefix");
}

export async function deleteFile(env, storedKey) {
  if (storedKey.startsWith('d:')) {
    return s3(env, 'DELETE', storedKey.slice(2));
  }
  if (storedKey.startsWith('a:')) {
    return aw.deleteFile(env, storedKey.slice(2));
  }
  throw new Error("Unknown storage prefix");
}
