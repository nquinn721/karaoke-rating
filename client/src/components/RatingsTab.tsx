import {
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { rootStore } from "../stores/RootStore";
import { Rating } from "../stores/types";
import UserHistoryModal from "./UserHistoryModal";

const RatingsTab: React.FC = observer(() => {
  const { showsStore } = rootStore;
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string>("");

  const openUserHistory = (username: string) => {
    setSelectedUsername(username);
    setHistoryModalOpen(true);
  };

  if (!showsStore.currentShow) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6">No show selected</Typography>
      </Box>
    );
  }

  const ratings = showsStore.currentShow.ratings;

  // Get unique performers with their average ratings
  const performerStats = ratings.reduce(
    (acc, rating) => {
      const key = `${rating.singer}-${rating.song}`;
      if (!acc[key]) {
        acc[key] = {
          singer: rating.singer,
          song: rating.song,
          ratings: [],
          totalRating: 0,
          count: 0,
        };
      }
      acc[key].ratings.push(rating);
      acc[key].totalRating += rating.rating;
      acc[key].count += 1;
      return acc;
    },
    {} as Record<string, any>
  );

  const performerList = Object.values(performerStats)
    .map((performer: any) => ({
      ...performer,
      averageRating: (performer.totalRating / performer.count).toFixed(1),
    }))
    .sort((a: any, b: any) => b.averageRating - a.averageRating);

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "#4caf50"; // Green
    if (rating >= 6) return "#ff9800"; // Orange
    if (rating >= 4) return "#f44336"; // Red
    return "#9e9e9e"; // Grey
  };

  const getRatingIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    if (current > previous)
      return <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />;
    if (current < previous)
      return <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />;
    return null;
  };

  return (
    <Box>
      {/* Top Performers */}
      {performerList.length > 0 && (
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
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                background: "linear-gradient(45deg, #667eea, #764ba2, #f093fb)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                fontWeight: 600,
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                mb: { xs: 1.5, sm: 2 },
              }}
            >
              Performance Rankings
            </Typography>
            <Box sx={{ mt: 2 }}>
              {performerList.map((performer: any, index: number) => (
                <Box key={`${performer.singer}-${performer.song}`}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "flex-start", sm: "center" },
                      flexDirection: { xs: "column", sm: "row" },
                      py: { xs: 1.5, sm: 2 },
                      gap: { xs: 1, sm: 0 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        flex: 1,
                        gap: 1,
                        mb: { xs: 1, sm: 0 },
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color:
                            index === 0
                              ? "#ffd700"
                              : index === 1
                                ? "#c0c0c0"
                                : index === 2
                                  ? "#cd7f32"
                                  : "text.secondary",
                          fontWeight: "bold",
                          fontSize: { xs: "1rem", sm: "1.25rem" },
                          minWidth: "auto",
                        }}
                      >
                        #{index + 1}
                      </Typography>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: "bold",
                            cursor: "pointer",
                            fontSize: { xs: "0.95rem", sm: "1rem" },
                            "&:hover": {
                              color: "primary.main",
                              textDecoration: "underline",
                            },
                          }}
                          onClick={() => openUserHistory(performer.singer)}
                        >
                          {performer.singer}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: "0.8rem", sm: "0.875rem" },
                            mt: 0.25,
                          }}
                        >
                          {performer.song}
                        </Typography>
                      </Box>

                      {getRatingIcon(
                        performer.averageRating,
                        index > 0
                          ? performerList[index - 1].averageRating
                          : undefined
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexShrink: 0,
                        justifyContent: { xs: "flex-start", sm: "flex-end" },
                      }}
                    >
                      <Chip
                        size="small"
                        label={`${performer.averageRating}★`}
                        sx={{
                          bgcolor: getRatingColor(performer.averageRating),
                          color: "white",
                          fontWeight: "bold",
                          fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        ({performer.count} rating
                        {performer.count !== 1 ? "s" : ""})
                      </Typography>
                    </Box>
                  </Box>
                  {index < performerList.length - 1 && (
                    <Divider sx={{ opacity: 0.3 }} />
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recent Ratings History */}
      <Card
        sx={{
          border: "1px solid rgba(255,255,255,0.1)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              background: "linear-gradient(45deg, #f093fb, #f5576c, #4facfe)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              fontWeight: 600,
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              mb: { xs: 1.5, sm: 2 },
            }}
          >
            Recent Ratings
          </Typography>
          {ratings.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No ratings yet. Be the first to rate a performance!
            </Typography>
          ) : (
            <Box>
              {ratings
                .slice()
                .reverse()
                .slice(0, 20) // Show last 20 ratings
                .map((rating: Rating) => (
                  <Box key={rating.id} sx={{ mb: { xs: 2.5, sm: 2 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: { xs: 1.5, sm: 2 },
                        p: { xs: 1.5, sm: 0 },
                        borderRadius: { xs: 2, sm: 0 },
                        background: {
                          xs: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                          sm: "transparent",
                        },
                        border: {
                          xs: "1px solid rgba(255,255,255,0.1)",
                          sm: "none",
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                          bgcolor: "primary.main",
                          fontSize: { xs: "0.8rem", sm: "0.9rem" },
                          flexShrink: 0,
                        }}
                      >
                        {rating.ratedBy.charAt(0).toUpperCase()}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: { xs: "flex-start", sm: "center" },
                            flexDirection: { xs: "column", sm: "row" },
                            gap: { xs: 0.5, sm: 1 },
                            mb: { xs: 1, sm: 0.5 },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: "bold",
                                cursor: "pointer",
                                fontSize: { xs: "0.9rem", sm: "0.875rem" },
                                "&:hover": {
                                  color: "primary.main",
                                  textDecoration: "underline",
                                },
                              }}
                              onClick={() => openUserHistory(rating.singer)}
                            >
                              {rating.singer}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: { xs: "none", sm: "block" } }}
                            >
                              •
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                fontStyle: { xs: "italic", sm: "normal" },
                              }}
                            >
                              {rating.song}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: { xs: "block", sm: "none" },
                              mt: 0.5,
                            }}
                          >
                            <Chip
                              size="small"
                              label={`${rating.rating}/10`}
                              sx={{
                                bgcolor: getRatingColor(rating.rating),
                                color: "white",
                                fontWeight: "bold",
                                fontSize: "0.75rem",
                              }}
                            />
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: { xs: "flex-start", sm: "center" },
                            flexDirection: { xs: "column", sm: "row" },
                            gap: { xs: 0.5, sm: 1 },
                            mb: { xs: 1, sm: 1 },
                          }}
                        >
                          <Box sx={{ display: { xs: "none", sm: "block" } }}>
                            <Chip
                              size="small"
                              label={`${rating.rating}/10`}
                              sx={{
                                bgcolor: getRatingColor(rating.rating),
                                color: "white",
                                fontWeight: "bold",
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: { xs: "0.75rem", sm: "0.75rem" } }}
                          >
                            by{" "}
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                cursor: "pointer",
                                fontWeight: { xs: 500, sm: 400 },
                                "&:hover": {
                                  color: "primary.main",
                                  textDecoration: "underline",
                                },
                              }}
                              onClick={() => openUserHistory(rating.ratedBy)}
                            >
                              {rating.ratedBy}
                            </Typography>
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              display: { xs: "block", sm: "inline" },
                            }}
                          >
                            •{" "}
                            {rating.createdAt &&
                              new Date(rating.createdAt).toLocaleString()}
                          </Typography>
                        </Box>

                        {rating.comment && (
                          <Paper
                            sx={{
                              p: { xs: 1.25, sm: 1.5 },
                              mt: 1,
                              bgcolor: "background.default",
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: { xs: 1.5, sm: 1 },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontStyle: "italic",
                                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                              }}
                            >
                              "{rating.comment}"
                            </Typography>
                          </Paper>
                        )}
                      </Box>
                    </Box>
                    <Divider sx={{ mt: 2, opacity: 0.3 }} />
                  </Box>
                ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <UserHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        username={selectedUsername}
      />
    </Box>
  );
});

export default RatingsTab;
