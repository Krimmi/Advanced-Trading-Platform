import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useUserPreferences } from './UserPreferencesContext';

// Define theme context type
interface ThemeContextType {
  theme: Theme;
  mode: 'light' | 'dark';
  toggleMode: () => void;
  setMode: (mode: 'light' | 'dark') => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { preferences, updatePreference, mlPreferences, updateMLPreference } = useUserPreferences();
  const [mode, setMode] = useState<'light' | 'dark'>(preferences.theme || 'light');

  // Effect to sync theme with preferences
  useEffect(() => {
    setMode(preferences.theme);
  }, [preferences.theme]);

  // Effect to sync ML dark mode with theme
  useEffect(() => {
    // Only update if they're different to avoid loops
    if ((mode === 'dark') !== mlPreferences.mlDarkMode) {
      updateMLPreference('mlDarkMode', mode === 'dark');
    }
  }, [mode, mlPreferences.mlDarkMode, updateMLPreference]);

  // Create theme based on mode
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
          },
          secondary: {
            main: '#dc004e',
            light: '#ff4081',
            dark: '#c51162',
          },
          ...(mode === 'dark'
            ? {
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
              }
            : {
                background: {
                  default: '#f5f5f5',
                  paper: '#ffffff',
                },
              }),
        },
        typography: {
          fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
          ].join(','),
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: mode === 'dark' ? '#2d2d2d' : '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: mode === 'dark' ? '#555' : '#c1c1c1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: mode === 'dark' ? '#777' : '#a1a1a1',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                boxShadow: mode === 'dark' 
                  ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.08)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 6,
                textTransform: 'none',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              head: {
                fontWeight: 600,
              },
            },
          },
        },
      }),
    [mode],
  );

  // Toggle theme mode
  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    updatePreference('theme', newMode);
  };

  // Set specific mode
  const setThemeMode = (newMode: 'light' | 'dark') => {
    setMode(newMode);
    updatePreference('theme', newMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        toggleMode,
        setMode: setThemeMode,
      }}
    >
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};