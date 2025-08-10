import {
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useNavigate } from "react-router-dom";
import { rootStore } from "../stores/RootStore";
import UserMenu from "./UserMenu";

interface ShowSummary {
  id: string;
  name: string;
  venue: string;
  createdAt: string | Date;
}

interface RatingGivenItem {
  id: string;
  score: number;
  comment?: string | null;
  songTitle?: string | null;
  createdAt: string | Date;
  performer: { id: string; username: string };
  show: ShowSummary;
}

interface RatingReceivedItem {
  id: string;
  score: number;
  comment?: string | null;
  songTitle?: string | null;
  createdAt: string | Date;
  rater: { id: string; username: string };
  show: ShowSummary;
}

interface UserHistory {
  showsAttended: ShowSummary[];
  ratingsGiven: RatingGivenItem[];
  ratingsReceived: RatingReceivedItem[];
  stats: {
    totalShowsAttended: number;
    totalRatingsGiven: number;
    totalRatingsReceived: number;
    averageRatingGiven: number;
    averageRatingReceived: number;
  };
}

const HistoryPage: React.FC = observer(() => {
  const { userStore, baseAPI } = rootStore;
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<UserHistory | null>(null);

  React.useEffect(() => {
    const load = async () => {
      if (!userStore.username) {
        setError("You must be logged in to view history.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await baseAPI.get<{
          success: boolean;
          history: UserHistory;
        }>(`/api/users/${encodeURIComponent(userStore.username)}/history`);
        if (res && (res as any).success && (res as any).history) {
          setHistory((res as any).history);
        } else if ((res as any).history) {
          setHistory((res as any).history);
        } else {
          setError("Failed to load history.");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load history.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userStore.username]);

  // Generate consistent colors for usernames
  const getUserColor = (username: string) => {
    const colors = [
      "#ff6b6b", // Coral red
      "#4ecdc4", // Turquoise
      "#45b7d1", // Sky blue
      "#f9ca24", // Yellow
      "#6c5ce7", // Purple
      "#a29bfe", // Light purple
      "#fd79a8", // Pink
      "#00b894", // Green
      "#e17055", // Orange
      "#74b9ff", // Light blue
      "#55a3ff", // Blue
      "#26de81", // Light green
      "#fc5c65", // Red
      "#fed330", // Amber
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDateTime = (d: string | Date) => new Date(d).toLocaleString();

  // Group ratings by show
  const groupRatingsByShow = (
    ratings: (RatingGivenItem | RatingReceivedItem)[]
  ) => {
    const grouped: {
      [showId: string]: {
        show: ShowSummary;
        ratings: (RatingGivenItem | RatingReceivedItem)[];
      };
    } = {};

    ratings.forEach((rating) => {
      const showId = rating.show.id;
      if (!grouped[showId]) {
        grouped[showId] = {
          show: rating.show,
          ratings: [],
        };
      }
      grouped[showId].ratings.push(rating);
    });

    // Sort shows by most recent first
    return Object.values(grouped).sort(
      (a, b) =>
        new Date(b.show.createdAt).getTime() -
        new Date(a.show.createdAt).getTime()
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={20} />
        <Typography color="text.secondary">Loading history…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Chip label="Go Home" color="primary" onClick={() => navigate("/")} />
      </Box>
    );
  }

  if (!history) {
    return (
      <Box>
        <Typography color="text.secondary">No history available.</Typography>
      </Box>
    );
  }

  const { stats, ratingsGiven, ratingsReceived, showsAttended } = history;

  // Combine and group all ratings by show
  const allRatings = [...ratingsGiven, ...ratingsReceived];
  const ratingsByShow = groupRatingsByShow(allRatings);

  return (
    <Box>
      {/* Header with navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: { xs: 2, sm: 3 },
          p: { xs: 1.25, sm: 2 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "rgba(255,255,255,0.1)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={() => navigate("/")}
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            }}
            aria-label="Go to home"
          >
            <HomeIcon />
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.2rem", sm: "1.5rem" },
              background: "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            My History
          </Typography>
        </Box>
        <UserMenu getUserColor={getUserColor} />
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)",
              border: "1px solid rgba(255, 107, 107, 0.2)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(255, 107, 107, 0.15)",
              },
            }}
          >
            <CardContent>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #ff6b6b, #ff8a80)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {stats.totalShowsAttended}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Shows Attended
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(78, 205, 196, 0.05) 100%)",
              border: "1px solid rgba(78, 205, 196, 0.2)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(78, 205, 196, 0.15)",
              },
            }}
          >
            <CardContent>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #4ecdc4, #26d0ce)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {stats.totalRatingsGiven}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ratings Given
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(69, 183, 209, 0.1) 0%, rgba(69, 183, 209, 0.05) 100%)",
              border: "1px solid rgba(69, 183, 209, 0.2)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(69, 183, 209, 0.15)",
              },
            }}
          >
            <CardContent>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #45b7d1, #64b5f6)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {stats.totalRatingsReceived}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ratings Received
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(249, 202, 36, 0.1) 0%, rgba(249, 202, 36, 0.05) 100%)",
              border: "1px solid rgba(249, 202, 36, 0.2)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(249, 202, 36, 0.15)",
              },
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #f9ca24, #f39c12)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {stats.averageRatingReceived.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Received
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* All Ratings */}
      <Card
        sx={{
          mb: 3,
          border: "1px solid rgba(255,255,255,0.1)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              background:
                "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              fontWeight: 600,
              fontSize: "1.3rem",
              mb: 2,
            }}
          >
            All Ratings
          </Typography>
          {ratingsByShow.length === 0 ? (
            <Typography color="text.secondary">No ratings yet.</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {ratingsByShow.map((showGroup) => (
                <Accordion
                  key={showGroup.show.id}
                  sx={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "12px !important",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    },
                    "&:before": {
                      display: "none",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "text.secondary" }} />
                    }
                    sx={{
                      borderRadius: "12px",
                      "&:hover": {
                        background: "rgba(255,255,255,0.03)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        width: "100%",
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {showGroup.show.name}
                      </Typography>
                      <Chip
                        label={`${showGroup.ratings.length} ratings`}
                        size="small"
                        variant="outlined"
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: "auto" }}
                      >
                        {showGroup.show.venue} •{" "}
                        {formatDateTime(showGroup.show.createdAt)}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      background: "rgba(0,0,0,0.1)",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.25,
                      }}
                    >
                      {showGroup.ratings.map((r) => (
                        <Box
                          key={r.id}
                          sx={{
                            p: 2,
                            borderRadius: "8px",
                            background:
                              "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                background:
                                  "performer" in r
                                    ? getUserColor(r.performer.username)
                                    : getUserColor(r.rater.username),
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                border: "2px solid rgba(255,255,255,0.1)",
                              }}
                            >
                              {"performer" in r
                                ? r.performer.username.charAt(0).toUpperCase()
                                : r.rater.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600 }} noWrap>
                                {"performer" in r
                                  ? `Rated ${r.performer.username}`
                                  : `Rating from ${r.rater.username}`}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                              >
                                {r.songTitle || "Unknown song"}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${r.score}/10`}
                              color={"performer" in r ? "primary" : "secondary"}
                              size="small"
                              sx={{
                                fontWeight: "bold",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                background:
                                  "performer" in r
                                    ? "linear-gradient(45deg, #ff6b6b, #ff8a80)"
                                    : "linear-gradient(45deg, #4ecdc4, #26d0ce)",
                                color: "white",
                                border: "none",
                              }}
                            />
                          </Box>
                          {r.comment && (
                            <Typography
                              variant="body2"
                              sx={{ mt: 0.5, ml: 4.5 }}
                            >
                              "{r.comment}"
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.5, ml: 4.5 }}
                          >
                            {formatDateTime(r.createdAt)}
                          </Typography>
                          <Divider sx={{ mt: 1 }} />
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Shows attended */}
      <Card
        sx={{
          border: "1px solid rgba(255,255,255,0.1)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              background: "linear-gradient(45deg, #6c5ce7, #a29bfe, #fd79a8)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              fontWeight: 600,
              fontSize: "1.3rem",
              mb: 2,
            }}
          >
            Shows Attended
          </Typography>
          {showsAttended.length === 0 ? (
            <Typography color="text.secondary">No shows recorded.</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {showsAttended.map((s) => (
                <Box
                  key={s.id}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.venue} • {formatDateTime(s.createdAt)}
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

export default HistoryPage;
