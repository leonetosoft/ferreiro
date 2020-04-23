# Ferreiro
Automatically generate your codes based on any database: postgres, mysql, mssql or sqlite.
Through a relational database you can automatically generate the development files:

- Models
- Forms
- Sql's
- Anything you want

[Get Started](#Get%20Started)
-   [Install](#Install)
-   [Set up the environment](#Set%20up%20the%20environment)
-   [Generate the first codes](#Generate%20the%20first%20codes)
    -   [Examples](#Examples)
        -   [Create table named files containing information about them](#Create%20table%20named%20files%20containing%20information%20about%20them)
        -   [Create file containing the name of the tables and their fields](#Create%20file%20containing%20the%20name%20of%20the%20tables%20and%20their%20fields)
        -   [Sending extra information to the template:](#Sending%20extra%20information%20to%20the%20template)
        -   [Create first javascript helper](#Create%20first%20javascript%20helper)

# Get Started
## Install
[Node Js ](https://nodejs.org/ "NodeJs ")v10 or higher installation required

Globally install the package:
```shell
npm install ferreiro -g
```
Run the command below to verify the installation:
```shell
ferreiro --help
```
The command should display the list of options:

```shell
ferreiro --help
Usage: ferreiro [options]

Options:
  --genenv                                      Generate env file in root path
  --dialect                                     Select dialect postgres, mysql or mssql
  --database <name>                             Name of database
  --schema <schema name>                        schema
  --host <host>                                 Host of database
  --port <port>                                 Port number
  --user  <host>                                User of database
  --pw                                          Password of database
  --env  <path>                                 User of database
  --tables <table1, table2, ...>                tables  of db
  --skipTables <table1, table2, ...>            skip tables of db
  --template <path>                             path of template generate files
  --overwriteFile <true|false (default false)>  overwrite file in out dir
  --dbug <true|false>                           Show dbug logs
  --outDir <path>                               path of generated files
  -h, --help                                    output usage information
```

## Set up the environment
Run the command below to create the environment configuration file:
```shell
ferreiro --createenv
```
Configure o arquivo .env-gen.
```shell
#FERREIRO ENV VARIABLES
dialect = [postgres, mysql, mssql or sqlite]
database = [...name of database]
host = 127.0.0.1
pass = [..pass]
port = [..set a port]
schema = [..schema only in pg]
user = [..set user]
```
##  Generate the first codes
Ferreiro is divided into two parts:
- Core: Analyzes the data in the database and passes the template as its body
- Template: Analyzes the data coming from the core to write files depending on the logic of the template

All logic of the template is written using the tool handlebarsjs, for more information see the documentation of this tool.

Rest assured, you will understand everything through practical examples.
### Examples
#### Create table named files containing information about them
Create a folder with the name of your choice, this folder will contain all files related to the template.
In our case the folder name will be: **new-template**
Inside the folder create a folder with the name of **example01**:
In examble01/ create file named **example01/index.hbs** content:

```
{{#each this.tableData}}
#begin_file
{{fileName '' (camelcase this.tablename true) '.txt'}}
Name of table {{this.tablename}}

Fields: 
{{#each this.fields}}
Name: {{this.name}}
    type: {{this.type}}
    allowNull: {{this.allowNull}}
    defaultValue: {{this.defaultValue}}
    comment: {{this.comment}}
    primaryKey: {{this.primaryKey}}
    isIdentity: {{this.isIdentity}}
    identity: {{this.identity}}
    isPrimaryKey: {{this.isPrimaryKey}}
    isUniqueKey: {{this.isUniqueKey}}
    isSerialKey: {{this.isSerialKey}} (only pg)

    isForeignKey: {{this.isForeignKey}}
    {{#if this.isForeignKey}}
    Fk Information:
        constraint_name: {{this.foreignKey.constraint_name}}
        source_schema: {{this.foreignKey.source_schema}}
        source_table: {{this.foreignKey.source_table}}
        source_column: {{this.foreignKey.source_column}}
        target_schema: {{this.foreignKey.target_schema}}
        target_table: {{this.foreignKey.target_table}}
        target_column: {{this.foreignKey.target_column}}
        contype: {{this.foreignKey.contype}}
        extra: {{this.foreignKey.extra}}
    {{/if}}
---------------------
{{/each}}
{{/each}}
```

Generate the example template and see the output that will be sent to the directory informed in "outDir"

```shell
ferreiro --template ./ --outDir ./build-gen --env .env-gen --overwriteFile true
```
```
    Loaded 93 tables of db TEST
    Loaded undefined config file
    Loaded 0 script file(s)
    Find 1 file(s) in /home/user/new-example template.
    Generated 93 file(s) in /new-example/build-gen.
```
The command will generate the files based on your database, inside the build-gen folder.

#### Create file containing the name of the tables and their fields
Create another example ./example02/index.hbs containing:
```
    #begin_file
    {{fileName 'lists.txt'}}
    {{#each this.tableData}}
    {{this.tablename}}
     Fields: {{#each this.fields}}{{this.name}},{{/each}}
    {{/each}}
```
```shell
ferreiro --template ./ --outDir ./build-gen --env .env-gen --overwriteFile true
```

#### Sending extra information to the template

To send extra information you need to create a .json file from the root of the template, see the example:

create file ./example03/config.json

containing:

```json
{
	"data": {
		"extra-str": "Hello extra info",
		"extra-obj": {
			"name": "Leonardo",
			"age": "26"
		},
		"extra-array": [{
			"name": "Teste"
		}, {
			"name": "Teste2"
		}]
	}
}
```

create file ./example03/index.hbs
containing:
```
    #begin_file
    {{fileName 'test-extra.txt'}}
    Extra string: {{this.data.extra-str}}
    
    Extra obj:
     name: {{this.data.extra-obj.name}}
     age: {{this.data.extra-obj.age}}
    
     
    Extra array:
    {{#each this.data.extra-array}}
    name: {{this.name}}
    {{/each}}
```

```shell
ferreiro --template ./ --outDir ./build-gen --env .env-gen --overwriteFile true
```

#### Create first javascript helper
Create another example ./example04/helper.js containing:

```javascript
module.exports = (Handlebars) => {
    Handlebars.registerHelper('sum', function (val1, val2) {
        return Number(val1) + Number(val2);
    });

    Handlebars.registerHelper('concat', function (val1, val2) {
        return val1 + val2;
    });

    Handlebars.registerHelper('autor', function (val1, val2) {
        return "Ferreiro";
    });
}
```

Create hbs file ./example04/index.js containing:
```
    #begin_file
    {{fileName 'test-helper.txt'}}
    Sum 1: {{sum 40 20}}
    Sum 2: {{sum 15 15}}
    
    Name: {{concat 'Ferreiro' '-v1'}}
    
    by {{autor}}
	
```
Build:

```shell
ferreiro --template ./ --outDir ./build-gen --env .env-gen --overwriteFile true
```

after template build:
```
    Sum 1: 60
    Sum 2: 30
    
    Name: Ferreiro-v1
    
    by Ferreiro
    
```
See more about helpers at [Handlebars Helpers](https://handlebarsjs.com/guide/#custom-helpers "Handlebars Helpers")

### Default helpers
#### upper [string]
upper case of text
#### lower [string]
lower case of text
#### exists [val]

    return true if val !== undefined && val !== null

#### raw-helper
use to template contains {{
see:

    {{{{raw-helper}}}} 
    {{goku!}}
    {{{{/raw-helper}}}}

build to

    {{goku!}}
#### keys [obs]
return Object.keys(obj)

#### camelcase [string] [boolean pascalCase  (default true)]
camelcase lib see: [Camelcase](https://www.npmjs.com/package/camelcase)

#### date

    return new Date();

#### negate [arg]

    return !arg;

#### ifequal [comp1] [comp2]

    return comp1 === comp2;
#### arrayContainString [arr] [value]

    return  arr.findIndex(el  =>  el === value) !== -1;

#### fileName [...args]
set a file name ... 

#### set [name] [value]
create template variable

example:

    #begin_file
    {{fileName 'test.txt'}}
    {{set 'age' '26'}}
    {{set 'name' 'Leonardo'}}
    Name: {{get 'name'}}
    Age: {{get 'age'}}

build to:

    Name: Leonardo
    Age: 26

### Special Thank's
 - [TypeGraphql](https://typegraphql.com/)
 - [RobinBuschmann/sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript)
 - [SequelizeAuto](https://github.com/sequelize/sequelize-auto)
 - [Sequelize](https://sequelize.org/)
 - [Commander](https://www.npmjs.com/package/commander)
 - [dotenv](https://www.npmjs.com/package/dotenv)
 - [handlebars](https://www.npmjs.com/package/handlebars)
 - [lodash](https://lodash.com/)
 - [mkdirp](https://www.npmjs.com/package/mkdirp)