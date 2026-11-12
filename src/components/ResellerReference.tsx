import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import { useEffect, useMemo } from 'react';
import '../styles/scalar.css';
import spec from '../data/reseller-openapi.json';
import { currentTheme } from '../scripts/theme';

/**
 * The Scalar API reference, rendered in the browser from the spec bundled with this page. Colors,
 * type and radius come from the c6 tokens (styles/scalar.css). Everything that would call Scalar's
 * servers (fonts, telemetry, the agent, the request client and its proxy) is off.
 */
export default function ResellerReference() {
  // Scalar reads its light/dark mode once, at mount, and marks it on <body>. Later site theme
  // changes swap that class directly, so the reference is not rebuilt (or scrolled) on a toggle.
  useEffect(() => {
    const sync = () => {
      const dark = currentTheme() === 'dark';
      document.body.classList.toggle('dark-mode', dark);
      document.body.classList.toggle('light-mode', !dark);
    };
    document.addEventListener('themechange', sync);
    return () => document.removeEventListener('themechange', sync);
  }, []);

  const configuration = useMemo(
    () => ({
      content: spec,
      theme: 'none' as const,
      layout: 'modern' as const,
      withDefaultFonts: false,
      telemetry: false,
      agent: { disabled: true },
      hideClientButton: true,
      hideTestRequestButton: true,
      hideDarkModeToggle: true,
      forceDarkModeState: currentTheme(),
      documentDownloadType: 'json' as const,
      defaultOpenFirstTag: true,
      operationTitleSource: 'summary' as const,
      showDeveloperTools: 'never' as const,
      showToolbar: 'never' as const,
    }),
    [],
  );

  return <ApiReferenceReact configuration={configuration} />;
}
