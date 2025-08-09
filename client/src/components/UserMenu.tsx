import {
  Feedback as FeedbackIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { rootStore } from "../stores/RootStore";
import FeedbackModal from "./FeedbackModal";

interface UserMenuProps {
  getUserColor: (username: string) => string;
  onUsernameChange?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = observer(
  ({ getUserColor, onUsernameChange }) => {
    const { userStore } = rootStore;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleFeedbackClick = () => {
      setFeedbackModalOpen(true);
      handleClose();
    };

    const handleUsernameClick = () => {
      if (onUsernameChange) {
        onUsernameChange();
      }
      handleClose();
    };

    return (
      <>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={anchorEl ? "user-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={anchorEl ? "true" : undefined}
          >
            <Avatar
              sx={{
                width: { xs: 24, sm: 28 },
                height: { xs: 24, sm: 28 },
                bgcolor: getUserColor(userStore.username),
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
              }}
            >
              {userStore.username.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              whiteSpace: "nowrap",
              ml: 1,
            }}
          >
            {userStore.username}
          </Typography>
        </Box>

        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
              mt: 1.5,
              minWidth: 200,
              "&:before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" color="text.primary">
              {userStore.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Karaoke Participant
            </Typography>
          </Box>

          <Divider />

          {onUsernameChange && (
            <MenuItem onClick={handleUsernameClick}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Change Username</ListItemText>
            </MenuItem>
          )}

          <MenuItem onClick={handleFeedbackClick}>
            <ListItemIcon>
              <FeedbackIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send Feedback</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleClose} disabled>
            <ListItemIcon>
              <HistoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>My History</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleClose} disabled>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
        </Menu>

        <FeedbackModal
          open={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
        />
      </>
    );
  }
);

export default UserMenu;
