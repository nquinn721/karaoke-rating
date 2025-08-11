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
  MusicNote as MusicNoteIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
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

interface QueueItem {
  id: string;
  singer: string;
  song: string;
}

interface SortableQueueItemProps {
  item: QueueItem;
  getUserColor: (username: string) => string;
}

const SortableQueueItem: React.FC<SortableQueueItemProps> = ({
  item,
  getUserColor,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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
            alignItems: "center",
            gap: 2,
            width: "100%",
          }}
        >
          {/* Drag Handle */}
          <Box
            {...listeners}
            sx={{
              display: "flex",
              alignItems: "center",
              color: "text.secondary",
              cursor: "grab",
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
              width: 40,
              height: 40,
              background: getUserColor(item.singer),
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              border: "2px solid rgba(255,255,255,0.1)",
            }}
          >
            {item.singer.charAt(0).toUpperCase()}
          </Avatar>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.5,
              }}
            >
              <PersonIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                {item.singer}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <MusicNoteIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.song}
              </Typography>
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

    // Get current queue
    const currentQueue = React.useMemo(() => {
      const wsQueue = chatStore.queueByShow.get(showId);
      const queue = wsQueue || showsStore.currentShow?.queue || [];
      return queue.map((item: any, index: number) => ({
        id: `${item.singer}-${item.song}-${index}`,
        singer: item.singer,
        song: item.song,
      }));
    }, [chatStore.queueByShow, showId, showsStore.currentShow?.queue]);

    const [orderedQueue, setOrderedQueue] = useState<QueueItem[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize ordered queue when modal opens or queue changes
    React.useEffect(() => {
      if (open) {
        setOrderedQueue(currentQueue);
        setHasChanges(false);
      }
    }, [open, currentQueue]);

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
        setOrderedQueue((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);

          const newOrder = arrayMove(items, oldIndex, newIndex);
          setHasChanges(true);
          return newOrder;
        });
      }
    };

    const handleSave = async () => {
      try {
        const reorderedQueue = orderedQueue.map((item) => ({
          singer: item.singer,
          song: item.song,
        }));
        
        await showsStore.reorderQueue(showId, reorderedQueue);
        setHasChanges(false);
        onClose();
      } catch (error) {
        console.error("Failed to save queue order:", error);
      }
    };

    const handleCancel = () => {
      setOrderedQueue(currentQueue);
      setHasChanges(false);
      onClose();
    };

    if (orderedQueue.length === 0) {
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
          <DialogTitle sx={{ fontWeight: 600 }}>Queue Order</DialogTitle>
          <DialogContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              The queue is empty. Add some songs first!
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel}>Close</Button>
          </DialogActions>
        </Dialog>
      );
    }

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
              Reorder Queue
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Drag songs to reorder • {orderedQueue.length} songs
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, maxHeight: "60vh", overflow: "auto" }}>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={orderedQueue.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <List sx={{ width: "100%", p: 0 }}>
                {orderedQueue.map((item, index) => (
                  <Box key={item.id} sx={{ position: "relative" }}>
                    {/* Position indicator */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: -16,
                        top: "50%",
                        transform: "translateY(-50%)",
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
                        {index + 1}
                      </Typography>
                    </Box>
                    <SortableQueueItem
                      item={item}
                      getUserColor={getUserColor}
                    />
                  </Box>
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
