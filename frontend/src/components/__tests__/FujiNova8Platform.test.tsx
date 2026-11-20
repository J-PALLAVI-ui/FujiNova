import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownMessage } from '../MarkdownMessage';
import { InteractiveSakuraBackground } from '../InteractiveSakuraBackground';
import { GlobalLanguageSelector } from '../GlobalLanguageSelector';
import { LanguageProvider, useTranslation } from '../../i18n/LanguageContext';
import { TRANSLATIONS } from '../../i18n/translations';

describe('FujiNova 8.0 Platform & Feature Suite', () => {
  describe('Hana AI Markdown Parser (MarkdownMessage)', () => {
    it('correctly renders headings, bold text without raw asterisks, and bullet points', () => {
      const sampleMarkdown = `### Highlights
**Mount Fuji** is sacred.
- Visit Lake Kawaguchiko
- Try local Hoto noodles`;

      const { container } = render(<MarkdownMessage content={sampleMarkdown} isHana={true} />);

      // Verify h3 rendered
      expect(screen.getByText('Highlights')).toBeInTheDocument();
      // Verify bold rendered as strong tag, with NO raw **
      const strongEl = screen.getByText('Mount Fuji');
      expect(strongEl.tagName).toBe('STRONG');
      expect(container.innerHTML).not.toContain('**Mount Fuji**');
      // Verify list items rendered
      expect(screen.getByText('Visit Lake Kawaguchiko')).toBeInTheDocument();
      expect(screen.getByText('Try local Hoto noodles')).toBeInTheDocument();
    });

    it('renders syntax-styled code block with copy button', () => {
      const codeSnippet = '```python\ndef plan_route():\n    return "Fuji"\n```';
      render(<MarkdownMessage content={codeSnippet} isHana={true} />);

      expect(screen.getByText(/python/i)).toBeInTheDocument();
      expect(screen.getByText(/def plan_route/)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /copy/i }).length).toBeGreaterThanOrEqual(1);
    });

    it('renders formatted markdown tables with headers and rows', () => {
      const tableMarkdown = `| Stop | Distance |
|---|---|
| Oishi Park | 5.2 km |
| Chureito Pagoda | 8.1 km |`;

      const { container } = render(<MarkdownMessage content={tableMarkdown} isHana={true} />);
      const table = container.querySelector('table');
      expect(table).not.toBeNull();
      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.getByText('Oishi Park')).toBeInTheDocument();
      expect(screen.getByText('5.2 km')).toBeInTheDocument();
    });
  });

  describe('Interactive Sakura Background System', () => {
    it('renders canvas element and Mount Fuji silhouette backdrop', () => {
      const { container } = render(<InteractiveSakuraBackground activeTab="discover" />);
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('minimizes backdrop and pauses petals when in 3D digital twin mode', () => {
      const { container } = render(<InteractiveSakuraBackground activeTab="twin" />);
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      // SVG backdrop is hidden in 3D mode to maximize 3D WebGL visibility
      const svg = container.querySelector('svg');
      expect(svg).toBeNull();
    });
  });

  describe('Global Multilingual System & Language Selector', () => {
    const TestConsumer = () => {
      const { t } = useTranslation();
      return (
        <div>
          <span data-testid="nav-discover">{t('nav_discover')}</span>
          <span data-testid="twin-explore">{t('twin_explore_journey')}</span>
          <GlobalLanguageSelector />
        </div>
      );
    };

    it('defaults to English and allows switching to Japanese, updating translations', () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      // Default English
      expect(screen.getByTestId('nav-discover')).toHaveTextContent('Discover');
      expect(screen.getByTestId('twin-explore')).toHaveTextContent('Explore My Journey in 3D');

      // Open language selector
      const button = screen.getByRole('button', { name: /select language/i });
      fireEvent.click(button);

      // Select Japanese
      const jaOption = screen.getByRole('option', { name: /日本語/i });
      fireEvent.click(jaOption);

      // Check that translations updated across the interface
      expect(screen.getByTestId('nav-discover')).toHaveTextContent('発見・名所');
      expect(screen.getByTestId('twin-explore')).toHaveTextContent('3Dで旅程ルートを巡る');
    });

    it('supports all 6 languages in the translation catalog', () => {
      const requiredCodes = ['en', 'ja', 'hi', 'ta', 'kn', 'te'] as const;
      requiredCodes.forEach(code => {
        expect(TRANSLATIONS[code]).toBeDefined();
        expect(TRANSLATIONS[code].nav_discover).toBeTruthy();
        expect(TRANSLATIONS[code].nav_hana).toBeTruthy();
        expect(TRANSLATIONS[code].nav_twin).toBeTruthy();
        expect(TRANSLATIONS[code].twin_explore_journey).toBeTruthy();
      });
    });
  });
});
