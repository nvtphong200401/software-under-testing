import kn from 'knex';

export const connectionInfo = {
  host: 'eu-cdbr-west-02.cleardb.net',
  user: 'bd14ed0b560fda',
  password: '3d05c9e9',
  database: 'heroku_0d0dfdaeef9822b'
};

const knex = kn({
  client: 'mysql2',
  connection: connectionInfo,
  pool: { min: 0, max: 10 }
});

export default knex;