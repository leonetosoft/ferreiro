import { DialectFunctions } from "./dialects.i";
import * as _ from 'lodash';
import * as sequelize from 'sequelize';

export class PostgresDialect implements DialectFunctions {

    getForeignKeysQuery(tableName: any, schemaName: any) {
        return "SELECT \
      ccu.table_name AS source_table, \
      ccu.constraint_name AS constraint_name, \
      ccu.column_name AS source_column, \
      kcu.table_name AS target_table, \
      kcu.column_name AS target_column, \
      tc.constraint_type AS constraint_type, \
      c.is_identity AS is_identity \
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc \
    INNER JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu \
      ON ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME \
    LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc \
      ON ccu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME \
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu \
      ON kcu.CONSTRAINT_NAME = rc.UNIQUE_CONSTRAINT_NAME AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY' \
    INNER JOIN sys.COLUMNS c \
      ON c.name = ccu.column_name \
      AND c.object_id = OBJECT_ID(ccu.table_name) \
    WHERE ccu.table_name = " + sequelize.Utils.addTicks(tableName, "'");
    }

    isForeignKey(record: any) {
        return _.isObject(record) && _.has(record, 'constraint_type') && (record as any).constraint_type === "FOREIGN KEY";
    }

    isPrimaryKey(record: any) {
        return _.isObject(record) && _.has(record, 'constraint_type') && (record as any).constraint_type === "PRIMARY KEY";
    }

    isSerialKey(record: any) {
        return _.isObject(record) && exports.mssql.isPrimaryKey(record) && (_.has(record, 'is_identity') &&
        (record as any).is_identity);
    }
}