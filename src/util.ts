import { FerreiroCore, Options } from './ferreiro-core';

export function addInStr(str, index, string) {
    if (index > 0)
        return str.substring(0, index) + string + str.substring(index, str.length);
    else
        return string + str;
};

export function getAbsolutePath(folderPath, rootFolder/*, baseFolder = os.hostname()*/) {
    let srt = '';
    for (let i = 0; i < folderPath.length; i++) {
        if (folderPath[i] !== rootFolder[i]) {
            srt += folderPath[i] === '\\' ? '/' : folderPath[i];
        }
    }
    if (srt[0] !== '/') {
        srt = addInStr(srt, 0, '/');
    }
    return srt;
}

export const initFactory = ((opts: Options): Promise<FerreiroCore> => {
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

