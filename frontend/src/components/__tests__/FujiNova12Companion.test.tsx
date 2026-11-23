import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayPlanTimeline } from '../DayPlanTimeline';
import { DestinationComparisonTable } from '../DestinationComparisonTable';
import { HanaDecisionAssistant } from '../HanaDecisionAssistant';
import { JourneyCompanionPanel } from '../JourneyCompanionPanel';
import { TreasureMapExplorerView } from '../TreasureMapExplorerView';
import { LiveCrowdTrafficView } from '../LiveCrowdTrafficView';
import { PlanMyTripView } from '../PlanMyTripView';

describe('FujiNova 12.0 Travel Companion Components', () => {
  it('renders DayPlanTimeline with 08:30 - 17:30 full-day schedule', () => {
    const handleStart = vi.fn();
    const handleFindQuieter = vi.fn();
    render(
      <DayPlanTimeline
        onStartJourney={handleStart}
        onFindQuieter={handleFindQuieter}
      />
    );

    expect(screen.getByText(/Your Day Plan/i)).toBeDefined();
    expect(screen.getByText(/08:30 – 17:30/i)).toBeDefined();
    expect(screen.getByText(/Start at Kawaguchiko Station/i)).toBeDefined();
    expect(screen.getAllByText(/Chureito Pagoda/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Oishi Park/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Start journey/i)).toBeDefined();

    const startBtn = screen.getByText(/Start journey/i);
    fireEvent.click(startBtn);
    expect(handleStart).toHaveBeenCalled();
  });

  it('renders DestinationComparisonTable in list and table modes', () => {
    render(<DestinationComparisonTable />);

    expect(screen.getByText(/Destination Comparison/i)).toBeDefined();
    expect(screen.getAllByText(/Chureito Pagoda/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Oishi Park/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Lake Kawaguchi/i).length).toBeGreaterThan(0);

    // Switch to Table View
    const tableViewBtn = screen.getByText(/Table View/i);
    fireEvent.click(tableViewBtn);
    expect(screen.getByText(/Crowd Status/i)).toBeDefined();
    expect(screen.getAllByText(/Traffic/i).length).toBeGreaterThan(0);
  });

  it('renders HanaDecisionAssistant with 4 interactive choices', () => {
    const handleSelect = vi.fn();
    render(
      <HanaDecisionAssistant
        destinationName="Chureito Pagoda"
        onSelectOption={handleSelect}
      />
    );

    expect(screen.getByText(/This destination appears busy right now/i)).toBeDefined();
    expect(screen.getByText(/Visit it anyway/i)).toBeDefined();
    expect(screen.getByText(/Find a quieter place/i)).toBeDefined();
    expect(screen.getByText(/Find another famous attraction/i)).toBeDefined();
    expect(screen.getByText(/Keep it for later in the day/i)).toBeDefined();

    fireEvent.click(screen.getByText(/Find a quieter place/i));
    expect(handleSelect).toHaveBeenCalledWith('quieter_place');
  });

  it('renders JourneyCompanionPanel with live micro-actions', () => {
    const handleAction = vi.fn();
    render(<JourneyCompanionPanel onAction={handleAction} />);

    expect(screen.getByText(/Next Stop: Chureito Pagoda/i)).toBeDefined();
    expect(screen.getByText(/I reached the station/i)).toBeDefined();
    expect(screen.getByText(/I boarded the bus/i)).toBeDefined();
    expect(screen.getByText(/Missed my bus/i)).toBeDefined();
    expect(screen.getByText(/Find a quieter place/i)).toBeDefined();
    expect(screen.getByText(/Mark as visited/i)).toBeDefined();

    fireEvent.click(screen.getByText(/I reached the station/i));
    expect(handleAction).toHaveBeenCalledWith('reached_station');
  });

  it('renders TreasureMapExplorerView with discovery pins and progress', () => {
    render(<TreasureMapExplorerView />);

    expect(screen.getAllByText(/Treasure Map Explorer/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Treasure Hunt Progress/i)).toBeDefined();
    expect(screen.getByText(/Discoveries Completed/i)).toBeDefined();
  });

  it('renders LiveCrowdTrafficView with live traffic status and overlays', () => {
    render(<LiveCrowdTrafficView />);

    expect(screen.getByText(/Live Crowd, Traffic & Transport Intelligence/i)).toBeDefined();
    expect(screen.getByText(/Live Data Mode/i)).toBeDefined();
    expect(screen.getByText(/Traffic \(Live\)/i)).toBeDefined();
  });

  it('renders PlanMyTripView with 3-column master planning layout', () => {
    const handleNav = vi.fn();
    render(<PlanMyTripView onNavigateToTab={handleNav} />);

    expect(screen.getAllByText(/Where are you starting your journey today\?/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Kawaguchiko Station/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Selected Destinations \(4\)/i)).toBeDefined();
    expect(screen.getByText(/Create my day plan/i)).toBeDefined();
  });
});
