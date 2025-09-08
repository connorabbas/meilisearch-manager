import Preset from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

const customThemePreset = definePreset(Preset, {
    semantic: {
        primary: {
            50: '{pink.50}',
            100: '{pink.100}',
            200: '{pink.200}',
            300: '{pink.300}',
            400: '{pink.400}',
            500: '{pink.500}',
            600: '{pink.600}',
            700: '{pink.700}',
            800: '{pink.800}',
            900: '{pink.900}',
            950: '{pink.950}',
        },
        colorScheme: {
            light: {
                surface: {
                    50: '{zinc.50}',
                    100: '{zinc.100}',
                    200: '{zinc.200}',
                    300: '{zinc.300}',
                    400: '{zinc.400}',
                    500: '{zinc.500}',
                    600: '{zinc.600}',
                    700: '{zinc.700}',
                    800: '{zinc.800}',
                    900: '{zinc.900}',
                    950: '{zinc.950}',
                },
            },
            dark: {
                surface: {
                    50: 'var(--meili-theme-50)',
                    100: 'var(--meili-theme-100)',
                    200: 'var(--meili-theme-200)',
                    300: 'var(--meili-theme-300)',
                    400: 'var(--meili-theme-400)',
                    500: 'var(--meili-theme-500)',
                    600: 'var(--meili-theme-600)',
                    700: 'var(--meili-theme-700)',
                    800: 'var(--meili-theme-800)',
                    900: 'var(--meili-theme-900)',
                    950: 'var(--meili-theme-950)',
                },
            },
        },
    },
});

export default customThemePreset;
