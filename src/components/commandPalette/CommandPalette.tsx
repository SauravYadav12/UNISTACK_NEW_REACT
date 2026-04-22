import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Dialog,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  alpha,
  useTheme,
  Divider,
} from '@mui/material';
import { IconSearch, IconSparkles, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { commandItems, CommandItem } from './commandPaletteConfig';
import { useCommandPalette, fuzzyMatch } from '../../hooks/useCommandPalette';
import { tokens } from '../../theme/theme';
import { AiBadge } from '../ui/AiSparkle';

const MotionBox = motion.create(Box);

export default function CommandPalette() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return commandItems;
    return commandItems.filter(
      (item) =>
        fuzzyMatch(query, item.label) ||
        item.keywords.some((kw) => fuzzyMatch(query, kw))
    );
  }, [query]);

  const navItems = filteredItems.filter((i) => i.section === 'navigate');
  const actionItems = filteredItems.filter((i) => i.section === 'actions');
  const allItems = [...navItems, ...actionItems];
  const isAiQuery = query.trim().length > 0 && allItems.length === 0;

  const handleSelect = (item: CommandItem) => {
    if (item.path) navigate(item.path);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = allItems.length + (isAiQuery ? 1 : 0);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(total, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(total, 1)) % Math.max(total, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < allItems.length) {
        handleSelect(allItems[selectedIndex]);
      }
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '20%',
          m: 0,
          borderRadius: 4,
          bgcolor: isDark
            ? alpha(tokens.colors.darkSurface, 0.95)
            : alpha('#FFFFFF', 0.95),
          backdropFilter: tokens.glass.blur,
          WebkitBackdropFilter: tokens.glass.blur,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          maxHeight: '60vh',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: alpha('#000', isDark ? 0.5 : 0.3),
            backdropFilter: 'blur(4px)',
          },
        },
      }}
    >
      <AnimatePresence>
        <MotionBox
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Search input */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2.5,
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <IconSearch size={20} color={theme.palette.text.secondary} />
            <InputBase
              inputRef={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, actions, or ask AI..."
              fullWidth
              sx={{
                fontSize: '0.9375rem',
                '& input::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 0.7,
                },
              }}
            />
            <Box
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.text.primary, 0.06),
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'text.secondary',
                flexShrink: 0,
              }}
            >
              ESC
            </Box>
          </Box>

          {/* Results */}
          <Box sx={{ overflowY: 'auto', maxHeight: 'calc(60vh - 60px)' }}>
            {navItems.length > 0 && (
              <>
                <Typography
                  variant="overline"
                  sx={{ px: 2.5, pt: 1.5, pb: 0.5, display: 'block', color: 'text.secondary' }}
                >
                  Navigate
                </Typography>
                <List disablePadding sx={{ px: 1 }}>
                  {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <ListItemButton
                        key={item.id}
                        selected={selectedIndex === idx}
                        onClick={() => handleSelect(item)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.25,
                          py: 1,
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                          <Icon size={18} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: selectedIndex === idx ? 500 : 400,
                          }}
                        />
                        {selectedIndex === idx && (
                          <IconArrowRight size={14} color={theme.palette.text.secondary} />
                        )}
                      </ListItemButton>
                    );
                  })}
                </List>
              </>
            )}

            {actionItems.length > 0 && (
              <>
                {navItems.length > 0 && <Divider sx={{ mx: 2 }} />}
                <Typography
                  variant="overline"
                  sx={{ px: 2.5, pt: 1.5, pb: 0.5, display: 'block', color: 'text.secondary' }}
                >
                  Actions
                </Typography>
                <List disablePadding sx={{ px: 1 }}>
                  {actionItems.map((item, idx) => {
                    const Icon = item.icon;
                    const globalIdx = navItems.length + idx;
                    return (
                      <ListItemButton
                        key={item.id}
                        selected={selectedIndex === globalIdx}
                        onClick={() => handleSelect(item)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.25,
                          py: 1,
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                          <Icon size={18} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: selectedIndex === globalIdx ? 500 : 400,
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </>
            )}

            {/* AI Query fallback */}
            {isAiQuery && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <AiBadge label="Ask AI" sx={{ mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Press <strong>Enter</strong> to ask AI: "{query}"
                </Typography>
              </Box>
            )}

            {/* Empty state */}
            {!query && allItems.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Start typing to search...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 2,
              px: 2.5,
              py: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              fontSize: '0.6875rem',
              color: 'text.secondary',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconSparkles size={12} /> AI powered
            </Box>
          </Box>
        </MotionBox>
      </AnimatePresence>
    </Dialog>
  );
}
