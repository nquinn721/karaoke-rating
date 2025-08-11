import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Home as HomeIcon,
  MusicNote as MusicNoteIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKeyboardAvoidance } from "../hooks/useKeyboardAvoidance";
import { rootStore } from "../stores/RootStore";

const AdminPage: React.FC = observer(() => {
  const navigate = useNavigate();
  const { showsStore, chatStore, feedbackStore } = rootStore;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newShowName, setNewShowName] = useState("");
  const newShowVenue: "karafun" | "excess" | "dj steve" = "karafun";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showToDelete, setShowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);
  const [feedbackDeleteDialogOpen, setFeedbackDeleteDialogOpen] =
    useState(false);
  const [feedbackDetailsModal, setFeedbackDetailsModal] = useState<{
    open: boolean;
    feedback: any | null;
  }>({ open: false, feedback: null });
  const { dialogStyles } = useKeyboardAvoidance();
  const [realTimeStats, setRealTimeStats] = useState({
    totalUsers: 0,
    activeShows: 0,
    totalRatings: 0,
  });

  useEffect(() => {
    showsStore.fetchShows();
    feedbackStore.fetchAllFeedback();
  }, [showsStore, feedbackStore]);

  // Update real-time stats using socket data
  useEffect(() => {
    let totalUsers = 0;
    let activeShows = 0;

    chatStore.participantsByShow.forEach((participants) => {
      if (participants.length > 0) {
        activeShows++;
        totalUsers += participants.length;
      }
    });

    const totalRatings = showsStore.shows.reduce((acc, show) => {
      return acc + (show.ratings?.length || 0);
    }, 0);

    setRealTimeStats({
      totalUsers,
      activeShows,
      totalRatings,
    });
  }, [chatStore.participantsByShow, showsStore.shows]);

  const handleCreateShow = async () => {
    if (newShowName.trim()) {
      try {
        await showsStore.createShow(newShowName.trim(), newShowVenue);
        setNewShowName("");
        setDialogOpen(false);
      } catch (error) {
        console.error("Failed to create show:", error);
      }
    }
  };

  const handleDeleteClick = (showId: string, showName: string) => {
    setShowToDelete({ id: showId, name: showName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!showToDelete) return;

    try {
      // Use the new delete method from ShowsStore
      const result = await showsStore.deleteShow(showToDelete.id);

      if (result.success) {
        console.log(`Successfully deleted show: ${showToDelete.name}`);
        // Show was already removed from the store, so no need to refresh
      } else {
        console.error(`Failed to delete show: ${result.message}`);
        // You could show a toast notification here
      }

      setDeleteDialogOpen(false);
      setShowToDelete(null);
    } catch (error) {
      console.error("Failed to delete show:", error);
      // You could show a toast notification here
      setDeleteDialogOpen(false);
      setShowToDelete(null);
    }
  };

  const getShowParticipants = (showId: string) => {
    return chatStore.participantsByShow.get(showId) || [];
  };

  const handleDeleteFeedback = async () => {
    if (!deleteFeedbackId) return;

    try {
      await feedbackStore.deleteFeedback(deleteFeedbackId);
      console.log("Successfully deleted feedback");
    } catch (error) {
      console.error("Failed to delete feedback:", error);
    }

    setFeedbackDeleteDialogOpen(false);
    setDeleteFeedbackId(null);
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }) => (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        backdropFilter: "blur(20px)",
        border: `1px solid ${color}30`,
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 25px ${color}20`,
          border: `1px solid ${color}50`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontSize: "0.75rem",
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontStyle: "italic",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Navigation Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          pb: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Button
          startIcon={<HomeIcon />}
          onClick={() => navigate("/")}
          sx={{
            color: "text.secondary",
            "&:hover": {
              color: "primary.main",
              backgroundColor: "rgba(255,255,255,0.05)",
            },
            transition: "all 0.2s ease",
          }}
        >
          Back to Home
        </Button>
      </Box>

      {/* Professional Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            background: "linear-gradient(135deg, #ff6b6b, #4ecdc4)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "text.secondary", mb: 3 }}>
          Real-time show management and analytics
        </Typography>

        {/* Real-time Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Active Users"
              value={realTimeStats.totalUsers}
              icon={<GroupIcon sx={{ color: "#4ecdc4" }} />}
              color="#4ecdc4"
              subtitle="Currently online across all shows"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Live Shows"
              value={realTimeStats.activeShows}
              icon={<MusicNoteIcon sx={{ color: "#ff6b6b" }} />}
              color="#ff6b6b"
              subtitle="Shows with active participants"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Total Ratings"
              value={realTimeStats.totalRatings}
              icon={<StarIcon sx={{ color: "#ffd700" }} />}
              color="#ffd700"
              subtitle="Ratings submitted across all shows"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Shows Management Section */}
      <Paper
        sx={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Show Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{
              borderRadius: 2,
              background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
              "&:hover": {
                background: "linear-gradient(135deg, #5f4fcf, #8b7ff7)",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(108, 92, 231, 0.3)",
              },
              transition: "all 0.2s ease",
            }}
          >
            New Show
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{ "& th": { borderColor: "rgba(255,255,255,0.1)" } }}
              >
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Show Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Participants
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Current Performance
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {showsStore.shows.map((show) => {
                const participants = getShowParticipants(show.id);
                const isActive = participants.length > 0;

                return (
                  <TableRow
                    key={show.id}
                    sx={{
                      "& td": { borderColor: "rgba(255,255,255,0.05)" },
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.02)",
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {show.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        ID: {show.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isActive ? "Live" : "Inactive"}
                        color={isActive ? "success" : "default"}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          ...(isActive && {
                            background:
                              "linear-gradient(135deg, #26de81, #20bf6b)",
                            animation: "pulse 2s infinite",
                            "@keyframes pulse": {
                              "0%": { opacity: 1 },
                              "50%": { opacity: 0.8 },
                              "100%": { opacity: 1 },
                            },
                          }),
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <GroupIcon
                          fontSize="small"
                          sx={{ color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {participants.length}
                        </Typography>
                        {participants.length > 0 && (
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            ({participants.slice(0, 2).join(", ")}
                            {participants.length > 2 &&
                              `, +${participants.length - 2}`}
                            )
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {show.currentSinger && show.currentSong ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {show.currentSinger}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            "{show.currentSong}"
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          No current performance
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            window.open(`/show/${show.id}`, "_blank")
                          }
                          sx={{ color: "primary.main" }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(show.id, show.name)}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {showsStore.shows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      No shows created yet. Create your first show to get
                      started!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Feedback Management */}
      <Paper
        sx={{
          mt: 4,
          p: 0,
          background: "rgba(20, 20, 20, 0.8)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            User Feedback
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                  User
                </TableCell>
                <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Type
                </TableCell>
                <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Subject
                </TableCell>
                <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Status
                </TableCell>
                <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Date
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedbackStore.feedbackList.map((feedback) => (
                <TableRow 
                  key={feedback.id}
                  onClick={() => {
                    setFeedbackDetailsModal({ open: true, feedback });
                  }}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  <TableCell>{feedback.username}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={feedback.type}
                      sx={{
                        bgcolor:
                          feedback.type === "bug"
                            ? "#f44336"
                            : feedback.type === "feature"
                              ? "#2196f3"
                              : feedback.type === "improvement"
                                ? "#ff9800"
                                : "#4caf50",
                        color: "white",
                        fontSize: "0.75rem",
                      }}
                    />
                  </TableCell>
                  <TableCell>{feedback.subject}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={feedback.status}
                      variant={
                        feedback.status === "resolved" ? "filled" : "outlined"
                      }
                      color={
                        feedback.status === "resolved" ? "success" : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {feedback.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {feedbackStore.feedbackList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      No feedback submitted yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Show Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setNewShowName("");
        }}
        maxWidth="sm"
        fullWidth
        sx={dialogStyles}
        PaperProps={{
          sx: {
            background: "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Show</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Show Name"
            value={newShowName}
            onChange={(e) => setNewShowName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleCreateShow();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setNewShowName("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateShow}
            disabled={!newShowName.trim()}
            sx={{
              borderRadius: 2,
              background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
              "&:hover": {
                background: "linear-gradient(135deg, #5f4fcf, #8b7ff7)",
              },
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setShowToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
        sx={dialogStyles}
        PaperProps={{
          sx: {
            background: "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "error.main" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the show{" "}
            <strong>"{showToDelete?.name}"</strong>?
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            This action cannot be undone and will remove all associated data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setShowToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            sx={{
              borderRadius: 2,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Delete Show
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Feedback Confirmation Dialog */}
      <Dialog
        open={feedbackDeleteDialogOpen}
        onClose={() => {
          setFeedbackDeleteDialogOpen(false);
          setDeleteFeedbackId(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Feedback</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this feedback?
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setFeedbackDeleteDialogOpen(false);
              setDeleteFeedbackId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteFeedback}
            sx={{
              borderRadius: 2,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Delete Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Details Modal */}
      <Dialog
        open={feedbackDetailsModal.open}
        onClose={() => {
          setFeedbackDetailsModal({ open: false, feedback: null });
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 600, 
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          Feedback Details
          {feedbackDetailsModal.feedback && (
            <Chip
              size="small"
              label={feedbackDetailsModal.feedback.type}
              sx={{
                bgcolor:
                  feedbackDetailsModal.feedback.type === "bug"
                    ? "#f44336"
                    : feedbackDetailsModal.feedback.type === "feature"
                      ? "#2196f3"
                      : feedbackDetailsModal.feedback.type === "improvement"
                        ? "#ff9800"
                        : "#4caf50",
                color: "white",
                fontSize: "0.75rem",
                textTransform: "uppercase",
              }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {feedbackDetailsModal.feedback && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                    User
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {feedbackDetailsModal.feedback.username}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    size="small"
                    label={feedbackDetailsModal.feedback.status}
                    variant={
                      feedbackDetailsModal.feedback.status === "resolved" ? "filled" : "outlined"
                    }
                    color={
                      feedbackDetailsModal.feedback.status === "resolved" ? "success" : "default"
                    }
                  />
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                  Subject
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {feedbackDetailsModal.feedback.subject}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                  Message
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    bgcolor: "rgba(255,255,255,0.05)", 
                    p: 2, 
                    borderRadius: 1,
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {feedbackDetailsModal.feedback.message}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {feedbackDetailsModal.feedback.createdAt.toLocaleDateString()} {feedbackDetailsModal.feedback.createdAt.toLocaleTimeString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {feedbackDetailsModal.feedback.updatedAt.toLocaleDateString()} {feedbackDetailsModal.feedback.updatedAt.toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <Button
            onClick={() => {
              setFeedbackDetailsModal({ open: false, feedback: null });
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (feedbackDetailsModal.feedback) {
                setDeleteFeedbackId(feedbackDetailsModal.feedback.id);
                setFeedbackDetailsModal({ open: false, feedback: null });
                setFeedbackDeleteDialogOpen(true);
              }
            }}
            sx={{
              borderRadius: 2,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Delete Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default AdminPage;
