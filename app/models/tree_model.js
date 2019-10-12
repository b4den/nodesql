const {
  tree_get_tables,
  tree_get_columns,
  tree_get_databases,
  tree_get_dump_columns,
} = require(__dirname + '/../models/tree_model');
const { logger } = require('../logger');

module.exports = (router) => {
  router.get('/api/tree_dump', async (req, res) => {
    const url = Buffer.from(req.query.url, 'base64').toString('ascii');

    try {
      const db_info = await tree_get_dump_columns(url, req);
      res.send(db_info);
    } catch (err) {
      logger.error(err);
      res.status(401).send({ error: err });
    }
  });

  router.get('/api/tree_columns', async (req, res) => {
    const url = Buffer.from(req.query.url, 'base64').toString('ascii');

    try {
      const db_info = await tree_get_columns(url, req);
      res.send(db_info);
    } catch (err) {
      logger.error(err);
      res.status(401).send({ error: err });
    }
  });

  router.get('/api/tree_databases', async (req, res) => {
    const url = Buffer.from(req.query.url, 'base64').toString('ascii');

    try {
      const db_info = await tree_get_databases(url, req);
      res.send(db_info);
    } catch (err) {
      logger.error(err);
      res.status(401).send({ error: err });
    }
  });

  router.get('/api/tree_tables', async (req, res) => {
    const url = Buffer.from(req.query.url, 'base64').toString('ascii');

    try {
      const db_info = await tree_get_tables(url, req);
      res.send(db_info);
    } catch (err) {
      logger.error(err);
      res.status(401).send({ error: err });
    }
  });
};
