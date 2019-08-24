import assert from 'assert';
import { baseRules, secureUserInput } from '../src/index';

// tslint:disable:object-literal-sort-keys

// Simple tests
const stringTests = {
	string: 'abc',
	stringFromNumber: 1234,
	stringDefaultValue: undefined,
	stringMinLength: 'abc',
	stringMaxLength: 'abc',
	stringMustIncludeSpecialChar: 'a!bc',
	stringErrorMustIncludeSpecialChar: 'abc',
	stringMustIncludeUppercaseLetter: 'abC',
	stringErrorMustIncludeUppercaseLetter: 'abc',
	stringMustIncludeLowercaseLetter: 'aBC',
	stringErrorMustIncludeLowercaseLetter: 'ABC',
	stringRemoveNonVisibleCharsReturn: 'abc\ndef',
	stringRemoveNonVisibleCharsControl: 'abc\ndef',
};
const stringRules = {
	string: baseRules.string,
	stringFromNumber: baseRules.string,
	stringDefaultValue: { ...baseRules.string, defaultValue: 'def' },
	stringMinLength: { ...baseRules.string, minLength: 2 },
	stringMaxLength: { ...baseRules.string, maxLength: 4 },
	stringMustIncludeSpecialChar: { ...baseRules.string, mustIncludeSpecialChar: true },
	stringErrorMustIncludeSpecialChar: { ...baseRules.string, mustIncludeSpecialChar: true },
	stringMustIncludeUppercaseLetter: { ...baseRules.string, mustIncludeUppercaseLetter: true },
	stringErrorMustIncludeUppercaseLetter: { ...baseRules.string, mustIncludeUppercaseLetter: true },
	stringMustIncludeLowercaseLetter: { ...baseRules.string, mustIncludeLowercaseLetter: true },
	stringErrorMustIncludeLowercaseLetter: { ...baseRules.string, mustIncludeLowercaseLetter: true },
	stringRemoveNonVisibleCharsReturn: baseRules.string,
	stringRemoveNonVisibleCharsControl: baseRules.string,
};
const stringExpected = {
	string: 'abc',
	stringFromNumber: '1234',
	stringDefaultValue: 'def',
	stringMinLength: 'abc',
	stringMaxLength: 'abc',
	stringMustIncludeSpecialChar: 'a!bc',
	stringErrorMustIncludeSpecialChar: undefined,
	stringMustIncludeUppercaseLetter: 'abC',
	stringErrorMustIncludeUppercaseLetter: undefined,
	stringMustIncludeLowercaseLetter: 'aBC',
	stringErrorMustIncludeLowercaseLetter: undefined,
	stringRemoveNonVisibleCharsReturn: 'abc\ndef',
	stringRemoveNonVisibleCharsControl: 'abc\ndef',
};

const numberTests = {
	number: 1234,
	numberRequired: 1234,
	numberErrorRequired: undefined,
	numberDefaultValue: undefined,
	numberMin: 1234,
	numberErrorMin: 1234,
	numberMax: 1234,
	numberErrorMax: 1234,
	numberDecimalPlaces: Math.PI,
	numberAsString: 1234,
	numberErrorString: 'one',
	numberFromString: '1234',
	numberReallyLong: 123456789012345678901234567890,
};
const numberRules = {
	number: baseRules.number,
	numberRequired: { ...baseRules.number, required: true },
	numberErrorRequired: { ...baseRules.number, required: true },
	numberDefaultValue: { ...baseRules.number, defaultValue: 4321 },
	numberMin: { ...baseRules.number, min: 1233 },
	numberErrorMin: { ...baseRules.number, min: 1235 },
	numberMax: { ...baseRules.number, max: 1235 },
	numberErrorMax: { ...baseRules.number, max: 1233 },
	numberDecimalPlaces: { ...baseRules.number, decimalPlaces: 2 },
	numberAsString: { ...baseRules.number, asString: true },
	numberErrorString: baseRules.number,
	numberFromString: baseRules.number,
	numberReallyLong: baseRules.number,
};
const numberExpected = {
	number: 1234,
	numberRequired: 1234,
	numberErrorRequired: undefined,
	numberDefaultValue: 4321,
	numberMin: 1234,
	numberErrorMin: undefined,
	numberMax: 1234,
	numberErrorMax: undefined,
	numberDecimalPlaces: '3.14',
	numberAsString: '1234',
	numberErrorString: undefined,
	numberFromString: 1234,
	numberReallyLong: 123456789012345678901234567890,
};

const booleanTests = {
	boolean: true,
	boolean2: false,
	booleanRequired: true,
	booleanRequired2: false,
	booleanRequiredError: undefined,
	booleanDefaultValue: undefined,
	booleanTo01: true,
	booleanTo012: false,
	booleanAsString: true,
	booleanAsString2: false,
	booleanAsString01: true,
	booleanAsString012: false,
	booleanFromString: 'a',
	booleanFromString2: '',
	booleanFromNull: null,
	booleanFromUndefined: undefined,
	booleanFromNumber: 1,
	booleanFromNumber2: 0,
};
const booleanRules = {
	boolean: baseRules.boolean,
	boolean2: baseRules.boolean,
	booleanRequired: { ...baseRules.boolean, required: true },
	booleanRequired2: { ...baseRules.boolean, required: true },
	booleanRequiredError: { ...baseRules.boolean, required: true },
	booleanDefaultValue: { ...baseRules.boolean, defaultValue: true },
	booleanTo01: { ...baseRules.boolean, to01: true },
	booleanTo012: { ...baseRules.boolean, to01: true },
	booleanAsString: { ...baseRules.boolean, asString: true },
	booleanAsString2: { ...baseRules.boolean, asString: true },
	booleanAsString01: { ...baseRules.boolean, asString01: true },
	booleanAsString012: { ...baseRules.boolean, asString01: true },
	booleanFromString: baseRules.boolean,
	booleanFromString2: baseRules.boolean,
	booleanFromNull: baseRules.boolean,
	booleanFromUndefined: baseRules.boolean,
	booleanFromNumber: baseRules.boolean,
	booleanFromNumber2: baseRules.boolean,
};
const booleanExpected = {
	boolean: true,
	boolean2: false,
	booleanRequired: true,
	booleanRequired2: false,
	booleanRequiredError: undefined,
	booleanDefaultValue: true,
	booleanTo01: 1,
	booleanTo012: 0,
	booleanAsString: 'true',
	booleanAsString2: 'false',
	booleanAsString01: '1',
	booleanAsString012: '0',
	booleanFromString: undefined,
	booleanFromString2: false,
	booleanFromNull: false,
	booleanFromUndefined: undefined,
	booleanFromNumber: true,
	booleanFromNumber2: false,
};

const emailTests = {
	email: 'a@a.aa',
	email2: 'a.a@a.a.aa',
	emailError: 'a',
	emailError2: 'a.com',
	emailError3: 'a@a',
	emailError4: 'a@a..a',
	emailError5: 'a@.a',
	emailRequired: 'a@a.aa',
	emailRequiredError: undefined,
	emailDefaultValue: undefined,
};
const emailRules = {
	email: baseRules.email,
	email2: baseRules.email,
	emailError: baseRules.email,
	emailError2: baseRules.email,
	emailError3: baseRules.email,
	emailError4: baseRules.email,
	emailError5: baseRules.email,
	emailRequired: { ...baseRules.email, required: true },
	emailRequiredError: { ...baseRules.email, required: true },
	emailDefaultValue: { ...baseRules.email, defaultValue: 'a@m.com' },
};
const emailExpected = {
	email: 'a@a.aa',
	email2: 'a.a@a.a.aa',
	emailError: undefined,
	emailError2: undefined,
	emailError3: undefined,
	emailError4: undefined,
	emailError5: undefined,
	emailRequired: 'a@a.aa',
	emailRequiredError: undefined,
	emailDefaultValue: 'a@m.com',
};

const dateTests = {
	date: '7/4/2019',
	date1: 'July 4th 2019',
	//date2: '4th of july 2019',
	date3: '7/4',
	//date4: 'Tuesday',
	date5: 1,
	//date6: 'noon',
	//date7: 1562212800,
	date8: 1562212800000,
	dateError: 'asdf',
	dateError2: '12/32/2019',
	dateError3: 'tomorrow morning',
	dateError4: '12/-1/2019',
	dateRequired: '7/4/2019',
	dateRequiredError: undefined,
	//dateIncludeTime: 'now',
	dateFormat: '2019-07-04',
	dateDefaultValue: undefined,
};
const dateRules = {
	date: baseRules.date,
	date1: baseRules.date,
	//date2: baseRules.date,
	date3: baseRules.date,
	//date4: baseRules.date,
	date5: baseRules.date,
	//date6: baseRules.date,
	//date7: baseRules.date,
	date8: baseRules.date,
	dateError: baseRules.date,
	dateError2: baseRules.date,
	dateError3: baseRules.date,
	dateError4: baseRules.date,
	dateRequired: { ...baseRules.date, required: true },
	dateRequiredError: { ...baseRules.date, required: true },
	//dateIncludeTime: { ...baseRules.date, includeTime: true },
	dateFormat: { ...baseRules.date, format: '%w' },
	dateDefaultValue: { ...baseRules.date, defaultValue: 1234 },
};
const dateExpected = {
	date: '2019-07-04',
	date1: '2019-07-04',
	//date2: '2019-07-04',
	date3: '2019-07-04',
	//date4: 'Tuesday',
	date5: '1969-12-31',
	//date6: 'noon',
	//date7: '1970-01-18',
	date8: '2019-07-04',
	dateError: undefined,
	dateError2: undefined,
	dateError3: undefined,
	dateError4: undefined,
	dateRequired: '2019-07-04',
	dateRequiredError: undefined,
	//dateIncludeTime: 'now',
	dateFormat: '4',
	dateDefaultValue: 1234,
};

const urlTests = {
	url: 'https://google.com/',
	url2: 'http://maps.google.com/asd/fd?/asdf',
};
const urlRules = {
	url: baseRules.url,
	url2: baseRules.url,
};
const urlExpected = {
	url: 'https://google.com/',
	url2: 'http://maps.google.com/asd/fd?/asdf',
};

const rawTests = {
	raw: { a: [1, 2, 3], b: { c: 1 } },
	rawRequiredError: undefined,
	rawDefaultValue: undefined,
};
const rawRules = {
	raw: baseRules.raw,
	rawRequiredError: { ...baseRules.raw, required: true },
	rawDefaultValue: { ...baseRules.raw, defaultValue: 'true' },
};
const rawExpected = {
	raw: { a: [1, 2, 3], b: { c: 1 } },
	rawRequiredError: undefined,
	rawDefaultValue: 'true',
};

/*
const multipleTests = {
	test: {
		...stringTests,
		...numberTests,
		...booleanTests,
		...emailTests,
		...dateTests,
		...urlTests,
		...rawTests,
	}
}
*/

const multipleTests = {
	strings: [
		stringTests.string,
		stringTests.string,
		stringTests.string,
		stringTests.string,
	],
	stringErrors: [
		stringTests.string,
		stringTests.string,
		undefined,
		stringTests.string,
	],
};

const multipleRules = {
	'strings[]': stringRules.string,
	'stringErrors[]': stringRules.stringDefaultValue,
};

const multipleExpected = {
	strings: [
		stringExpected.string,
		stringExpected.string,
		stringExpected.string,
		stringExpected.string,
	],
	stringErrors: [
		stringExpected.string,
		stringExpected.string,
		stringExpected.stringDefaultValue,
		stringExpected.string,
	],
};

assert.deepStrictEqual(secureUserInput(stringTests, stringRules).out, stringExpected);
assert.deepStrictEqual(secureUserInput(numberTests, numberRules).out, numberExpected);
assert.deepStrictEqual(secureUserInput(booleanTests, booleanRules).out, booleanExpected);
assert.deepStrictEqual(secureUserInput(emailTests, emailRules).out, emailExpected);
assert.deepStrictEqual(secureUserInput(dateTests, dateRules).out, dateExpected);
assert.deepStrictEqual(secureUserInput(urlTests, urlRules).out, urlExpected);
assert.deepStrictEqual(secureUserInput(rawTests, rawRules).out, rawExpected);
//console.log(secureUserInput(multipleTests, multipleRules).out)
//assert.deepStrictEqual(secureUserInput(multipleTests, multipleRules).out, multipleExpected); TODO
