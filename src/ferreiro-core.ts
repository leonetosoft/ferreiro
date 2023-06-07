import * as Sequelize from "sequelize";
import { DialectFunctions } from "./dialects/dialects.i";
import { SqLiteDialect } from "./dialects/dialect.sqlite";
import { MySqlDialect } from "./dialects/dialect.mysql";
import { PostgresDialect } from "./dialects/dialect.postgres";
import * as _ from 'lodash';
import { readdirSync, lstatSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import * as Handlebars from 'handlebars';
import * as camelcase from 'camelcase';
import { getAbsolutePath } from "./util";

export interface Options {
    host: string,
    database: string | Sequelize.Sequelize;
    user: string;
    pass: string;
    port: number;
    output: string;
    dialect: 'postgres' | 'mysql' | 'sqlite';
    tables?: string[];
    skipTables?: string[];
    camel: boolean;
    overwriteFile: boolean;
    schema: string;
    storage: string;
    debug: boolean;
    template: string;
    outDir: string;
}

export class KeyField {
    constraint_name: string;
    source_schema: string;
    source_table: string;
    source_column: string;
    target_schema: string;
    target_table: string;
    target_column: string;
    extra: string;
    column_key: string;
}

export class TableField {
    type: string;
    allowNull: boolean;
    defaultValue: string;
    comment: string;
    special: any[];
    primaryKey: boolean;
    isForeignKey: boolean;
    isPrimaryKey: boolean;
    isUniqueKey: boolean;
    isSerialKey: boolean;
    isIdentity: boolean;
    identity: string;
    name: string;
    foreignKey: KeyField;
    uniqueKey: KeyField;
    serialKey: KeyField;
}

export class TableInformation {
    tablename: string;
    fields: TableField[]
}
export class FerreiroCore {
    db: Sequelize.Sequelize;
    queryInterface: DialectFunctions;
    opts: Options;

    constructor({
        host, database,
        user, pass,
        port, output = undefined,
        dialect, tables = undefined,
        skipTables = undefined, camel,
        overwriteFile = undefined, schema = undefined, debug }: Options, callbackConnection?: (err, instance: FerreiroCore) => void) {

        if (debug) {
            console.table({ ...arguments[0] });
        }

        const sequelizeOpts: Sequelize.Options = {};

        if (dialect === 'sqlite') {
            sequelizeOpts.storage = database as string;
        }

        sequelizeOpts.dialect = dialect;
        sequelizeOpts.host = host;
        sequelizeOpts.port = port;
        sequelizeOpts.logging = debug;

        if (!schema) {
            schema = 'public';
        }

        switch (dialect) {
            case 'sqlite':
                this.queryInterface = new SqLiteDialect();
                break;

            case 'mysql':
                this.queryInterface = new MySqlDialect();
                break;

            case 'postgres':
                this.queryInterface = new PostgresDialect();
                break;
        }

        if (database instanceof Sequelize.Sequelize) {
            this.db = database;
        } else {
            this.db = new Sequelize.Sequelize(database, user, pass, sequelizeOpts || {});
            this.db.authenticate().then(rs => {
                if (callbackConnection)
                    callbackConnection(undefined, this);
            }).catch(err => {
                if (callbackConnection)
                    callbackConnection(err, undefined);
            });
        }

        this.opts = { ...arguments[0] };
    }

    get isMySql(): boolean {
        return this.opts.dialect === 'mysql';
    }

    get isPg(): boolean {
        return this.opts.dialect === 'postgres';
    }

    get isSqlite(): boolean {
        return this.opts.dialect === 'sqlite';
    }

    /**
     * Return all tables
     */
    async showTables() {
        let showTablesQuery;
        if (this.isPg && this.opts.schema) {
            const showTables = this.queryInterface.showTablesQuery(this.opts.schema);

            showTablesQuery = await this.db.query(showTables, {
                raw: true,
                type: Sequelize.QueryTypes.SHOWTABLES
            })
            return _.flatten(showTablesQuery);
        } else {
            showTablesQuery = await this.db.getQueryInterface().showAllTables();
            return showTablesQuery;
        }
    }

    /* async describeTable(tableName) {
         creturn await this.db.getQueryInterface().describeTable(tableName);
     }*/
    /**
     * Get table foreign keys
     */
    async mapTable(): Promise<TableInformation[]> {
        let tableInfos: TableInformation[] = [];
        let tables = await this.showTables();
        if (this.opts.tables) {
            tables = _.intersection(tables, this.opts.tables);
        } else if (this.opts.skipTables) {
            tables = _.difference(tables, this.opts.skipTables);
        }

        //console.log(tables);
        for (const table of tables) {
            const sql = this.queryInterface.getForeignKeysQuery(table, this.opts.database);

            const tableInf = await this.db.query(sql, {
                raw: true,
                type: Sequelize.QueryTypes.SELECT
            }) as KeyField[];

            const tableDescrible = await this.db.getQueryInterface().describeTable(table) as (key: string) => TableField;

            if (this.isPg) {
                try {
                    const pgIdentity = await this.db.query(`SELECT
                is_identity, identity_generation, column_name
             FROM
                information_schema.COLUMNS
             WHERE
                TABLE_NAME = '${table}' and is_identity = 'YES';`, {
                        raw: true,
                        type: Sequelize.QueryTypes.SELECT
                    }) as { is_identity: 'YES' | 'NO', identity_generation: string, column_name: string }[];

                    if (pgIdentity && pgIdentity.length) {
                        tableDescrible[pgIdentity[0].column_name].isIdentity = true;
                        tableDescrible[pgIdentity[0].column_name].identity = pgIdentity[0].identity_generation;
                    }
                } catch (error) {
                    console.warn(`Pg < 10.0 identity_generation not implemented`);
                }
            }
            for (const field in tableDescrible) {
                const findTab = tableInfos.find(el => el.tablename === table);
                const fkField = tableInf.filter(el => el.source_column === field);

                //writeFileSync(`testee/test_${table}_${field}.json`, JSON.stringify(fkField));
                let fieldItem: TableField = {
                    ...tableDescrible[field],
                    name: field,
                    isForeignKey: this.queryInterface.isForeignKey ? fkField.findIndex(el => this.queryInterface.isForeignKey(el) && el.target_table !== null) !== -1 : false,
                    isPrimaryKey: this.queryInterface.isPrimaryKey ? fkField.findIndex(el => this.queryInterface.isPrimaryKey(el)) !== -1 : false,
                    isUniqueKey: this.queryInterface.isUnique ? fkField.findIndex(el => this.queryInterface.isUnique(el)) !== -1 : false,
                    isSerialKey: this.queryInterface.isSerialKey ? fkField.findIndex(el => this.queryInterface.isSerialKey(el)) !== -1 : false,
                    foreignKey: fkField.find(el => this.queryInterface.isForeignKey && this.queryInterface.isForeignKey(el)  && el.target_table !== null),
                    serialKey: fkField.find(el => this.queryInterface.isSerialKey && this.queryInterface.isSerialKey(el)),
                    uniqueKey: fkField.find(el => this.queryInterface.isUnique && this.queryInterface.isUnique(el)),
                };

                if (!findTab) {
                    tableInfos.push({
                        tablename: table,
                        fields: [fieldItem]
                    });
                } else {
                    findTab.fields.push(fieldItem);
                }
            }
        }
        return tableInfos;
    }

    async build() {
        const dbData = await this.mapTable();
        //writeFileSync('tableinf.json', JSON.stringify(dbData, null, 2));
        const files = this.compileTemplateDir();
        this.processFiles(files, dbData);
    }

    compileTemplateDir(dirPath = this.opts.template, files: string[] = []) {
        const stat = lstatSync(dirPath);
        if (stat.isFile()) {
            files.push(join(dirPath));
            return files;
        }
        const dirLs = readdirSync(dirPath);
        for (const dir of dirLs) {
            const stat = lstatSync(join(dirPath, dir));
            if (stat.isDirectory()) {
                this.compileTemplateDir(join(dirPath, dir), files);
            } else {
                //this.processFileTemplate(join(dirPath, dir), dbData);
                files.push(join(dirPath, dir));
            }
        }

        return files;
    }

    getExtension(path): string {
        if (path === undefined || path === null) {
            return "";
        }

        var basename = path.split(/[\\/]/).pop(),  // extract file name from full path ...
            // (supports `\\` and `/` separators)
            pos = basename.lastIndexOf(".");       // get last position of `.`

        if (basename === "" || pos < 1)            // if file name is empty or ...
            return "";                             //  `.` not found (-1) or comes first (0)

        return basename.slice(pos + 1);            // extract extension ignoring `.`
    }


    processDefaultHelpers() {
        Handlebars.registerHelper('upper', function (string) {
            return string.toUpperCase();
        });

        Handlebars.registerHelper('lower', function (string) {
            return string.toLowerCase();
        });

        Handlebars.registerHelper('exists', function (val) {
            return val !== undefined && val !== null;
        });

        Handlebars.registerHelper('raw-helper', function (options) {
            return options.fn();
        });

        Handlebars.registerHelper('keys', function (obj) {
            return Object.keys(obj);
        });

        Handlebars.registerHelper('camelcase', function (string: any, pascalCase = true) {
            return camelcase(string, { pascalCase: pascalCase === true });
        });

        Handlebars.registerHelper('date', function (format) {
            return new Date();
        });

        Handlebars.registerHelper('negate', function (format) {
            return !format;
        });

        Handlebars.registerHelper('ifequal', function (comp1, comp2) {
            return comp1 === comp2;
        });

        Handlebars.registerHelper('arrayContainString', function (arr, value) {
            return arr.findIndex(el => el === value) !== -1;
        });
    }

    generateEsModules(imports: (keys: string) => string[]) {
        let importsStr = [];
        for (const importItem in imports) {
            let str = `import { ${imports[importItem].join(', ')} } from '${importItem}';`;
            importsStr.push(str);
        }
        return importsStr.join('\n');
    }


    processFiles(files: string[], dbData: TableInformation[]) {
        const hbsFiles = files.filter(el => this.getExtension(el).toLowerCase() === 'hbs');
        const scriptsFile = files.filter(el => this.getExtension(el).toLowerCase() === 'js');
        const configFile = files.find(el => this.getExtension(el).toLowerCase() === 'json');

        this.processDefaultHelpers();

        let importsConfig = {};
        let enterData = {};

        if (configFile) {
            const jsonConfig = require(configFile);
            importsConfig = jsonConfig.imports;
            enterData = jsonConfig.data;
        }

        //let imports: any = {};
        let filesImports = {};
        let lastUnicalName = undefined;
        let vars = {};

        Handlebars.registerHelper('getData', function (prefix, unicalName, sufix) {

        });

        Handlebars.registerHelper('fileName', function (unicalName) {
            const args: any[] = [...arguments] as any;
            unicalName = unicalName + (args.length > 2 ? args.map((el, index) => {
                if (index > 0 && (_.isString(el) || _.isNumber(el)) && el !== undefined && el !== null) {
                    return el;
                }
            }).join('') : '');

            if (!filesImports[unicalName]) {
                filesImports[unicalName] = {};
                lastUnicalName = unicalName;
            }
            return unicalName;
        });

        Handlebars.registerHelper('set', function (name, value) {
            const args: any[] = [...arguments] as any;

            vars[name + lastUnicalName] = value + (args.length > 3 ? args.map((el, index) => {
                if (index > 1 && (_.isString(el) || _.isNumber(el)) && el !== undefined && el !== null) {
                    return el;
                }
            }).join('') : '');
            return '';
        });

        Handlebars.registerHelper('get', function (name, value) {
            return vars[name + lastUnicalName];
        });

        Handlebars.registerHelper('import', function (importItem) {

            if (!lastUnicalName) {
                throw new Error('Please init filename to import item ... filename [prefix name sufix]');
            }
            const imports = filesImports[lastUnicalName];

            for (const item in importsConfig) {
                //  console.log(item);
                const findName = importsConfig[item].find(el => importItem === el);
                if (findName) {
                    if (imports[item]) {
                        if (imports[item].findIndex((el) => el === importItem) === -1) {
                            imports[item].push(findName);
                        }
                    } else {
                        imports[item] = [findName];
                    }
                    return findName;
                } /*else {
                    return importItem;
                }*/
            }
            //console.warn(`Failed to import ${importItem}`);
            return importItem;
        });

        for (const scriptFile of scriptsFile) {
            const jsScript = require(scriptFile);
            jsScript(Handlebars);
        }

        //for (const data of dbData) {
        let genCount = 0;
        console.log(`Loaded ${dbData.length} tables of db ${this.opts.database}`);
        console.log(`Loaded ${configFile} config file`);
        console.log(`Loaded ${scriptsFile.length} script file(s)`);
        console.log(`Find ${hbsFiles.length} file(s) in ${this.opts.template} template.`);
        //writeFileSync('test.json', JSON.stringify(dbData));
        for (const hbsFile of hbsFiles) {
            const str = readFileSync(hbsFile).toString('utf-8');
            try {
                const template = Handlebars.compile(str);
               /* console.log(JSON.stringify({
                    tableData: dbData,
                    data: enterData,
                    getId: () => lastUnicalName
                }))*/
                const templateBuild = template({
                    tableData: dbData,
                    data: enterData,
                    getId: () => lastUnicalName
                });
                const beginFiles = templateBuild.split('#begin_file');
                for (const templateStr of beginFiles) {
                    if (templateStr === '') {
                        continue;
                    }
                    const lines = templateStr.split('\n');
                    const destPath = join(this.opts.outDir,
                        getAbsolutePath(dirname(hbsFile), this.opts.template));

                    if (!existsSync(destPath)) {
                        mkdirSync(destPath, { recursive: true });
                    }

                    if (lines[1].indexOf(`/`) !== -1 && !existsSync(join(destPath, dirname(lines[1])))) {
                        mkdirSync(join(destPath, dirname(lines[1])), { recursive: true });
                    }

                    genCount++;

                    if (!this.opts.overwriteFile && existsSync(join(destPath, lines[1]))) {
                        console.error(`Fail generate ${join(destPath, lines[1])} file already exixts (--overwriteFile is false)`);
                        continue;
                    }
                    writeFileSync(
                        join(destPath, lines[1].replace(/(\r\n|\n|\r)/gm, "")),
                        this.generateEsModules(filesImports[lines[1]]) +
                        lines.reduce((prev, curr, index) => {
                            if (index > 1) {
                                return prev + curr + '\n';
                            } else {
                                return "";
                            }
                        }, ''), {
                            encoding: 'utf-8',
                            flag: 'w'
                        });
                }
            } catch (error) {
                console.error(`Error to compile template ${hbsFile}`);
                throw error;
            }
        }

        console.log(`Generated ${genCount} file(s) in ${this.opts.outDir}.`);
        process.exit(1);
    }



}