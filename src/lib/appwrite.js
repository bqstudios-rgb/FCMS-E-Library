import { Client } from 'appwrite';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6ae0ed49003c575bb148');

export { client };

// Runs once when the app starts, so Appwrite can confirm the setup.
client.ping().catch(() => {});
