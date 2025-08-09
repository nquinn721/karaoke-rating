import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useState } from "react";
import { rootStore } from "../stores/RootStore";

const AdminPage: React.FC = observer(() => {
  const { chatStore, feedbackStore } = rootStore;
  const [loading, setLoading] = useState(true);
  // Socket-provided admin users (includes socketId)
  const [adminUsers, setAdminUsers] = useState<
    Array<{ socketId: string; username: string; showId?: string }>
  >([]);

  // Live users from socket participants as fallback if adminUsers not available
  const activeUsers = useMemo(() => {
    const map = new Map<string, Set<string>>(); // username -> set of showIds
    chatStore.participantsByShow.forEach((list, showId) => {
      list.forEach((u) => {
        if (!map.has(u)) map.set(u, new Set());
        map.get(u)!.add(showId);
      });
    });
    return Array.from(map.entries()).map(([username, shows]) => ({
      username,
      shows: Array.from(shows),
    }));
  }, [chatStore.participantsByShow]);

  // Subscribe to admin socket streams when socket is available
  useEffect(() => {
    const s = chatStore.socket;
    if (!s) return;

    const onAdminActiveUsers = (
      users: Array<{ socketId: string; username: string; showId?: string }>
    ) => {
      setAdminUsers(users || []);
    };
    const onAdminFeedbackAll = (list: any[]) => {
      feedbackStore.feedbackList = (list || []).map((f: any) => ({
        ...f,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      }));
      setLoading(false);
    };
    const onAdminFeedbackAdded = (f: any) => {
      const normalized = {
        ...f,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      };
      feedbackStore.feedbackList = [normalized, ...(feedbackStore.feedbackList || [])];
    };
    const onAdminFeedbackUpdated = (f: any) => {
      const normalized = {
        ...f,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      };
      feedbackStore.feedbackList = (feedbackStore.feedbackList || []).map((x) =>
        x.id === normalized.id ? normalized : x
      );
    };

    s.on("adminActiveUsers", onAdminActiveUsers);
    s.on("adminFeedbackAll", onAdminFeedbackAll);
    s.on("adminFeedbackAdded", onAdminFeedbackAdded);
    s.on("adminFeedbackUpdated", onAdminFeedbackUpdated);

    // Request initial admin payload via socket
    s.emit("adminSubscribe");

    return () => {
      s.off("adminActiveUsers", onAdminActiveUsers);
      s.off("adminFeedbackAll", onAdminFeedbackAll);
      s.off("adminFeedbackAdded", onAdminFeedbackAdded);
      s.off("adminFeedbackUpdated", onAdminFeedbackUpdated);
    };
  }, [chatStore.socket]);

  // REST fallback for initial load (in case socket hasn’t sent yet)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await feedbackStore.fetchAllFeedback();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (!feedbackStore.feedbackList.length) {
      load();
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Admin
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Live Users
              </Typography>
              {/* Prefer socket-provided admin users if available (includes socketId) */}
              {adminUsers.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {adminUsers.map((u) => (
                    <Box
                      key={u.socketId}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        label={u.socketId}
                        size="small"
                        variant="outlined"
                      />
                      <Typography sx={{ fontWeight: 600 }}>
                        {u.username || "(unknown)"}
                      </Typography>
                      {u.showId && (
                        <Chip label={`show:${u.showId}`} size="small" />
                      )}
                    </Box>
                  ))}
                </Box>
              ) : activeUsers.length === 0 ? (
                <Typography color="text.secondary">No active users</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {activeUsers.map((u) => (
                    <Box
                      key={u.username}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>{u.username}</Typography>
                      {u.shows.map((sid) => (
                        <Chip key={sid} label={`show:${sid}`} size="small" />
                      ))}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Feedback
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={18} />
                  <Typography color="text.secondary">Loading…</Typography>
                </Box>
              ) : feedbackStore.feedbackList.length === 0 ? (
                <Typography color="text.secondary">No feedback yet</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {feedbackStore.feedbackList.map((f) => (
                    <Box
                      key={f.id}
                      sx={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 1,
                        p: 1.25,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {f.subject}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {f.type} • by {f.username} •{" "}
                        {new Date(f.createdAt).toLocaleString()}
                      </Typography>
                      <Typography sx={{ mt: 0.5 }}>{f.message}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
});

export default AdminPage;
