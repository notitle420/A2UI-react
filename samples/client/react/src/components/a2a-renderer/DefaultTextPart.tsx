import { useMemo } from 'react';
import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { RendererComponentProps } from '@/types';

export function DefaultTextPart({ uiMessageContent }: RendererComponentProps) {
  const text = useMemo(() => {
    const data = uiMessageContent.data;
    if ('kind' in data && data.kind === 'text' && 'text' in data) {
      return data.text as string;
    }
    return '';
  }, [uiMessageContent.data]);

  return (
    <Box
      sx={{
        '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
        '& pre': {
          bgcolor: 'grey.100',
          p: 1.5,
          borderRadius: 1,
          overflow: 'auto',
        },
        '& code': {
          bgcolor: 'grey.100',
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
          fontSize: '0.875em',
        },
        '& pre code': {
          bgcolor: 'transparent',
          p: 0,
        },
        '& ul, & ol': { pl: 3, mb: 1 },
        '& li': { mb: 0.5 },
        '& a': { color: 'primary.main' },
        '& blockquote': {
          borderLeft: 3,
          borderColor: 'grey.300',
          pl: 2,
          ml: 0,
          color: 'text.secondary',
        },
      }}
    >
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{text}</ReactMarkdown>
    </Box>
  );
}
