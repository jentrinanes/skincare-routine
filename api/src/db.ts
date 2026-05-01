import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT ?? '',
  key: process.env.COSMOS_KEY ?? '',
});

export const db = client.database(process.env.COSMOS_DATABASE ?? 'skincare');
