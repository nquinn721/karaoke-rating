import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DragIndicator as DragIndicatorIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Paper,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { rootStore } from "../stores/RootStore";

interface SingerGroup {
  id: string;
  singer: string;
  songs: string[];
  totalSongs: number;
}

interface SortableSingerGroupProps {
  singerGroup: SingerGroup;
  position: number;
  getUserColor: (username: string) => string;
}

const SortableSingerGroup: React.FC<SortableSingerGroupProps> = ({
  singerGroup,
  position,
  getUserColor,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: singerGroup.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      sx={{
        mb: 1,
        p: 0,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <Paper
        elevation={isDragging ? 8 : 2}
        sx={{
          width: "100%",
          p: 2,
          background: isDragging
            ? "rgba(255, 255, 255, 0.15)"
            : "rgba(255, 255, 255, 0.05)",
          border: "1px solid",
          borderColor: isDragging
            ? "rgba(255, 255, 255, 0.3)"
            : "rgba(255, 255, 255, 0.1)",
          borderRadius: 2,
          transition: "all 0.2s ease",
          "&:hover": {
            background: "rgba(255, 255, 255, 0.08)",
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            width: "100%",
          }}
        >
          {/* Position Badge */}
          <Box
            sx={{
              position: "absolute",
              left: -16,
              top: 12,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "linear-gradient(45deg, #6c5ce7, #a29bfe)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "white",
                fontWeight: "bold",
                fontSize: "0.7rem",
              }}
            >
              {position}
            </Typography>
          </Box>

          {/* Drag Handle */}
          <Box
            {...listeners}
            sx={{
              display: "flex",
              alignItems: "center",
              color: "text.secondary",
              cursor: "grab",
              mt: 0.5,
              "&:hover": {
                color: "primary.main",
              },
            }}
          >
            <DragIndicatorIcon />
          </Box>

          {/* Avatar */}
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: getUserColor(singerGroup.singer),
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              border: "2px solid rgba(255,255,255,0.1)",
              mt: 0.5,
            }}
          >
            {singerGroup.singer.charAt(0).toUpperCase()}
          </Avatar>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <PersonIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap>
                {singerGroup.singer}
              </Typography>
              <Chip
                size="small"
                label={`${singerGroup.totalSongs} song${singerGroup.totalSongs !== 1 ? "s" : ""}`}
                sx={{
                  fontSize: "0.7rem",
                  height: 20,
                  background: "rgba(78, 205, 196, 0.2)",
                  color: "#4ecdc4",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>
    </ListItem>
  );
};

interface QueueOrderModalProps {
  open: boolean;
  onClose: () => void;
  showId: string;
  getUserColor: (username: string) => string;
}

const QueueOrderModal: React.FC<QueueOrderModalProps> = observer(
  ({ open, onClose, showId, getUserColor }) => {
    const { showsStore, chatStore } = rootStore;

    // Group queue items by singer, ensuring ALL show participants are included
    const singerGroups = React.useMemo(() => {
      const wsQueue = chatStore.queueByShow.get(showId);
      const queue = wsQueue || showsStore.currentShow?.queue || [];

      // Collect participants from WS and API (fallback), plus any singers from queue
      const wsParticipants = chatStore.participantsByShow.get(showId) || [];
      const apiParticipants = showsStore.currentShow?.participants || [];
      const queueSingers = Array.from(
        new Set(queue.map((i: any) => i.singer).filter(Boolean))
      );
      const allSingers = Array.from(
        new Set(
          [...wsParticipants, ...apiParticipants, ...queueSingers].filter(
            Boolean
          )
        )
      );

      // Build songs per singer from the latest queue
      const songsMap = new Map<string, string[]>();
      queue.forEach((item: any) => {
        if (!songsMap.has(item.singer)) songsMap.set(item.singer, []);
        songsMap.get(item.singer)!.push(item.song);
      });

      // Return a group for every singer in the show (even if they have 0 songs)
      return allSingers.map((singer, index) => {
        const songs = songsMap.get(singer) || [];
        return {
          id: `singer-${singer}-${index}`,
          singer,
          songs,
          totalSongs: songs.length,
        } as SingerGroup;
      });
    }, [
      chatStore.queueByShow.get(showId),
      chatStore.participantsByShow.get(showId),
      showsStore.currentShow?.queue,
      showsStore.currentShow?.participants,
      showId,
    ]);

    const [orderedSingers, setOrderedSingers] = useState<SingerGroup[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize ordered singers when modal opens or groups change
    React.useEffect(() => {
      if (open) {
        setOrderedSingers(singerGroups);
        setHasChanges(false);
      }
    }, [open, singerGroups]);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      })
    );

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setOrderedSingers((singers) => {
          const oldIndex = singers.findIndex(
            (singer) => singer.id === active.id
          );
          const newIndex = singers.findIndex((singer) => singer.id === over.id);

          const newOrder = arrayMove(singers, oldIndex, newIndex);
          setHasChanges(true);
          return newOrder;
        });
      }
    };

    const handleSave = async () => {
      try {
        // Use the latest queue and perform a stable sort by the selected singer order
        const wsQueue = chatStore.queueByShow.get(showId);
        const latestQueue: { singer: string; song: string }[] = (wsQueue ||
          showsStore.currentShow?.queue ||
          []) as any[];

        // Rank singers by their order in the UI
        const rank = new Map<string, number>(
          orderedSingers.map((g, i) => [g.singer, i])
        );

        // Persist singer order for this show (used by CurrentPerformance)
        localStorage.setItem(
          `singerOrder:${showId}`,
          JSON.stringify(orderedSingers.map((g) => g.singer))
        );

        // Stable sort by singer rank, preserving each singer's internal song order
        const reorderedQueue = latestQueue
          .map((item, idx) => ({ item, idx }))
          .sort((a, b) => {
            const ra = rank.has(a.item.singer)
              ? (rank.get(a.item.singer) as number)
              : Number.MAX_SAFE_INTEGER;
            const rb = rank.has(b.item.singer)
              ? (rank.get(b.item.singer) as number)
              : Number.MAX_SAFE_INTEGER;
            if (ra !== rb) return ra - rb;
            return a.idx - b.idx; // preserve original order for same singer
          })
          .map((e) => e.item);

        await showsStore.reorderQueue(showId, reorderedQueue);
        setHasChanges(false);
        onClose();
      } catch (error) {
        console.error("Failed to save queue order:", error);
      }
    };

    const handleCancel = () => {
      setOrderedSingers(singerGroups);
      setHasChanges(false);
      onClose();
    };

    if (singerGroups.length === 0) {
      return (
        <Dialog
          open={open}
          onClose={handleCancel}
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
          <DialogTitle sx={{ fontWeight: 600 }}>Singer Order</DialogTitle>
          <DialogContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              The queue is empty. Add some singers first!
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel}>Close</Button>
          </DialogActions>
        </Dialog>
      );
    }

    const totalSongs = singerGroups.reduce(
      (sum, group) => sum + group.totalSongs,
      0
    );

    return (
      <Dialog
        open={open}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(30,30,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
            maxHeight: "80vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            pb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Order Singers
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Drag singers to reorder • {orderedSingers.length} singers •{" "}
              {totalSongs} songs
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, maxHeight: "60vh", overflow: "auto" }}>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={orderedSingers.map((singer) => singer.id)}
              strategy={verticalListSortingStrategy}
            >
              <List sx={{ width: "100%", p: 0 }}>
                {orderedSingers.map((singerGroup, index) => (
                  <SortableSingerGroup
                    key={singerGroup.id}
                    singerGroup={singerGroup}
                    position={index + 1}
                    getUserColor={getUserColor}
                  />
                ))}
              </List>
            </SortableContext>
          </DndContext>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 1,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: hasChanges ? "warning.main" : "text.secondary",
              fontWeight: hasChanges ? 600 : 400,
            }}
          >
            {hasChanges ? "You have unsaved changes" : "No changes made"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={handleCancel} disabled={!open}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasChanges}
              sx={{
                background: hasChanges
                  ? "linear-gradient(135deg, #6c5ce7, #a29bfe)"
                  : undefined,
                "&:hover": hasChanges
                  ? {
                      background: "linear-gradient(135deg, #5f4fcf, #8b7ff7)",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(108, 92, 231, 0.3)",
                    }
                  : undefined,
                transition: "all 0.2s ease",
              }}
            >
              Save Order
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    );
  }
);

export default QueueOrderModal;
