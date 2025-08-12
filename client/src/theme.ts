import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ff6b6b", // Vibrant coral red
      light: "#ff9999",
      dark: "#e55555",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#4ecdc4", // Electric turquoise
      light: "#7ee8e0",
      dark: "#2bb5ad",
      contrastText: "#000000",
    },
    background: {
      default: "#0a0a0a", // Very dark background
      paper: "#1a1a1a", // Dark paper with slight lift
    },
    text: {
      primary: "#ffffff",
      secondary: "#cccccc",
    },
    success: {
      main: "#00ff88", // Electric green
      light: "#4dffaa",
      dark: "#00cc6a",
    },
    warning: {
      main: "#ffdd00", // Bright yellow
      light: "#ffee4d",
      dark: "#ccb100",
    },
    error: {
      main: "#ff4444", // Bright red
      light: "#ff7777",
      dark: "#cc3333",
    },
    info: {
      main: "#00aaff", // Electric blue
      light: "#4dc7ff",
      dark: "#0088cc",
    },
    // Custom accent colors for the colorful theme
    divider: "rgba(255, 255, 255, 0.08)",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          },
        },
        contained: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          "&:hover": {
            boxShadow: "0 4px 16px rgba(255, 107, 107, 0.3)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: "linear-gradient(145deg, #1a1a1a 0%, #222222 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "linear-gradient(145deg, #1a1a1a 0%, #222222 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 12px 48px rgba(0, 0, 0, 0.6)",
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          background: "linear-gradient(145deg, #1a1a1a 0%, #222222 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          "&:before": {
            display: "none",
          },
          "&.Mui-expanded": {
            margin: "8px 0",
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(90deg, rgba(255, 107, 107, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%)",
          "&:hover": {
            background:
              "linear-gradient(90deg, rgba(255, 107, 107, 0.15) 0%, rgba(78, 205, 196, 0.15) 100%)",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: "linear-gradient(145deg, #1a1a1a 0%, #222222 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 16px 64px rgba(0, 0, 0, 0.8)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "8px",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 107, 107, 0.5)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#ff6b6b",
              boxShadow: "0 0 0 2px rgba(255, 107, 107, 0.2)",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "8px",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(78, 205, 196, 0.5)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#4ecdc4",
            boxShadow: "0 0 0 2px rgba(78, 205, 196, 0.2)",
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          margin: "2px 0",
          "&:hover": {
            background:
              "linear-gradient(90deg, rgba(255, 107, 107, 0.05) 0%, rgba(78, 205, 196, 0.05) 100%)",
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h4: {
          background: "linear-gradient(45deg, #ff6b6b 30%, #4ecdc4 90%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        },
        h5: {
          background: "linear-gradient(45deg, #ff6b6b 30%, #4ecdc4 90%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        },
        h6: {
          fontWeight: 600,
          color: "#ffffff",
        },
      },
    },
  },
});
