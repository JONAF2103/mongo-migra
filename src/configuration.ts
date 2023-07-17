import {Configuration} from './types';

export const DEFAULT_CONFIG: Configuration = {
  uri: 'mongodb://localhost:27017',
  changeLogCollectionName: 'ChangeLog',
  migrationsFolderPath: './migrations',
};