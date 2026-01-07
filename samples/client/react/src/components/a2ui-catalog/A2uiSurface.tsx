import { Box, Card, Typography, Stack, Divider } from '@mui/material';
import type { A2uiSurface } from '@/utils/a2ui-processor';
import { Chart } from './Chart';
import { GoogleMap } from './GoogleMap';
import { resolveValue } from '@/utils/a2ui-value-resolver';
import { resolveChartData } from '@/utils/a2ui-chart-resolver';
import { resolveMapPins, resolveMapCenter } from '@/utils/a2ui-map-resolver';
import { getDataByPath } from '@/utils/data-path-resolver';

interface A2uiSurfaceRendererProps {
  surface: A2uiSurface;
}

interface ComponentRendererProps {
  componentId: string;
  surface: A2uiSurface;
  dataContextPath?: string;
}

/**
 * Resolves child component references into ComponentRenderer calls.
 */
function resolveChildren(
  childrenDef: unknown,
  surface: A2uiSurface,
  dataContextPath: string
): React.ReactNode[] {
  if (!childrenDef || typeof childrenDef !== 'object') return [];

  const def = childrenDef as Record<string, unknown>;

  if ('explicitList' in def && Array.isArray(def.explicitList)) {
    return def.explicitList.map((id, index) => (
      <ComponentRenderer
        key={id + index}
        componentId={id as string}
        surface={surface}
        dataContextPath={dataContextPath}
      />
    ));
  }

  return [];
}

/**
 * Renders a single A2UI component.
 */
function ComponentRenderer({ componentId, surface, dataContextPath = '/' }: ComponentRendererProps) {
  const componentData = surface.components.get(componentId);
  if (!componentData) return null;

  const componentDef = componentData.component;
  const componentType = Object.keys(componentDef)[0];
  const properties = componentDef[componentType] as Record<string, unknown> | undefined;

  if (!properties) return null;

  switch (componentType) {
    // Custom components from rizzcharts catalog
    case 'Chart': {
      const chartType = resolveValue(properties.type, surface.dataModel, dataContextPath) as string || 'pie';
      const title = resolveValue(properties.title, surface.dataModel, dataContextPath) as string || '';
      const chartData = resolveChartData(properties.chartData, surface.dataModel, dataContextPath);

      return (
        <Chart
          type={chartType as 'pie' | 'doughnut' | 'bar' | 'line'}
          title={title}
          chartData={chartData}
        />
      );
    }

    case 'GoogleMap': {
      const zoom = resolveValue(properties.zoom, surface.dataModel, dataContextPath) as number || 8;
      const center = resolveMapCenter(properties.center, surface.dataModel, dataContextPath);
      const pins = resolveMapPins(properties.pins, surface.dataModel, dataContextPath);
      const title = resolveValue(properties.title, surface.dataModel, dataContextPath) as string;

      return (
        <GoogleMap
          zoom={zoom}
          center={center}
          pins={pins}
          title={title}
        />
      );
    }

    case 'Canvas': {
      // Canvas is a container component that renders its children
      const children = resolveChildren(properties.children, surface, dataContextPath);
      return (
        <Box sx={{ width: '100%' }}>
          {children}
        </Box>
      );
    }

    // Standard A2UI components
    case 'Text': {
      const text = resolveValue(properties.text, surface.dataModel, dataContextPath) as string;
      const usageHint = properties.usageHint as string | undefined;

      const variant = usageHint === 'h1' ? 'h4' :
                      usageHint === 'h2' ? 'h5' :
                      usageHint === 'h3' ? 'h6' : 'body1';

      return (
        <Typography variant={variant} sx={{ mb: usageHint ? 1 : 0.5 }}>
          {text ?? ''}
        </Typography>
      );
    }

    case 'Column': {
      const children = resolveChildren(properties.children, surface, dataContextPath);
      return (
        <Stack direction="column" spacing={1}>
          {children}
        </Stack>
      );
    }

    case 'Row': {
      const children = resolveChildren(properties.children, surface, dataContextPath);
      const distribution = properties.distribution as string | undefined;

      return (
        <Stack
          direction="row"
          spacing={1}
          justifyContent={distribution === 'spaceBetween' ? 'space-between' : 'flex-start'}
          alignItems="center"
        >
          {children}
        </Stack>
      );
    }

    case 'Card': {
      const childId = properties.child as string | undefined;
      return (
        <Card variant="outlined" sx={{ p: 1.5, mb: 1 }}>
          {childId && (
            <ComponentRenderer
              componentId={childId}
              surface={surface}
              dataContextPath={dataContextPath}
            />
          )}
        </Card>
      );
    }

    case 'List': {
      const childrenDef = properties.children as Record<string, unknown> | undefined;
      if (!childrenDef) return null;

      // Handle template-based list
      if ('template' in childrenDef) {
        const template = childrenDef.template as { componentId: string; dataBinding: string };
        const dataPath = template.dataBinding.startsWith('/')
          ? template.dataBinding
          : `${dataContextPath}/${template.dataBinding}`.replace(/\/+/g, '/');

        const items = getDataByPath(surface.dataModel, dataPath);
        if (!Array.isArray(items)) {
          return null;
        }

        return (
          <Stack direction="column" spacing={0.5}>
            {items.map((_, index) => (
              <ComponentRenderer
                key={index}
                componentId={template.componentId}
                surface={surface}
                dataContextPath={`${dataPath}/${index}`}
              />
            ))}
          </Stack>
        );
      }

      // Handle explicit list
      const children = resolveChildren(childrenDef, surface, dataContextPath);
      return <Stack direction="column" spacing={0.5}>{children}</Stack>;
    }

    case 'Divider':
      return <Divider sx={{ my: 1 }} />;

    case 'Image': {
      const src = resolveValue(properties.src, surface.dataModel, dataContextPath) as string;
      const alt = (resolveValue(properties.alt, surface.dataModel, dataContextPath) as string) || '';
      return (
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{ maxWidth: '100%', borderRadius: 1 }}
        />
      );
    }

    default:
      // For unknown component types, render a placeholder
      return (
        <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Component: {componentType}
          </Typography>
        </Box>
      );
  }
}

export function A2uiSurfaceRenderer({ surface }: A2uiSurfaceRendererProps) {
  if (!surface.rootComponentId) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <ComponentRenderer
        componentId={surface.rootComponentId}
        surface={surface}
        dataContextPath="/"
      />
    </Box>
  );
}
