import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LanguageProvider, useTranslation } from '../../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../i18n/translations';
import { LiveWeatherVisibilityMonitor } from '../LiveWeatherVisibilityMonitor';
import { NaturalHazardBanner } from '../NaturalHazardBanner';
import { WikimediaGalleryModal } from '../WikimediaGalleryModal';
import { ProviderStatusPanel } from '../ProviderStatusPanel';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FujiNova 10.0 Live Intelligence & Global Language Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Global 20-Language Localization & RTL Handling', () => {
    it('supports all 20 specified world languages with native labels', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(20);
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      // European
      expect(codes).toContain('en');
      expect(codes).toContain('es');
      expect(codes).toContain('de');
      expect(codes).toContain('fr');
      expect(codes).toContain('it');
      expect(codes).toContain('pt');
      expect(codes).toContain('ru');
      expect(codes).toContain('nl');
      // Asian
      expect(codes).toContain('ja');
      expect(codes).toContain('zh');
      expect(codes).toContain('ko');
      expect(codes).toContain('th');
      expect(codes).toContain('vi');
      expect(codes).toContain('id');
      // Middle Eastern
      expect(codes).toContain('ar');
      expect(codes).toContain('he');
      // Indian
      expect(codes).toContain('hi');
      expect(codes).toContain('ta');
      expect(codes).toContain('kn');
      expect(codes).toContain('te');
    });

    it('sets RTL direction for Arabic and Hebrew and LTR for English/Japanese', () => {
      const TestLangComponent = () => {
        const { language, setLanguage } = useTranslation();
        return (
          <div>
            <span data-testid="cur-lang">{language}</span>
            <button onClick={() => setLanguage('ar')}>Set Arabic</button>
            <button onClick={() => setLanguage('he')}>Set Hebrew</button>
            <button onClick={() => setLanguage('ja')}>Set Japanese</button>
            <button onClick={() => setLanguage('en')}>Set English</button>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <TestLangComponent />
        </LanguageProvider>
      );

      // Switch to Arabic
      fireEvent.click(screen.getByText('Set Arabic'));
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');

      // Switch to Hebrew
      fireEvent.click(screen.getByText('Set Hebrew'));
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('he');

      // Switch to Japanese
      fireEvent.click(screen.getByText('Set Japanese'));
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('ja');

      // Switch to English
      fireEvent.click(screen.getByText('Set English'));
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('LiveWeatherVisibilityMonitor Component', () => {
    it('fetches and displays elevation-stratified weather snapshots and visibility probability', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          snapshots: [
            {
              station_id: 'fuji_summit',
              station_name: 'Mount Fuji Summit (3,776m)',
              elevation_m: 3776,
              latitude: 35.3606,
              longitude: 138.7274,
              temperature_c: -6.4,
              relative_humidity_pct: 48,
              wind_speed_kmh: 38.5,
              cloud_cover_pct: 12,
              visibility_km: 40.0,
              wmo_weather_code: 0,
              wmo_description: 'Clear sky',
              fuji_visibility_score: 92.5,
              captured_at: '2026-11-21T07:00:00Z'
            },
            {
              station_id: 'kawaguchiko_lake',
              station_name: 'Lake Kawaguchiko Lakeside (830m)',
              elevation_m: 830,
              latitude: 35.518,
              longitude: 138.756,
              temperature_c: 12.2,
              relative_humidity_pct: 55,
              wind_speed_kmh: 8.0,
              cloud_cover_pct: 20,
              visibility_km: 25.0,
              wmo_weather_code: 1,
              wmo_description: 'Mainly clear',
              fuji_visibility_score: 85.0,
              captured_at: '2026-11-21T07:00:00Z'
            }
          ]
        })
      });

      render(
        <LanguageProvider>
          <LiveWeatherVisibilityMonitor />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Mount Fuji Summit (3,776m)')).toBeInTheDocument();
        expect(screen.getByText('-6.4°C')).toBeInTheDocument();
        expect(screen.getByText('Lake Kawaguchiko Lakeside (830m)')).toBeInTheDocument();
        expect(screen.getByText('+12.2°C')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
      });
    });
  });

  describe('NaturalHazardBanner Component', () => {
    it('renders JMA Volcanic Alert Level 1 and mountain safety bulletins', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alerts: [
            {
              alert_id: 'jma_fuji_volcano_01',
              alert_type: 'VOLCANIC',
              severity: 'NORMAL',
              title_en: 'Mt. Fuji Volcanic Alert: Level 1 (Normal / 常時観察)',
              title_ja: '富士山 噴火警戒レベル1（活火山であることに留意）',
              description_en: 'Volcano is calm and at normal baseline. Normal tourist access permitted around Five Lakes.',
              description_ja: '現在のところ噴火の兆候は認められません。',
              issuer: 'JMA',
              effective_time: '2026-11-21T00:00:00Z',
              is_active: true
            }
          ]
        })
      });

      render(
        <LanguageProvider>
          <NaturalHazardBanner />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/JMA Official Safety Alert/i)).toBeInTheDocument();
        expect(screen.getByText('NORMAL')).toBeInTheDocument();
        expect(
          screen.getByText('Mt. Fuji Volcanic Alert: Level 1 (Normal / 常時観察)')
        ).toBeInTheDocument();
      });
    });
  });

  describe('WikimediaGalleryModal Component', () => {
    it('renders verified Wikimedia Commons photos with photographer attribution and license', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          place_id: 'kawaguchiko_oishi_park',
          photos: [
            {
              id: 1,
              place_id: 'kawaguchiko_oishi_park',
              commons_page_url: 'https://commons.wikimedia.org/wiki/File:Oishi_Park_Lavender_Fuji.jpg',
              image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Oishi_Park_Lavender_Fuji.jpg',
              thumb_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Oishi_Park_Lavender_Fuji.jpg/320px-Oishi_Park_Lavender_Fuji.jpg',
              title: 'Mount Fuji and Lavender field at Oishi Park',
              author: 'Kentaro Ohno',
              license_short: 'CC BY 2.0',
              description: 'Iconic panoramic view of Mount Fuji framed by lavender flowers at Oishi Park promenade.'
            }
          ]
        })
      });

      const handleClose = vi.fn();

      render(
        <LanguageProvider>
          <WikimediaGalleryModal
            isOpen={true}
            placeId="kawaguchiko_oishi_park"
            placeName="Oishi Park"
            onClose={handleClose}
          />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Mount Fuji and Lavender field at Oishi Park').length).toBeGreaterThan(0);
        expect(screen.getByText('Kentaro Ohno')).toBeInTheDocument();
        expect(screen.getByText('CC BY 2.0')).toBeInTheDocument();
        expect(screen.getByText('Wikimedia Page')).toBeInTheDocument();
      });
    });
  });

  describe('ProviderStatusPanel Component', () => {
    it('renders connectivity and latency for all 5 verified zero-cost providers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'HEALTHY',
          providers: [
            {
              provider_name: 'OPEN_METEO',
              status: 'HEALTHY',
              latency_ms: 115,
              last_sync: '2026-11-21T07:05:00Z',
              records_cached: 6,
              message: 'Open-Meteo elevation telemetry synced successfully.'
            },
            {
              provider_name: 'JMA_HAZARDS',
              status: 'HEALTHY',
              latency_ms: 85,
              last_sync: '2026-11-21T07:05:00Z',
              records_cached: 3,
              message: 'JMA volcanic and weather bulletins operational.'
            },
            {
              provider_name: 'WIKIMEDIA_COMMONS',
              status: 'HEALTHY',
              latency_ms: 140,
              last_sync: '2026-11-21T07:05:00Z',
              records_cached: 42,
              message: 'Verified Wikimedia Commons photo database operational.'
            },
            {
              provider_name: 'FUJIKYU_GTFS_JP',
              status: 'HEALTHY',
              latency_ms: 10,
              last_sync: '2026-11-21T07:05:00Z',
              records_cached: 1450,
              message: 'Static GTFS-JP bus and railway schedules active in SQLite cache.'
            },
            {
              provider_name: 'CROWDSENSE_2_ENGINE',
              status: 'HEALTHY',
              latency_ms: 5,
              last_sync: '2026-11-21T07:05:00Z',
              records_cached: 36,
              message: 'Multi-evidence crowd engine operational.'
            }
          ]
        })
      });

      render(
        <LanguageProvider>
          <ProviderStatusPanel />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('OPEN METEO')).toBeInTheDocument();
        expect(screen.getByText('JMA HAZARDS')).toBeInTheDocument();
        expect(screen.getByText('WIKIMEDIA COMMONS')).toBeInTheDocument();
        expect(screen.getByText('FUJIKYU GTFS JP')).toBeInTheDocument();
        expect(screen.getByText('CROWDSENSE 2 ENGINE')).toBeInTheDocument();
        expect(screen.getAllByText('HEALTHY')).toHaveLength(5);
      });
    });
  });
});
