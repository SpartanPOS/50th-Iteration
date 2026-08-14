// eslint.config.js (Flat Config Format)
import googleConfig from 'eslint-config-google';
import js from "@eslint/js";

const googleRules = { ...googleConfig.rules };
delete googleRules['valid-jsdoc'];
delete googleRules['require-jsdoc'];

export default [
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                project: ['./web/tsconfig.json', './backend/tsconfig.json']
            }
        }
    },
    js.configs.recommended,
    {
        ...googleConfig,
        rules: googleRules,
    },
    {
        rules: {
            'no-console': 'off',
        },
    }
    ,
    {
        files: ['backend/**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                project: ['./backend/tsconfig.json']
            }
        }
    }
];