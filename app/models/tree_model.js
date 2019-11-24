const { get_tables, get_columns, get_databases, get_column_dump } = require('./injection_model')
const { logger } = require('../logger');

const setAdditionalArgs = (processArgs, additionalArgs) => {
  Object.keys(additionalArgs)
    .forEach(key => processArgs.push(`--${key}`, additionalArgs[key]));
}

const set_command_line_arguments = (req) => {
  let { url } = req.query;
  let { postdata, fullscan, cookie, additionalArgs } = req.query;
  cookie = cookie ? Buffer.from(req.query.cookie, 'base64').toString('ascii') : '';
  postdata = (postdata) ? Buffer.from(postdata, 'base64').toString('ascii') : undefined;


  logger.debug(`set_command_line_args url: ${url} cookie: ${cookie} postdata: ${postdata}`);
  let processArgs = []

  /* If we have a cookie, then set that as an argument in our args array */
  if (cookie) processArgs.push('--cookie', cookie);
  if (postdata) processArgs.push('--data', postdata);

  /* now lets see if we need to perform additional SQLMap options */
  if (additionalArgs) setAdditionalArgs(processArgs, additionalArgs);

  /* Let's set some performance switches */
  processArgs.push('--batch', '--smart', '-o')


  return {
    processArgs,
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
