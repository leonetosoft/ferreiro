import { DialectFunctions } from "./dialects.i";
import * as _ from 'lodash';

export class SqLiteDialect implements DialectFunctions {

    getForeignKeysQuery(tableName: any, schemaName: any) {
      return "PRAGMA foreign_key_list(" + tableName + ");";
    }

    isPrimaryKey(record: any) {
      return _.isObject(record) && _.has(record, 'primaryKey') && (record as any).primaryKey === true;
    }
}