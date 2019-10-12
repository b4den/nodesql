const { get_tables, get_columns, get_databases, get_column_dump } = require('./injection_model')
const { logger } = require('../logger');

const set_command_line_arguments = (req) => {
  let { url, postdata, fullscan, cookie } = req.query;
  url = Buffer.from(url, 'base64').toString('ascii');
  cookie = cookie ? `--cookie='${Buffer.from(req.query.cookie, 'base64').toString('ascii')}'` : '';
  const post_data = (postdata) ? Buffer.from(postdata, 'base64').toString('ascii') : undefined;

  /* ok, we need post_data, cookie, and quick set */
  const post_data_string = (post_data) ? `--data '${post_data}'` : '';
  const quick_string = (!fullscan) ? '' : '--batch';
  const args = `${post_data_string} ${cookie} ${quick_string}`;

  logger.debug(`url ${url} post_data ${post_data_string} cookie ${cookie} quickstr ${quick_string}`)
  return {
    arguments: args,
    quick: !fullscan,
    database: req.query.database,
    table: req.query.table,
    columns: req.query.columns,
  };
};

const tree_get_dump_columns = async (url, req) => {
  const args = set_command_line_arguments(req);
  const dump_table = await get_column_dump(url, args);
  return dump_table;
};

const tree_get_columns = async (url, req) => {
  const args = set_command_line_arguments(req);
  const columns = await get_columns(url, args);
  const column_sources = columns.map((x) => ({
    title: String(x).split(',')[0],
    key: 'column',
  }));
  return column_sources;
};

const tree_get_tables = async (url, req) => {
  const args = set_command_line_arguments(req);
  const tables = await get_tables(url, args);
  const table_sources = tables.map((x) => (
    {
      title: x,
      key: 'table',
      checkbox: false,
      lazy: true,
    }));
  return table_sources;
};

const tree_get_databases = async (url, req) => {
  const args = set_command_line_arguments(req);
  const databases = await get_databases(url, args);
  const database_sources = databases.databases.map((x) => (
    {
      title: x,
      key: 'database',
      folder: true,
      checkbox: false,
      lazy: true,
      server_info: databases.server_info,
    }));
  return database_sources;
};

module.exports = {
  tree_get_tables,
  tree_get_columns,
  tree_get_databases,
  tree_get_dump_columns,
};
