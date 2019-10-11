/* TODO:
 * use --batch as opposed to stdin hacks
 * use -o for performance optimisations */
const { spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const parse = require('csv-parse');
const path = require('path');
const { logger } = require('../logger');

const get_server_info = (dump_str) => {
  const os = dump_str.match(/web server operating system: ([\s\S]*?)\n/, dump_str) ?
    dump_str.match(/web server operating system: ([\s\S]*?)\n/, dump_str)[1] : 'Undetected';
  const tech = dump_str.match(/web application technology: ([\s\S]*?)\n/, dump_str) ?
    dump_str.match(/web application technology: ([\s\S]*?)\n/, dump_str)[1] : 'Undetected';
  const db = dump_str.match(/back-end DBMS: ([\s\S]*?)\n/, dump_str) ?
    dump_str.match(/back-end DBMS: ([\s\S]*?)\n/, dump_str)[1] : 'Undetected';

  return { os, tech, db };
};

const shellout = async (stdin, hostname, sql_args) => (new Promise((resolve) => {
  const map_process = process.env.SQLMAP_DIR
    || path.join(`${__dirname}/../../bin/sqlmapproject/sqlmap.py`);

  let process_output = '';
  const command_string = `${stdin} ${map_process} --threads 10 -u '${hostname}' ${sql_args} --user-agent="Mozilla 5/0"`;
  logger.debug(`subprocess_string =>  ${command_string.split(/\|(.+)/)[1]}`);

  const subprocess_spawn = spawn('sh', ['-c', command_string]);

  subprocess_spawn.stdout.on('data', (data) => {
    process_output += data;
  });

  subprocess_spawn.stdout.on('close', () => (resolve(process_output)));
}));

const get_table_string = async (url, args) => {
  const stdin = (args.quick) ? '(cat << END \ny\nn\nn\nEND\n) |' : '';
  const sql_options = `-D ${args.database} ${args.arguments} --tables`;
  logger.debug(`sql options: ${sql_options}`);

  const response = await shellout(stdin, url, sql_options);
  return response;
};

const parse_tables = (table_str) => {
  const pre_tables = table_str.match(/\d+\stables[\s\S]*\n\n\[\d+/);

  // sanity check then get all occurrences between pipe characters
  if (!pre_tables) return [];
  let data = pre_tables[0].match(/\|[\s\S]*?\|/g);

  // now replace pipes and trim whitespace
  data = data.map((x) => x.replace(/\|/g, '').trim());

  return data;
};

const remove_table_headings_and_borders = (data, dump = false) => {
  /* '+---------------+------------------+',
   * '| Column        | Type             |',
   * '+---------------+------------------+' */

  data.shift();
  const header = data.shift();
  if (!dump) {
    data.shift();
    data.shift();
  } else {
    data.splice(1, 1);
  }
  data.pop();
  data.pop();
  data.pop();

  return header;
};

const parse_columns = (column_str) => {
  const pre_columns = column_str.match(/\[\d+\scolumns[\s\S]*\n\n\[\d+/);
  let data = pre_columns[0].split('\n');

  /* clean up the table */
  remove_table_headings_and_borders(data);

  data = data.map((x) => (
    x.substr(1, x.length - 2)
    .split('|')              // remove pipe delimiters
    .map((y) => y.trim()))); // remove whitespace

  return data;
};

const get_tables = async (url, args) => {
  const table_str = await get_table_string(url, args);
  const tables = parse_tables(table_str);

  return tables;
};

const get_column_string = async (url, args) => {
  const sql_options = `-D ${args.database} -T ${args.table} ${args.arguments} --columns`;
  const response = await shellout('', url, sql_options);

  return response;
};

const get_columns = async (url, args) => {
  const column_str = await get_column_string(url, args);
  const columns = parse_columns(column_str);

  return columns;
};

const get_dump_column_str = async (url, args) => {
  const stdin = (args.quick) ? '(cat << END \nn\nn\n\nn\nn\nEND\n) |' : '';
  const sql_options = `-D ${args.database} -T ${args.table} -C ${args.columns} ${args.arguments} --dump`;

  const response = await shellout(stdin, url, sql_options);
  return response;
};

const parse_dump_from_location = async (dump_str) => {
  /* note, we need a better way to parse CSV.. */
  const filename = parse_dump_location(dump_str);
  const fs_async = promisify(fs.readFile);
  logger.info(`filename: ${filename}`);

  const raw_file = await fs_async(filename, 'utf-8');
  let array = raw_file.split('\n');

  const csv_parse = promisify(parse);
  array = await csv_parse(raw_file);

  // remove last element <newline>
  array.splice(-1, 1);
  return array;
};

const get_column_dump = async (url, args) => {
  const dump_str = await get_dump_column_str(url, args);
  const dump = parse_dump_from_location(dump_str);
  return dump;
};

const parse_dump_location = (dump_str) => {
  const location = dump_str.match(/dumped to CSV file '([\s\S]*?)'/, dump_str) ?
    dump_str.match(/dumped to CSV file '([\s\S]*?)'/, dump_str)[1] : '';

  logger.info(`location: ${location}`);
  return location;
};

const get_dbs = async (url, args) => {
  const stdin = (args.quick) ? '(cat << END \ny\nn\nn\nn\nn\nn\nn\nEND\n) |' : '';
  const sql_options = `--dbs ${args.arguments}`;

  const response = await shellout(stdin, url, sql_options);
  return String(response);
};

const parse_database = (table_str) => {
  const pre_db = table_str.match(/available databases[\s\S]*\n\n\[\d+/);

  /* quick sanity check */
  if (!pre_db) return [];

  let db_str = pre_db[0].split('[*]');

  /* remove first element (available databases) */
  db_str.shift();

  /* now strip new lines 'til the end */
  db_str = db_str.map((x) => x.replace(/\n[\s\S]*/, '').trim());
  return db_str;
};

const get_all_indices = (str, char) => {
  const indices = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] === char) indices.push(i);
  }
  return indices;
};

const get_databases = async (url, args) => {
  const db_string = await get_dbs(url, args);
  const databases = parse_database(db_string);
  const server_info = get_server_info(db_string);
  return { databases, server_info };
};

module.exports = {
  get_databases,
  get_tables,
  get_columns,
  get_column_dump,
  // for testing
  get_dbs,
  parse_database,
  get_dump_column_str,
};
