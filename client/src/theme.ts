import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ff6b6b", // Coral red
      light: "#ff9999",
      dark: "#cc5555",
    },
    secondary: {
      main: "#4ecdc4", // Turquoise
      light: "#7ee8e0",
      dark: "#3da39d",
    },
    background: {
      default: "#2c2c2c", // Dark grey
      paper: "#3d3d3d", // Lighter dark grey
    },
    text: {
      primary: "#ffffff",
      secondary: "#b3b3b3",
    },
    success: {
      main: "#51cf66", // Green
    },
    warning: {
      main: "#ffd43b", // Yellow
    },
    error: {
      main: "#ff6b6b", // Red
    },
    info: {
      main: "#74c0fc", // Blue
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});
