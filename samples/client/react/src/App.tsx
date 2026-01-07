import { useEffect } from 'react';
import { Box } from '@mui/material';
import { Chat } from './components/chat/Chat';
import { Canvas } from './components/a2ui-catalog/Canvas';
import { MainLayout } from './components/layout/MainLayout';
import { useChatStore } from './stores';
import { DEFAULT_PART_RESOLVERS } from './components/a2a-renderer/registry';
import { a2aService, catalogService } from './services';

// Catalog URIs for the rizzcharts application
const STANDARD_CATALOG_URI = 'https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/0.8/json/standard_catalog_definition.json';
const RIZZCHARTS_CATALOG_URI = 'https://raw.githubusercontent.com/google/A2UI/refs/heads/main/a2a_agents/python/adk/samples/rizzcharts/rizzcharts_catalog_definition.json';

function App() {
  const { setAgentCard, setPartResolvers } = useChatStore();

  useEffect(() => {
    // Initialize part resolvers
    setPartResolvers(DEFAULT_PART_RESOLVERS);

    // Initialize catalog URIs for A2UI
    catalogService.setCatalogUris([STANDARD_CATALOG_URI, RIZZCHARTS_CATALOG_URI]);

    // Fetch agent card on mount
    a2aService
      .getAgentCard()
      .then((card) => {
        setAgentCard(card);
        console.log('Agent card loaded:', card.name);
      })
      .catch((error) => {
        console.error('Failed to load agent card:', error);
      });
  }, [setAgentCard, setPartResolvers]);

  return (
    <MainLayout>
      <Box sx={{ height: '100%', display: 'flex' }}>
        <Box sx={{ width: 800, flexShrink: 0, borderRight: 1, borderColor: 'divider' }}>
          <Chat />
        </Box>
        <Box sx={{ flex: 1, bgcolor: 'grey.50', p: 2 }}>
          <Canvas />
        </Box>
      </Box>
    </MainLayout>
  );
}

export default App;
