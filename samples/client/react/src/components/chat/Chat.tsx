import { Box } from '@mui/material';
import { ChatHistory } from './ChatHistory';
import { InputArea } from './InputArea';
import { useChatStore } from '@/stores';

interface ChatProps {
  emptyHistoryContent?: React.ReactNode;
}

export function Chat({ emptyHistoryContent }: ChatProps) {
  const history = useChatStore((state) => state.history);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        pt: 1,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <ChatHistory history={history} emptyHistoryContent={emptyHistoryContent} />
      </Box>
      <InputArea />
    </Box>
  );
}
