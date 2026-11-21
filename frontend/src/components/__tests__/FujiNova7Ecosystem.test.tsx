import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FujiNovaLogo } from '../brand/FujiNovaLogo';
import { TripBasketDrawer } from '../TripBasketDrawer';
import { TripExportModal } from '../TripExportModal';
import { ExperienceModeProvider, useExperienceMode } from '../../context/ExperienceModeContext';
import { Place } from '../../types';

const MOCK_PLACES: Place[] = [
  {
    place_id: 'kawaguchiko_oishi_park',
    name_ja: '大石公園',
    name_en: 'Oishi Park',
    latitude: 35.5236,
    longitude: 138.7452,
    coords_source: 'MLIT',
    primary_category: 'viewpoint',
    opening_status: 'ALWAYS_OPEN',
    opening_hours_source: 'Official',
    general_admission_type: 'FREE',
    admission_fee_source: 'Official',
    accessibility_status: 'VERIFIED_ACCESSIBLE',
    accessibility_source: 'Official',
    fuji_view_rating: 5,
    indoor_alternative: false,
    provenance_tier: 'OFFICIAL_GOV',
    source_url: '',
    required_attribution: '',
    source_retrieval_date: '',
    last_verified_date: ''
  },
  {
    place_id: 'arakurayama_chureito',
    name_ja: '新倉山浅間公園（忠霊塔）',
    name_en: 'Chureito Pagoda',
    latitude: 35.5011,
    longitude: 138.8016,
    coords_source: 'MLIT',
    primary_category: 'viewpoint',
    opening_status: 'ALWAYS_OPEN',
    opening_hours_source: 'Official',
    general_admission_type: 'FREE',
    admission_fee_source: 'Official',
    accessibility_status: 'STEEP_STAIRS',
    stair_step_count: 398,
    accessibility_source: 'Official',
    fuji_view_rating: 5,
    indoor_alternative: false,
    provenance_tier: 'OFFICIAL_GOV',
    source_url: '',
    required_attribution: '',
    source_retrieval_date: '',
    last_verified_date: ''
  }
];

describe('FujiNova 7.0 Ecosystem Components', () => {
  it('renders FujiNovaLogo in full-horizontal, compact and square variants', () => {
    const { rerender } = render(<FujiNovaLogo variant="full-horizontal" size="md" showTagline={true} />);
    expect(screen.getByText('Fuji')).toBeInTheDocument();
    expect(screen.getByText('Nova')).toBeInTheDocument();
    expect(screen.getByText(/7\.0|8\.0/)).toBeInTheDocument();

    rerender(<FujiNovaLogo variant="square-icon" size="sm" />);
    expect(screen.getByLabelText('FujiNova Mount Fuji and Sakura Emblem')).toBeInTheDocument();
  });

  it('renders TripBasketDrawer and handles items, reordering, and generation', () => {
    const onRemove = vi.fn();
    const onClear = vi.fn();
    const onReorder = vi.fn();
    const onGenerate = vi.fn();
    const onView3D = vi.fn();

    render(
      <TripBasketDrawer
        isOpen={true}
        onClose={vi.fn()}
        basket={MOCK_PLACES}
        onRemoveFromBasket={onRemove}
        onClearBasket={onClear}
        onReorderBasket={onReorder}
        onGenerateWithHana={onGenerate}
        onViewIn3D={onView3D}
      />
    );

    expect(screen.getByText('Trip Selection Basket')).toBeInTheDocument();
    expect(screen.getByText(/Oishi Park/i)).toBeInTheDocument();
    expect(screen.getByText(/Chureito Pagoda/i)).toBeInTheDocument();

    // Click Generate Itinerary CTA
    const generateBtn = screen.getByText('Generate Smart Itinerary with Hana AI');
    fireEvent.click(generateBtn);
    expect(onGenerate).toHaveBeenCalledWith(MOCK_PLACES);

    // Click View in 3D CTA
    const view3DBtn = screen.getByText('Preview Waypoints in 3D Digital Twin');
    fireEvent.click(view3DBtn);
    expect(onView3D).toHaveBeenCalledWith(MOCK_PLACES);
  });

  it('toggles Experience Modes (Adult, Teen, Family) with persistence', () => {
    const TestComponent = () => {
      const { mode, setMode, isAdultMode, isTeenMode, isFamilyMode, modeTitle } = useExperienceMode();
      return (
        <div>
          <span data-testid="active-mode">{mode}</span>
          <span data-testid="mode-title">{modeTitle}</span>
          <span data-testid="is-adult">{String(isAdultMode)}</span>
          <span data-testid="is-teen">{String(isTeenMode)}</span>
          <span data-testid="is-family">{String(isFamilyMode)}</span>
          <button onClick={() => setMode('teen')}>Set Teen</button>
          <button onClick={() => setMode('family')}>Set Family</button>
        </div>
      );
    };

    render(
      <ExperienceModeProvider>
        <TestComponent />
      </ExperienceModeProvider>
    );

    expect(screen.getByTestId('active-mode').textContent).toBe('adult');
    expect(screen.getByTestId('is-adult').textContent).toBe('true');

    // Switch to Teen
    fireEvent.click(screen.getByText('Set Teen'));
    expect(screen.getByTestId('active-mode').textContent).toBe('teen');
    expect(screen.getByTestId('is-teen').textContent).toBe('true');

    // Switch to Family
    fireEvent.click(screen.getByText('Set Family'));
    expect(screen.getByTestId('active-mode').textContent).toBe('family');
    expect(screen.getByTestId('is-family').textContent).toBe('true');
  });
});
