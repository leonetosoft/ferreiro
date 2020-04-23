import * as dotenv from 'dotenv';
import { join } from 'path';
import { FerreiroCore, Options } from '../ferreiro-core';

export function buildEnv() {

    console.log(`buildEnv: ` + join(process.cwd(), process.argv[5].replace('--', '')));

    const result = dotenv.config({
        path: join(process.cwd(), process.argv[5].replace('--', ''))
    });


    if (result.error) {
        console.log('Def env variables.')
        throw result.error;

    }
}

export const initConnection = ((opts: Options): Promise<FerreiroCore> => {
    return new Promise((resolve, reject) => {

        const initFunc = (err, inst) => {
            if (err) {
                reject(err);
            } else {
                resolve(inst);
            }
        }

        new FerreiroCore({
            ...opts
        }, initFunc);
    });
});

