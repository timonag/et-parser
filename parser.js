const parse = require("csv-parse");
const fs = require("fs");
const transform = require("stream-transform");
const XMLWriter = require("xml-writer");

const input = fs.createReadStream("in.csv");
const output = fs.createWriteStream("out.xml");
const parser = parse({from: 2});
const xw = new XMLWriter(true, (str, encoding) => output.write(str, encoding));
xw.startDocument('1.0', 'UTF-8').startElement("testsuite").writeAttribute("name", "Test Cases");
let testScript;
let oldExternalId = "";
const transformer = transform((record) => {
	let prevScript;
	if (typeof record === "object") {
		let step = {
			stepNum: record[13],
			description: record[14],
			expectedResult: record[15],
			data: record[16],
			notes: record[17]
		};
		if(record[0] === "TestScript") {
			prevScript = testScript;
			testScript = {
				number: record[1],
				name: record[2],
				priority: record[3],
				status: record[4],
				type: record[5],
				description: record[6],
				executionMethod: record[7],
				externalId: record[8].replace(/[{}]/g, ""),
				packagePath: record[9].split("|").slice(1),
				steps: [],
				preconditions: record[11],
				postconditions: record[12],
				objective: record[10]
			};
		}
		testScript.steps.push(step);
	}

	return prevScript;
});

parser.on("end", () => transformer.end("EOF"));

const convertToXML = transform((testScript) => {
	let importance = "2";
	switch (testScript.priority) {
		case "Blocker":
		case "Critical":
			importance = 3;
			break;
		case "Minor":
		case "Trivial":
			importance = 1;
			break;
	};
	let status = 1;
	switch (testScript.status) {
		case "In Progress":
			status = 1;
			break;
		case "Review Pending":
			status = 3;
			break;
		case "Approved":
			status = 7;
			break;
		case "Requires Rework":
			status = 4;
			break;
		case "Rejected":
			status = 5;
			break;
		case "On Hold":
			status = 6;
			break;
	};
	const execType = testScript.executionMethod === "JS Auto [E2E]" ? "2" : "1";
	testScript.packagePath.forEach((pathElem) => xw.startElement("testsuite").writeAttribute("name", pathElem));
	xw
		.startElement(() => "testcase")
			.writeAttribute("name", testScript.name)

			.startElement(() => "execution_type")
				.writeCData(execType)
			.endElement()

			.startElement(() => "summary")
				.writeCData(testScript.description)
			.endElement()

			.startElement(() => "importance")
				.writeCData(importance)
			.endElement()

			.startElement(() => "status")
				.writeCData(status)
			.endElement()

			.startElement(() => "preconditions")
				.writeCData(testScript.preconditions)
			.endElement()

			.startElement(() => "steps")
				testScript.steps.forEach(step => {
					let expectedResult = `<p>${step.expectedResult.replace(/\n/g, "</p><p>")}</p>`;
					if (step.data) {
						expectedResult += `<p><strong>Data:</strong></p><p>${step.data.replace(/\n/g, "</p><p>")}</p>`
					}
					if (step.notes) {
						let notes = step.notes.replace(/(SC-\d{3,5})/g, "<a href=\"https://jira.nyt.net/browse/$1\" target=\"_blank\">$1</a>");
						expectedResult += `<p><strong>Notes:</strong></p><p>${notes.replace(/\n/g, "</p><p>")}</p>`
					}
					xw.startElement(() => "step")
						.startElement(() => "step_number")
							.writeCData(step.stepNum)
						.endElement()
						.startElement(() => "actions")
							.writeCData(`<p>${step.description.replace(/\n/g, "</p><p>")}</p>`)
						.endElement()
						.startElement(() => "expectedresults")
							.writeCData(expectedResult)
						.endElement()
						.startElement(() => "execution_type")
							.writeCData(execType)
						.endElement()
					.endElement()
				});

	xw
			.endElement()
			.startElement(() => "custom_fields")
				.startElement(() => "custom_field")
					.startElement(() => "name")
						.writeCData("priority")
					.endElement()
					.startElement(() => "value")
						.writeCData(testScript.priority)
					.endElement()
				.endElement()
				.startElement(() => "custom_field")
					.startElement(() => "name")
						.writeCData("et_id")
					.endElement()
					.startElement(() => "value")
						.writeCData(testScript.externalId)
					.endElement()
				.endElement()
				.startElement(() => "custom_field")
					.startElement(() => "name")
						.writeCData("type")
					.endElement()
					.startElement(() => "value")
						.writeCData(testScript.type)
					.endElement()
				.endElement()
				.startElement(() => "custom_field")
					.startElement(() => "name")
						.writeCData("postconditions")
					.endElement()
					.startElement(() => "value")
						.writeCData(testScript.postconditions)
					.endElement()
				.endElement()
				.startElement(() => "custom_field")
					.startElement(() => "name")
						.writeCData("objective")
					.endElement()
					.startElement(() => "value")
						.writeCData(testScript.objective)
					.endElement()
				.endElement()
				.startElement(() => "custom_field")
					.startElement(() => "name")
						.writeCData("execution_type")
					.endElement()
					.startElement(() => "value")
						.writeCData(testScript.executionMethod)
					.endElement()
				.endElement()
				.startElement(() => "custom_field")
					.startElement(() => "name")
						.writeCData("number")
					.endElement()
					.startElement(() => "value")
						.writeCData(testScript.number)
					.endElement()
				.endElement()
			.endElement()
		.endElement()
		
		testScript.packagePath.forEach((pathElem) => xw.endElement());
});
convertToXML.on("end", () => {
	xw.endElement().endDocument();
	output.end();
});

input.pipe(parser).pipe(transformer, {end: false}).pipe(convertToXML).pipe(output, {end: false});
