import {Configuration} from 'mongo-migra';

const config: Configuration = {
  uri: 'mongodb://localhost:27017',
  changeLogCollectionName: 'ChangeLog',
  migrationsFolderPath: './migrations',
  dbName: 'some-db',
};

export default config;