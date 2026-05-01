"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const cosmos_1 = require("@azure/cosmos");
const client = new cosmos_1.CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT ?? '',
    key: process.env.COSMOS_KEY ?? '',
});
exports.db = client.database(process.env.COSMOS_DATABASE ?? 'skincare');
