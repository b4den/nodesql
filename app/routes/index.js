const fs = require('fs');
const path = require('path');

const {
  get_databases,
  get_tables,
  get_columns,
  get_dump,
}  = require(`${__dirname}/../models/injection_model`);


module.exports = (router) => {
  router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/../layout.html'));
  });

  router.post('/api/database', async (req, res) => {
    const { url } = req.body

    try {
      const db_info = await get_databases(url);
      res.send({ data: db_info });
    } catch (err) {
      console.log(err);
      res.status(401).send({ error: err });
    }
  });

  router.post('/api/tables', async (req, res) => {
    const { url, database } = req.body;

    try {
      const db_info = await get_tables(url, database);
      res.send({ data: db_info });
    } catch (err) {
      console.log(err);
      res.status(401).send({ error: err });
    }
  });

  router.post('/api/columns', async (req, res) => {
    const { url, database, table } = req.body;

    try {
      const db_info = await get_columns(url, database, table);
      res.send({ data: db_info });
    } catch (err) {
      console.log(err);
      res.status(401).send({ error: err });
    }
  });

  router.post('/api/dump', async (req, res) => {
    const { url, database, table } = req.body;

    try {
      const db_info = await get_dump(url, database, table);
      res.send({ data: db_info });
    } catch (err) {
      console.log(err);
      res.status(401).send({ error: err });
    }
  });


  /* simple method to require all routes in the routes directory, while passing
   * references to the required imports */
  fs.readdirSync(__dirname).forEach((file) => {
    if (file === 'index.js') return;
    if (path.extname(file) !== '.js') return;
    const name = file.substr(0, file.indexOf('.'));
    require('./' + name)(router);
  });
};
