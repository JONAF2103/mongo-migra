import {Configuration} from 'mongo-migra';

const config: Configuration = {
  uri: 'mongodb://localhost:27017?replicaSet=rs0&retryWrites=false',
  changeLogCollectionName: 'ChangeLog',
  migrationsFolderPath: './migrations',
  includeAdminDbs: false,
  dbName: 'someDb',
};

export default config;