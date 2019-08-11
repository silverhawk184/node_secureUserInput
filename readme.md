[![Build Status](https://travis-ci.com/silverhawk184/node_secureUserInput.svg?branch=master)](https://travis-ci.com/silverhawk184/node_secureUserInput)

#node_secure-user-input

## Validate and format user submitted data to secure your app against attacks and invalid data.

Simple usage:

```
import { baseRules, secureUserInput } from 'node_secure-user-input';

// let's define some custom rules
export const RULE = {
    ...baseRules,
    positiveNumber: { ...baseRules.number, min: 0, defaultValue: 0 },
    password: {...baseRules.string, required: true, minLength: 8, maxLength: 200, mustIncludeSpecialChar?: true, mustIncludeNumber?: true, mustIncludeLowercaseLetter?: true, mustIncludeUppercaseLetter?: true},
};

// incoming data from user
const insecureData = {
    credentials: {
        username: 'johnDoe',
        password: '1234abcd'
    },
    info: {
        phone: '(123) 123-1234',
        email: 'johnDoe@gmail.com',
        birthday: '1/1/2000',
        age: 19,
        signature: '<p><blink> I am awesome!!</blink></p>',
        favoriteColors: [
            'red',
            'blue',
            'green',
        ],
        pets: [
            {name: 'Fido', species: 'dog'},
            {name: 'Cinnamon', species: 'cat'},
            {name: 'Shelby'}
        ],
    },
    wouldLikeEmailNotifications: true
}

// rules to validate against
const validationRules = {
    credentials: {
        username: {...RULE.string, required: true, minLength: 5, maxLength: 200},
        password: RULE.password,
    },
    info: {
        phone: RULE.phone,
        email: RULE.email,
        birthday: RULE.date,
        age: RULE.positiveNumber,
        signature: {...RULE.string, htmlEscape: false},
        favoriteColors: {...Rule.string, multiple: true},
        "pets[]": {
            name: {...RULE.string, required: true},
            species: RULE.string,
        },
    },
    wouldLikeEmailNotifications: RULE.boolean,
}

// test and validate here
const out = secureUserInput(insecureData, validationRules);
if(out.errors)
    console.error(out.errors);
else {
    const validData = out.data;
    console.log(validData);
}
```

Built in validation for: strings,numbers, booleans, phone numbers, email addresses, dates, urls, and returning raw data

### baseRule.string

- **required**?: boolean;
- **defaultValue**?: string;
- **multiple**?: boolean;
- **minLength**?: number;
- **maxLength**?: number;
- **mustIncludeSpecialChar**?: boolean;
- **mustIncludeNumber**?: boolean;
- **mustIncludeLowercaseLetter**?: boolean;
- **mustIncludeUppercaseLetter**?: boolean;
- **removeNonvisibleChars**?: boolean; _defaults to true_
- **htmlEscape**?: boolean; _defaults to true_
- **sqlEscape**?: boolean; _defaults to true_
- **enum**?: string[];

### baseRule.number

- **required**?: boolean;
- **defaultValue**?: number;
- **multiple**?: boolean;
- **min**?: number;
- **max**?: number;
- **decimalPlaces**?: number;
- **asString**?: boolean;

### baseRule.boolean

- **required**?: boolean;
- **defaultValue**?: boolean;
- **multiple**?: boolean;
- **to01**?: boolean; _outputs 1 or 0 instead of true or false_
- **asString01**?: boolean; _outputs '1' or '0' instead of true or false_
- **asString**?: boolean; _outputs 'true' or 'false' instead of true or false_

### baseRule.phone _(USA format only ... for now)_

- **required**?: boolean;
- **defaultValue**?: number;
- **multiple**?: boolean;

### baseRule.email

- **required**?: boolean;
- **defaultValue**?: number;
- **multiple**?: boolean;

### baseRule.date

- **required**?: boolean;
- **defaultValue**?: number;
- **multiple**?: boolean;
- **includeTime**?: boolean;
- **format**?: string; _- enter a custom format using the Sugar.date syntax_
- **sqlEscape**?: boolean;

### baseRule.url

- **required**?: boolean;
- **defaultValue**?: string;
- **multiple**?: boolean;
- **sqlEscape**?: boolean;

### baseRule.raw

- **required**?: boolean;
- **defaultValue**?: any;

## Tests coming soon
