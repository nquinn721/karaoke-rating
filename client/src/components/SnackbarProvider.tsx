import { Alert, Snackbar, Stack } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { rootStore } from "../stores/RootStore";

const SnackbarProvider: React.FC = observer(() => {
  const { snackbarStore } = rootStore;

  return (
    <Stack
      spacing={1}
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: "350px",
      }}
    >
      {snackbarStore.messages.map((message) => (
        <Snackbar
          key={message.id}
          open={true}
          autoHideDuration={null} // We handle duration in the store
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{ position: "relative" }}
        >
          <Alert
            onClose={() => snackbarStore.removeMessage(message.id)}
            severity={message.severity}
            variant="filled"
            sx={{
              width: "100%",
              "& .MuiAlert-message": {
                fontSize: "0.9rem",
                fontWeight: 500,
              },
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            {message.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
});

export default SnackbarProvider;
