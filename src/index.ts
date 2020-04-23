import * as program from 'commander';
import * as dotenv from 'dotenv';
import { initFactory } from './util';
import { resolve, join } from 'path'
import { writeFileSync } from 'fs';

program
    .option('--genenv', 'Generate env file in root path')
    .option('--dialect', 'Select dialect postgres, mysql or mssql')
    .option('--database <name>', 'Name of database')
    .option('--schema <schema name>', 'schema')
    .option('--host <host>', 'Host of database')
    .option('--port <port>', 'Port number')
    .option('--user  <host>', 'User of database')
    .option('--pw', 'Password of database')
    .option('--env  <path>', 'User of database')
    .option('--tables <table1, table2, ...>', 'tables  of db')
    .option('--skipTables <table1, table2, ...>', 'skip tables of db')
    .option('--template <path>', 'path of template generate files')
    .option('--overwriteFile <true|false (default false)>', 'overwrite file in out dir')
    .option('--dbug <true|false>', 'Show dbug logs')
    .option('--outDir <path>', 'path of generated files');

program.parse(process.argv);

if(program.genenv) {
    writeFileSync(join(process.cwd(), '.env-gen'), `#FERREIRO ENV VARIABLES\ndialect = [postgres, mysql, mssql or sqlite]
database = [...name of database]
host = 127.0.0.1
pass = [..pass]
port = [..set a port]
schema = [..schema only in pg]
user = [..set user]`);
console.log(`Env generated in ${join(process.cwd(), '.env-gen')} OK`)
    process.exit(1);
}


(async () => {
    let database = program.env.database;
    let dialect = program.env.dialect;
    let schema = program.env.schema;
    let host = program.env.host;
    let port = program.env.port;
    let user = program.env.user;
    let pw = program.env.pw;

    if (program.env) {
        const result = dotenv.config({
            path: program.env
        });
        if (result.error) {
            console.log(`It was not possible to find the environment configuration file ${program.env}.`)
            throw result.error
        }

        database = process.env.database as any;
        dialect = process.env.dialect as any;
        schema = process.env.schema as any;
        host = process.env.host as any;
        port = process.env.port as any;
        user = process.env.user as any;
        pw = process.env.pass;
    }

    const nySeqAuto = await initFactory({
        dialect: dialect,
        database: database,
        host: host,
        pass: pw,
        schema: schema,
        port: port,
        user: user,
        camel: true,
        overwriteFile: program.overwriteFile ? program.overwriteFile === 'true' : false,
        output: '',
        skipTables: program.skipTables ? program.skipTables.split(',') : [],
        storage: undefined,
        tables: program.tables ? program.tables.split(',') : undefined,
        debug: program.dbug ? program.dbug === 'true' : false,
        template: resolve(program.template),
        outDir: resolve(program.outDir)
    });

    await nySeqAuto.build();
})();

