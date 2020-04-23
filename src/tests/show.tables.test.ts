import { initConnection, buildEnv } from "./init.tests";
import { describe, beforeEach } from "mocha";
import { expect } from "chai";
import { join } from 'path';

let showTables;
describe('Configurer', () => {
    beforeEach(async () => {
        buildEnv();
        const nySeqAuto = await initConnection({
            camel: true,
            dialect: process.env.dialect as any,
            database: process.env.database as any,
            host: process.env.host as any,
            overwriteFile: true,
            output: '',
            pass: process.env.pass,
            port: process.env.port as any,
            schema: process.env.schema as any,
           // skipTables: [],
            storage: undefined,
            tables: ['servico', 'servico_faturamento'],
            user: process.env.user,
            debug: true,
            template: join(process.cwd(), 'templates'),
            outDir: ''
        });

        showTables = await nySeqAuto.showTables();
    });

    describe('Test Show Tables', () => {
        it('should run test and invoke hooks', (done) => {
            console.log(showTables);
            expect(showTables).to.be.an('array');
            done();
        });
    })
});