import { initConnection, buildEnv } from "./init.tests";
import { join } from 'path'/*
(async () => {
    buildEnv();
const nySeqAuto = await initConnection({
    camel: true,
    dialect: process.env.dialect as any,
    database: process.env.database as any,
    host: process.env.host as any,
    noWrite: true,
    output: '',
    pass: process.env.pass,
    port: process.env.port as any,
    schema: process.env.schema as any,
   // skipTables: [],
    storage: undefined,
   // tables: [],
    user: process.env.user,
    debug: true,
    template: join(process.cwd(), 'templates'),
    outDir: join(process.cwd(), 'buil-gen')
});

await nySeqAuto.build();
})();

*/


let showTables;
describe('Configurer', function() {
    this.enableTimeouts(false) 
    beforeEach(async () => {    buildEnv();
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
            tables: ['profissional'/*, 'servico_faturamento', 'paciente', 'ocorrencia'*/],
            user: process.env.user,
            debug: false,
            template: join(process.cwd(), 'templates'),
            outDir: join(process.cwd(), 'buil-gen')
        });
        
        await nySeqAuto.build();
    });

    describe('Test Show Tables', () => {
        it('should run test and invoke hooks', (done) => {
            done();
        });
    })
});