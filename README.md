# Installation
Clone the repo into your local folder. Install application:
```
npm install
```

# Export from ET
Open a package you need to export. Then select following columns in the order:
1.  Entity type
2.  Number
3.  Name
4.  Priority
5.  Status
6.  Type
7.  Description
8.  Execution Method
9.  Id
10.  Package
11.  Objective
12.  Pre Condition
13.  Post Condition
14.  Notes

Then export the package with default options: CSV, Unicode, Comma, Visible Columns Only, Include Header, Include Steps.
Save the file as __in.csv__ in the same folder with the current script.

# Run the script
Run
```
node parser.js
```
It will generate __out.xml__ in the same folder. Check it for correct values.

## Script parameters
By default, script will inherit ET package structure and replace top level with "Test Cases". For example, following __Test Cases|Regression Tests|FRONTEND APPS|Watching Recommendation UI__ will result in this TestLink folders __Test Cases > Regression Tests > FRONTEND APPS > Watching Recommendation UI__. If needed to modify the structure, use parameters: `level` and `root`:
* `level` - controls the number of packages to skip, when generating result xml. E.g. `node parser.js --level=3` applied to previous example will
  result in this folders __Test Cases > Watching Recommendation UI__. Default is `1`.
* `root` - define root folder name. Default is `Test Cases`.

# Import the package
Navigate to the root of the TestLink project. Start import by uploading file.
