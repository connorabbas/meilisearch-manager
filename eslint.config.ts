import vue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'


export default [
    // Global ignores
    {
        ignores: [
            'node_modules',
            'dist',
            'public',
        ],
    },
    // Vue and TypeScript files
    ...defineConfigWithVueTs(
        vue.configs['flat/recommended'],
        vueTsConfigs.recommended,
        {
            rules: {
                // Disable conflicting @stylistic rules
                '@stylistic/indent': 'off',
                '@stylistic/semi': 'off',
                '@stylistic/comma-dangle': 'off',
                '@stylistic/quotes': 'off',

                // Vue rules
                'vue/require-default-prop': 'off',
                'vue/attribute-hyphenation': 'off',
                'vue/v-on-event-hyphenation': 'off',
                'vue/multi-word-component-names': 'off',
                'vue/no-v-html': 'off',
                'vue/html-indent': ['error', 4],

                // TypeScript rules
                '@typescript-eslint/no-explicit-any': 'off',

                // Formatting rules
                'indent': ['error', 4],
                'semi': ['error', 'never'],
                'quotes': ['error', 'single'],
                'linebreak-style': ['error', 'unix']
            },
        },
    ),
]
