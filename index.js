"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var lodash_1 = require("lodash");
var mysql = require("mysql");
var sugar = require("sugar");
// cSpell:ignore PARSEINPUTRULE RULECONST
var RULECONST = "PARSEINPUTRULE";
var ruleString = { RULECONST: RULECONST, type: "string" }; // TODO: removeJavascript (script tags, attributes, etc) allowedValues? (enum)
var ruleNumber = { RULECONST: RULECONST, type: "number" };
var ruleBoolean = { RULECONST: RULECONST, type: "boolean" };
var rulePhone = { RULECONST: RULECONST, type: "phone" };
var ruleEmail = { RULECONST: RULECONST, type: "email" };
var ruleDate = { RULECONST: RULECONST, type: "date" }; // TODO: min/max/minMsFromNow/minMsTillNow
var ruleUrl = { RULECONST: RULECONST, type: "url" }; // TODO test url
var ruleRaw = { RULECONST: RULECONST, type: "raw" };
exports.baseRules = {
    string: ruleString,
    number: ruleNumber,
    boolean: ruleBoolean,
    phone: rulePhone,
    email: ruleEmail,
    date: ruleDate,
    url: ruleUrl,
    raw: ruleRaw
};
exports.secureUserInput = function (data, dataRules, fn, language) {
    if (language === void 0) { language = "en-us"; }
    var lang = i18n.init(language);
    /*
      This function cleans an object of user supplied data and validates it against a set of rules. The rules are an a structure of the expected input with the values set to one of the rule objects below.
      By default, all values are safe from SQL and XSS injection.
  
      FORMATTING RULES
      TODO: file, blob, binary, etc
  
      EXAMPLE:
      data: {
          credentials: {
              username: 'johnDoe',
              password: '1234abcd'
          },
          info: {
              phone: '(123) 123-1234',
              email: 'johnDoe@gmail.com',
              birthday: '1/1/2019',
              signature: '<p><blink> I am awesome!!</blink></p>'
          },
          wouldLikeEmailNotifications: true
      }
      dataRules: {
          credentials: {
              username: {type: 'string', required: true, minLength: 5, maxLength: 200},
              password: {type: 'string', required: true, minLength: 8, maxLength: 200, mustIncludeSpecialChar?: true, mustIncludeNumber?: true, mustIncludeLowercaseLetter?: true, mustIncludeUppercaseLetter?: true},
          },
          info: {
              phone: {type: 'phone'},
              email: {type: 'email', required: true},
              birthday: {type: 'date'},
              signature: {type: 'string', htmlEscape: false}
          },
          wouldLikeEmailNotifications: {type: boolean}
      }
      */
    var errors = [];
    function iterationCopy(src, curPath) {
        if (curPath === void 0) { curPath = []; }
        var target = {};
        var _loop_1 = function (prop) {
            var tempPath = curPath.slice();
            tempPath.push(prop);
            if (src.hasOwnProperty(prop) && typeof src[prop] === "object") {
                if (typeof src[prop].RULECONST === "string" &&
                    src[prop].RULECONST === RULECONST)
                    target[prop] = testAndBuild(src[prop], tempPath.join("."));
                else if (prop.substr(-2) === "[]")
                    target[prop] = lodash_1.get(data, tempPath.join("."), []).map(function (item, index) {
                        return testAndBuild(src[prop], tempPath.join(".") + "[" + index + "]");
                    });
                else
                    target[prop] = iterationCopy(src[prop], tempPath);
            }
        };
        for (var prop in src) {
            _loop_1(prop);
        }
        return target;
    }
    function testAndBuild(curRules, curPath) {
        var required = curRules.required, defaultValue = curRules.defaultValue, type = curRules.type, multiple = curRules.multiple;
        var minLength = curRules.minLength, maxLength = curRules.maxLength, sqlEscape = curRules.sqlEscape, htmlEscape = curRules.htmlEscape, removeNonvisibleChars = curRules.removeNonvisibleChars, mustIncludeSpecialChar = curRules.mustIncludeSpecialChar, mustIncludeNumber = curRules.mustIncludeNumber, mustIncludeLowercaseLetter = curRules.mustIncludeLowercaseLetter, mustIncludeUppercaseLetter = curRules.mustIncludeUppercaseLetter;
        var min = curRules.min, max = curRules.max, decimalPlaces = curRules.decimalPlaces, asString = curRules.asString;
        var to01 = curRules.to01, asString01 = curRules.asString01;
        var includeTime = curRules.includeTime, format = curRules.format;
        var temp = lodash_1.get(data, curPath);
        if ((typeof multiple !== "undefined" && multiple) ||
            curPath.substr(-2) === "[]") {
            if (!lodash_1.isArray(temp)) {
                errors.push(lang("invalid data", [curPath]));
                return false;
            }
            else if (required && temp.length === 0) {
                errors.push(lang("invalid data", [curPath]));
                return false;
            }
            else {
                curRules.multiple = false;
                return temp.map(function (item, index) {
                    return testAndBuild(curRules, curPath + "[" + index + "]");
                });
            }
        }
        if (typeof temp === "undefined") {
            if (required) {
                errors.push(lang("missing data", [curPath]));
                return false;
            }
            else if (typeof defaultValue != "undefined") {
                return curRules["default"];
            }
            else {
                return undefined;
            }
        }
        if (type === "string") {
            temp = String(temp).trim();
            var safeTemp = temp.slice();
            if (typeof removeNonvisibleChars === "undefined" ||
                !removeNonvisibleChars) {
                //default on
                temp = safeTemp.join("");
            }
            if (safeTemp.length == 0) {
                if (typeof defaultValue !== "undefined") {
                    return defaultValue;
                }
                if (required) {
                    errors.push(lang("missing data", [curPath]));
                    return false;
                }
            }
            if (typeof minLength === "number" && safeTemp.length < minLength) {
                errors.push(lang("too short", [curPath]));
                return false;
            }
            if (typeof maxLength === "number" && safeTemp.length > maxLength) {
                errors.push(lang("too long", [curPath]));
                return false;
            }
            if (typeof mustIncludeSpecialChar !== "undefined" &&
                mustIncludeSpecialChar &&
                temp.match(/[!@#$%^&*(),.?":{}|<>]/) === null) {
                errors.push(lang("no special char", [curPath]));
                return false;
            }
            if (typeof mustIncludeNumber !== "undefined" &&
                mustIncludeNumber &&
                temp.match(/[0-9]/) === null) {
                errors.push(lang("no number", [curPath]));
                return false;
            }
            if (typeof mustIncludeLowercaseLetter !== "undefined" &&
                mustIncludeLowercaseLetter &&
                temp.match(/[a-z]/) === null) {
                errors.push(lang("no lowercase char", [curPath]) + curPath);
                return false;
            }
            if (typeof mustIncludeUppercaseLetter !== "undefined" &&
                mustIncludeUppercaseLetter &&
                temp.match(/[A-Z]/) === null) {
                errors.push(lang("no uppercase char", [curPath]));
                return false;
            }
            if (typeof htmlEscape === "undefined" || !htmlEscape) {
                //default on
                temp = temp
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }
            if (typeof sqlEscape === "undefined" || !sqlEscape) {
                //default on
                temp = mysql.escape(temp);
            }
            return temp;
        }
        else if (type === "number") {
            if (typeof temp === "string") {
                temp = parseFloat(temp);
                if (isNaN(temp)) {
                    if (typeof defaultValue != "undefined") {
                        return curRules["default"];
                    }
                    else {
                        errors.push(lang("not a number", [curPath]));
                        return false;
                    }
                }
            }
            if (typeof temp === "number") {
                if (typeof min === "number" && temp < min) {
                    errors.push(lang("too small", [curPath]));
                    return false;
                }
                if (typeof max === "number" && temp > max) {
                    errors.push(lang("too large", [curPath]));
                    return false;
                }
                if (typeof decimalPlaces === "number") {
                    temp = temp.toFixed(decimalPlaces);
                }
                if (typeof asString !== "undefined" && asString) {
                    temp = String(temp);
                }
                return temp;
            }
            errors.push(lang("not a number", [curPath]));
            return false;
        }
        else if (type === "boolean") {
            if (temp.inArray([0, "0", false, "false", "FALSE", "f", "F"])) {
                temp = false;
            }
            else if (temp.inArray([1, "1", true, "true", "TRUE", "t", "T"])) {
                temp = true;
            }
            if (to01) {
                return temp ? 1 : 0;
            }
            if (asString01) {
                return temp ? "1" : "0";
            }
            if (asString) {
                return temp ? "true" : "false";
            }
            return temp;
        }
        else if (type === "phone") {
            temp = String(temp).trim();
            temp = temp.replace(["+", "(", ")", "-"], "");
            temp = temp.replace(/\s/g, "");
            temp = temp.replace(/\./g, "");
            if (!isNaN(parseInt(temp)) || !(temp.length == 10 || temp.length == 11)) {
                errors.push(lang("not a phone number", [curPath]));
                return false;
            }
            if (temp.length == 10) {
                temp = "1" + temp;
            }
            return temp;
        }
        else if (type === "email") {
            temp = String(temp)
                .trim()
                .toLowerCase();
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var test = re.test(temp);
            if (!test) {
                errors.push(lang("not an email address", [curPath]));
                return false;
            }
            return temp;
        }
        else if (type === "date") {
            temp = sugar.Date.create(temp);
            if (!temp) {
                errors.push(lang("not a date", [curPath]));
                return false;
            }
            if (typeof includeTime !== "undefined" && includeTime) {
                temp = temp.format("%F %T");
            }
            else if (typeof format === "string") {
                temp = temp.format(format);
            }
            else
                temp = temp.format("%F");
            if (typeof sqlEscape !== "undefined" && sqlEscape)
                temp = mysql.escape(temp);
            return temp;
        }
        if (type === "url") {
            temp = String(temp).trim();
            var safeTemp = temp.slice();
            if (typeof removeNonvisibleChars === "undefined" ||
                !removeNonvisibleChars) {
                //default on
                temp = safeTemp.join("");
            }
            if (safeTemp.length == 0) {
                if (typeof defaultValue !== "undefined") {
                    return defaultValue;
                }
                if (required) {
                    errors.push(lang("missing data", [curPath]));
                    return false;
                }
            }
            if ((temp.substr(0, 8) !== "https://" &&
                temp.substr(0, 7) !== "http://" &&
                temp.substr(0, 2) !== "//") ||
                !/^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(temp)) {
                errors.push(lang("not a url", [curPath]));
                return false;
            }
            return temp;
        }
        else if (type === "raw") {
            return temp;
        }
        else {
            errors.push(lang("invalid data", [curPath]));
            return false;
        }
    }
    var out = iterationCopy(dataRules);
    if (errors.length > 0) {
        errors.unshift(lang("header"));
    }
    return { out: out, errors: errors };
};
// generate dictionary
// prettier-ignore
var i18n = { init: function (a) { return function (b, c) {
        if (c === void 0) { c = []; }
        var d = lodash_1.get(i18n, "dictionaries." + a + "." + b, lodash_1.get(i18n, "dictionaries." + a + ".general error", "Error"));
        return (c.forEach(function (a, b) { d = d.replace("{" + b + "}", a); }), d);
    }; }, dictionaries: {} };
// prettier-ignore
function readJsonFilesFromDir(a, b) { fs.readdir(a, function (c, d) { c || d.forEach(function (c) { var d = path.parse(c).name, e = path.parse(c).ext; if ("json" !== e)
    return; var f = path.resolve(a, c); fs.stat(f, function (a, c) { if (!a) {
    var a_1 = c.isFile();
    a_1 && fs.readFile(f, function (a, c) { a || b(d, c); });
} }); }); }); }
readJsonFilesFromDir("languages/", function (fileName, data) {
    i18n.dictionaries[fileName.substr(-5)] = data;
});
