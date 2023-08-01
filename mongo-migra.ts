import {Configuration} from 'mongo-migra';

const config: Configuration = {
  uri: 'mongodb://tsedbuserstage:tsedbpassword@tse-cluster-atlas-stage-shard-00-00.cu2yl.mongodb.net:27017,tse-cluster-atlas-stage-shard-00-01.cu2yl.mongodb.net:27017,tse-cluster-atlas-stage-shard-00-02.cu2yl.mongodb.net:27017/?ssl=true&authSource=admin&replicaSet=atlas-81eq26-shard-0',
  changeLogCollectionName: 'ChangeLog',
  migrationsFolderPath: './migrations',
  includeAdminDbs: false,
  dbName: 'someDb',
};

export default config;