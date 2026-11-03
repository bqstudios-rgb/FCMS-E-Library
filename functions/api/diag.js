export async function onRequest(context) {
  const env = context.env;
  return Response.json({
    AWS_ACCESS: !!env.AWS_ACCESS_KEY_ID,
    AWS_SECRET: !!env.AWS_SECRET_ACCESS_KEY,
    AWS_ENDPOINT: !!env.AWS_ENDPOINT_URL_S3,
    AWS_REGION: !!env.AWS_REGION,
    DBRIJ_BUCKET: !!env.DBRIJ_BUCKET,
    APPWRITE_ENDPOINT: !!env.APPWRITE_ENDPOINT,
    APPWRITE_PROJECT: !!env.APPWRITE_PROJECT,
    APPWRITE_BUCKET: !!env.APPWRITE_BUCKET,
    APPWRITE_KEY: !!env.APPWRITE_KEY
  });
}
