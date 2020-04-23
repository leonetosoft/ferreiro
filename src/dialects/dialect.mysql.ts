import { DialectFunctions } from "./dialects.i";
import * as _ from 'lodash';

export class MySqlDialect implements DialectFunctions {

    getForeignKeysQuery(tableName: any, schemaName: any) {
        return "SELECT \
        K.CONSTRAINT_NAME as constraint_name \
      , K.CONSTRAINT_SCHEMA as source_schema \
      , K.TABLE_SCHEMA as source_table \
      , K.COLUMN_NAME as source_column \
      , K.REFERENCED_TABLE_SCHEMA AS target_schema \
      , K.REFERENCED_TABLE_NAME AS target_table \
      , K.REFERENCED_COLUMN_NAME AS target_column \
      , C.extra \
      , C.COLUMN_KEY AS column_key \
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS K \
      LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS C \
        ON C.TABLE_NAME = K.TABLE_NAME AND C.COLUMN_NAME = K.COLUMN_NAME \
      WHERE \
        K.TABLE_NAME = '" + tableName + "' \
        AND K.CONSTRAINT_SCHEMA = '" + schemaName + "';";
    }

    isForeignKey(record: any) {
        return _.isObject(record) && _.has(record, 'extra') && (record as any).extra !== "auto_increment";
    }

    isPrimaryKey(record: any) {
        return _.isObject(record) && _.has(record, 'constraint_name') && (record as any).constraint_name === "PRIMARY";
    }

    isUnique(record: any) {
        return _.isObject(record) && _.has(record, 'column_key') && (record as any).column_key.toUpperCase() === "UNI";
    }

    isSerialKey(record: any) {
        return _.isObject(record) && _.has(record, 'extra') && (record as any).extra === "auto_increment";
    }
}