import { defaultTheme } from 'react-admin';

export const theme = {
    ...defaultTheme,
    // We rely mostly on Tailwind classes, but we can override some MUI defaults here if strictly necessary
    // to prevent MUI from overriding our Tailwind styles in some edge cases.
    components: {
        ...defaultTheme.components,
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none', // More modern look
                }
            }
        }
    }
};
