import fs from 'fs';
import { get, isArray } from 'lodash';
import mysql from 'mysql';
import path from 'path';

const sugar = require('sugar-date');

// cSpell:ignore PARSEINPUTRULE RULECONST

const RULECONST = 'PARSEINPUTRULE';
const ruleString: {
	RULECONST: string;
	type: 'string';
	required?: boolean;
	defaultValue?: string;
	multiple?: boolean;
	minLength?: number;
	maxLength?: number;
	mustIncludeSpecialChar?: boolean;
	mustIncludeNumber?: boolean;
	mustIncludeLowercaseLetter?: boolean;
	mustIncludeUppercaseLetter?: boolean;
	removeNonvisibleChars?: boolean /* = true */;
	htmlEscape?: boolean /* = true */;
	sqlEscape?: boolean /* = true */;
	enum?: string[];
} = { RULECONST, type: 'string' }; // TODO: removeJavascript (script tags, attributes, etc) allowedValues? (enum) // TODO minify html
const ruleNumber: {
	RULECONST: string;
	type: 'number';
	required?: boolean;
	defaultValue?: number;
	multiple?: boolean;
	min?: number;
	max?: number;
	decimalPlaces?: number;
	asString?: boolean;
} = { RULECONST, type: 'number' };
const ruleBoolean: {
	RULECONST: string;
	type: 'boolean';
	required?: boolean;
	defaultValue?: boolean;
	multiple?: boolean;
	to01?: boolean;
	asString01?: boolean;
	asString?: boolean;
} = { RULECONST, type: 'boolean' };
const rulePhone: {
	RULECONST: string;
	type: 'phone';
	required?: boolean;
	defaultValue?: number;
	multiple?: boolean;
} = { RULECONST, type: 'phone' };
const ruleEmail: {
	RULECONST: string;
	type: 'email';
	required?: boolean;
	defaultValue?: number;
	multiple?: boolean;
} = { RULECONST, type: 'email' };
const ruleDate: {
	RULECONST: string;
	type: 'date';
	required?: boolean;
	defaultValue?: number;
	multiple?: boolean;
	includeTime?: boolean;
	format?: string;
	sqlEscape?: boolean;
} = {
	RULECONST,
	type: 'date'
}; // TODO: min/max/minMsFromNow/minMsTillNow
const ruleUrl: {
	RULECONST: string;
	type: 'url';
	required?: boolean;
	defaultValue?: string;
	multiple?: boolean;
	sqlEscape?: boolean;
} = { RULECONST, type: 'url' }; // TODO test url
const ruleRaw: {
	RULECONST: string;
	type: 'raw';
	required?: boolean;
	defaultValue?: any;
} = { RULECONST, type: 'raw' };

export let baseRules = {
	boolean: ruleBoolean,
	date: ruleDate,
	email: ruleEmail,
	number: ruleNumber,
	phone: rulePhone,
	raw: ruleRaw,
	string: ruleString,
	url: ruleUrl
};

export const secureUserInput = (
	data: any,
	dataRules: any,
	fn?: any,
	language: string = 'en-us'
): { out: any; errors: string[] } => {
	const lang = i18n.init(language);
	const errors: string[] = [];

	function iterationCopy(src: any, curPath: string[] = []) {
		const target: any = {};
		for (const prop of Object.keys(src)) {
			const tempPath = [...curPath];
			tempPath.push(prop);
			const cleanProp = prop.replace('[]', '');

			if (src.hasOwnProperty(prop) && typeof src[prop] === 'object') {
				if (
					typeof src[prop].RULECONST === 'string' &&
					src[prop].RULECONST === RULECONST
				)
					target[cleanProp] = testAndBuild(src[prop], tempPath.join('.'));
				else if (prop.substr(-2) === '[]')
					target[cleanProp] = get(data, tempPath.join('.'), []).map(
						(item: any, index: number) =>
							testAndBuild(src[prop], tempPath.join('.') + '[' + index + ']')
					);
				else target[cleanProp] = iterationCopy(src[prop], tempPath);
			}
		}
		return target;
	}

	function testAndBuild(curRules: any, curPath: string): any {
		const { required, defaultValue, type, multiple } = curRules;
		const {
			minLength,
			maxLength,
			sqlEscape,
			htmlEscape,
			removeNonvisibleChars,
			mustIncludeSpecialChar,
			mustIncludeNumber,
			mustIncludeLowercaseLetter,
			mustIncludeUppercaseLetter
		} = curRules;
		const { min, max, decimalPlaces, asString } = curRules;
		const { to01, asString01 } = curRules;
		const { includeTime, format } = curRules;
		let safeTemp: string[];
		let temp = get(data, curPath);
		if (
			(typeof multiple !== 'undefined' && multiple) ||
			curPath.substr(-2) === '[]'
		) {
			temp = get(
				data,
				curPath,
				get(data, curPath.substr(0, curPath.length - 2))
			);
			if (!isArray(temp)) {
				errors.push(lang('invalid data', [curPath]));
				return undefined;
			} else if (required && temp.length === 0) {
				errors.push(lang('invalid data', [curPath]));
				return undefined;
			} else {
				curRules.multiple = false;
				return temp.map((item, index) =>
					testAndBuild(curRules, `${curPath}[${index}]`)
				);
			}
		}
		if (typeof temp === 'undefined') {
			if (required) {
				errors.push(lang('missing data', [curPath]));
				return undefined;
			} else if (typeof defaultValue !== 'undefined')
				return curRules.defaultValue;
			else return undefined;
		}
		if (type === 'string') {
			temp = String(temp).trim();
			safeTemp = [...temp];
			if (
				typeof removeNonvisibleChars === 'undefined' ||
				!removeNonvisibleChars
			) {
				//default on
				temp = safeTemp.join('');
			}
			if (safeTemp.length === 0) {
				if (typeof defaultValue !== 'undefined') return defaultValue;
				if (required) {
					errors.push(lang('missing data', [curPath]));
					return undefined;
				}
			}
			if (typeof minLength === 'number' && safeTemp.length < minLength) {
				errors.push(lang('too short', [curPath]));
				return undefined;
			}
			if (typeof maxLength === 'number' && safeTemp.length > maxLength) {
				errors.push(lang('too long', [curPath]));
				return undefined;
			}
			if (
				typeof mustIncludeSpecialChar !== 'undefined' &&
				mustIncludeSpecialChar &&
				temp.match(/[!@#$%^&*(),.?':{}|<>]/) === null
			) {
				errors.push(lang('no special char', [curPath]));
				return undefined;
			}
			if (
				typeof mustIncludeNumber !== 'undefined' &&
				mustIncludeNumber &&
				temp.match(/[0-9]/) === null
			) {
				errors.push(lang('no number', [curPath]));
				return undefined;
			}
			if (
				typeof mustIncludeLowercaseLetter !== 'undefined' &&
				mustIncludeLowercaseLetter &&
				temp.match(/[a-z]/) === null
			) {
				errors.push(lang('no lowercase char', [curPath]) + curPath);
				return undefined;
			}
			if (
				typeof mustIncludeUppercaseLetter !== 'undefined' &&
				mustIncludeUppercaseLetter &&
				temp.match(/[A-Z]/) === null
			) {
				errors.push(lang('no uppercase char', [curPath]));
				return undefined;
			}
			if (typeof htmlEscape === 'undefined' || !htmlEscape) {
				//default on
				temp = temp
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/'/g, '&quot;')
					.replace(/'/g, '&#039;');
			}
			if (typeof sqlEscape !== 'undefined' || sqlEscape)
				temp = mysql.escape(temp);
			return temp;
		} else if (type === 'number') {
			if (typeof temp === 'string') {
				temp = parseFloat(temp.trim());
				if (isNaN(temp)) {
					if (typeof defaultValue !== 'undefined') return curRules.default;
					else {
						errors.push(lang('not a number', [curPath]));
						return undefined;
					}
				}
			}
			if (typeof temp === 'number') {
				if (typeof min === 'number' && temp < min) {
					errors.push(lang('too small', [curPath]));
					return undefined;
				}
				if (typeof max === 'number' && temp > max) {
					errors.push(lang('too large', [curPath]));
					return undefined;
				}
				if (typeof decimalPlaces === 'number')
					temp = temp.toFixed(decimalPlaces);
				if (typeof asString !== 'undefined' && asString) temp = String(temp);
				return temp;
			}
			errors.push(lang('not a number', [curPath]));
			return false;
		} else if (type === 'boolean') {
			if (
				[0, '0', false, 'false', 'FALSE', 'f', 'F', null, ''].indexOf(temp) >= 0
			)
				temp = false;
			else if ([1, '1', true, 'true', 'TRUE', 't', 'T'].indexOf(temp) >= 0)
				temp = true;
			else return undefined;
			if (to01) return temp ? 1 : 0;
			if (asString01) return temp ? '1' : '0';
			if (asString) return temp ? 'true' : 'false';
			return temp;
		} else if (type === 'phone') {
			temp = String(temp)
				.trim()
				.replace(/\+|\(|\)|\-|\s|\./g, '');
			if (!isNaN(Number(temp)) || !(temp.length === 10 || temp.length === 11)) {
				errors.push(lang('not a phone number', [curPath]));
				return undefined;
			}
			if (temp.length === 10) temp = '1' + temp;
			return temp;
		} else if (type === 'email') {
			temp = String(temp)
				.trim()
				.toLowerCase();
			const re = /^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			const test = re.test(temp);
			if (!test) {
				errors.push(lang('not an email address', [curPath]));
				return undefined;
			}
			return temp;
		} else if (type === 'date') {
			temp = new sugar.Date(temp);
			if (!temp || (temp.raw && isNaN(temp.raw))) {
				errors.push(lang('not a date', [curPath]));
				return undefined;
			}
			if (typeof includeTime !== 'undefined' && includeTime)
				temp = temp.format('%F %T').raw;
			else if (typeof format === 'string') temp = temp.format(format).raw;
			else temp = temp.format('%F').raw;
			if (typeof sqlEscape !== 'undefined' && sqlEscape)
				temp = mysql.escape(temp);
			return temp;
		}
		if (type === 'url') {
			temp = String(temp).trim();
			safeTemp = [...temp];
			if (
				typeof removeNonvisibleChars === 'undefined' ||
				!removeNonvisibleChars
			) {
				//default on
				temp = safeTemp.join('');
			}

			if (safeTemp.length === 0) {
				if (typeof defaultValue !== 'undefined') {
					return defaultValue;
				}
				if (required) {
					errors.push(lang('missing data', [curPath]));
					return undefined;
				}
			}
			if (
				(temp.substr(0, 8) !== 'https://' &&
					temp.substr(0, 7) !== 'http://' &&
					temp.substr(0, 2) !== '//') ||
				!/^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(temp)
			) {
				errors.push(lang('not a url', [curPath]));
				return undefined;
			}
			if (typeof sqlEscape !== 'undefined' && sqlEscape) {
				temp = mysql.escape(temp);
			}
			return temp;
		} else if (type === 'raw') return temp;
		else {
			errors.push(lang('invalid data', [curPath]));
			return undefined;
		}
	}

	const out = iterationCopy(dataRules);
	if (errors.length > 0) errors.unshift(lang('header'));
	return { out, errors };
};

// generate dictionary
// tslint:disable
let i18n: {init: (language: string) => (key:string, vars?: string[]) => string, dictionaries: {[index: string]: object}} = {init:(a:string)=>(b:string,c:string[]=[]):string=>{let d=get(i18n,`dictionaries.${a}.${b}`,get(i18n,`dictionaries.${a}.general error`,'Error'));return(c.forEach((a,b)=>{d=d.replace(`{${b}}`,a);}),d);},dictionaries:{}};
function readJsonFilesFromDir(a:string,b:(filename:string,data:object)=>void){fs.readdir(a,(c,d)=>{c||d.forEach(c=>{const d=path.parse(c).name,e=path.parse(c).ext;if('json'!==e)return;const f=path.resolve(a,c);fs.stat(f,(a,c)=>{if(!a){const a=c.isFile();a&&fs.readFile(f,(a,c)=>{a||b(d,c);});}});});});}
readJsonFilesFromDir('languages/', (fileName, data) => {
	i18n.dictionaries[fileName.substr(-5)] = data;
});
