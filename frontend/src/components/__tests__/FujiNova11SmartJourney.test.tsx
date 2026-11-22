import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartJourneyBanner } from '../HanaSmartJourney/SmartJourneyBanner';
import { SmartJourneyFooter } from '../HanaSmartJourney/SmartJourneyFooter';
import { Step1LocationAndCategories } from '../HanaSmartJourney/Step1LocationAndCategories';
import { Step2CrowdAndChoices } from '../HanaSmartJourney/Step2CrowdAndChoices';
import { Step3StationGuide } from '../HanaSmartJourney/Step3StationGuide';
import { Step4DetailedJourney } from '../HanaSmartJourney/Step4DetailedJourney';
import { HanaSmartJourneyView } from '../HanaSmartJourney/HanaSmartJourneyView';

describe('FujiNova 11.0: Hana Smart Journey Component Suite', () => {
  it('renders SmartJourneyBanner with FujiNova 11.0 branding and the 5 pill badges', () => {
    render(<SmartJourneyBanner />);
    expect(screen.getByText('FujiNova 11.0')).toBeDefined();
    expect(screen.getByText('Hana Smart Journey')).toBeDefined();
    expect(screen.getByText(/Live Crowd/)).toBeDefined();
    expect(screen.getByText(/Train & Bus Navigation/)).toBeDefined();
    expect(screen.getByText(/Route & Map Planning/)).toBeDefined();
    expect(screen.getByText(/Quieter Alternatives/)).toBeDefined();
    expect(screen.getByText(/All Languages/)).toBeDefined();
  });

  it('renders Step 1 Location & Exploration Categories with GPS and manual search', () => {
    const handleSelectOrigin = vi.fn();
    const handleSelectCategory = vi.fn();
    const handleOpenManualSearch = vi.fn();

    render(
      <Step1LocationAndCategories
        onSelectOrigin={handleSelectOrigin}
        onSelectCategory={handleSelectCategory}
        onOpenManualSearch={handleOpenManualSearch}
        selectedOriginName="Kawaguchiko Station"
      />
    );

    // Hero & greeting
    expect(screen.getByText(/Where are you starting your journey/)).toBeDefined();
    expect(screen.getByText(/Use My Current Location/)).toBeDefined();
    expect(screen.getByText(/Select My Location Manually/)).toBeDefined();

    // 8 Categories
    expect(screen.getByText('Places to Visit')).toBeDefined();
    expect(screen.getByText('Railway Stations')).toBeDefined();
    expect(screen.getByText('Bus Stops & Routes')).toBeDefined();
    expect(screen.getByText('Hotels & Stays')).toBeDefined();
    expect(screen.getByText('Food & Cafés')).toBeDefined();
    expect(screen.getByText('Entertainment & Activities')).toBeDefined();
    expect(screen.getByText('Essential Services')).toBeDefined();
    expect(screen.getByText('Airports & Connections')).toBeDefined();

    // Step 1 label
    expect(screen.getByText('Choose Your Starting Point')).toBeDefined();

    // Trigger manual search click
    fireEvent.click(screen.getByText(/Select My Location Manually/));
    expect(handleOpenManualSearch).toHaveBeenCalled();
  });

  it('renders Step 2 Crowd & Choices with semi-circular gauge and 4 Hana choices', () => {
    const handleSelectChoice = vi.fn();
    const handleProceed = vi.fn();

    render(
      <Step2CrowdAndChoices
        destinationName="Chureito Pagoda"
        destinationLocation="Arakurayama Sengen Park · Fujiyoshida, Yamanashi"
        crowdLevel="High"
        crowdScore={78}
        confidencePct={78}
        onSelectChoice={handleSelectChoice}
        onProceedToTransport={handleProceed}
      />
    );

    // Header & photo title
    expect(screen.getAllByText('Chureito Pagoda').length).toBeGreaterThan(0);
    expect(screen.getByText('Crowd Information')).toBeDefined();
    expect(screen.getByText('High')).toBeDefined();
    expect(screen.getByText(/Estimated \(based on busyness, trends & sensors\)/)).toBeDefined();

    // The 4 Hana options
    expect(screen.getByText('Yes, show me quieter places')).toBeDefined();
    expect(screen.getByText('Show me another famous attraction')).toBeDefined();
    expect(screen.getByText('Show hidden gems')).toBeDefined();
    expect(screen.getByText(/I still want to visit Chureito/)).toBeDefined();

    // Step 2 label
    expect(screen.getByText('Check Crowd & Choose')).toBeDefined();

    // Select "Keep destination"
    fireEvent.click(screen.getByText(/I still want to visit Chureito/));
    expect(handleSelectChoice).toHaveBeenCalledWith('keep_destination');
    expect(handleProceed).toHaveBeenCalled();
  });

  it('renders Step 3 Station Guide with departure board, verified platforms, and fares', () => {
    const handleProceed = vi.fn();

    render(
      <Step3StationGuide
        stationName="Kawaguchiko Station"
        stationCode="FJ18"
        stationNameJa="河口湖駅"
        onProceedToJourneyPlan={handleProceed}
      />
    );

    expect(screen.getByText('Kawaguchiko Station')).toBeDefined();
    expect(screen.getByText('FJ18')).toBeDefined();
    expect(screen.getByText('河口湖駅')).toBeDefined();

    // Departures board
    expect(screen.getByText('14:28')).toBeDefined();
    expect(screen.getAllByText(/Fujisan Station/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('On Time').length).toBeGreaterThan(0);

    // Service details
    expect(screen.getByText('¥210 (Adult)')).toBeDefined();
    expect(screen.getByText('3 min (1 stop)')).toBeDefined();
    expect(screen.getByText('✓ Verified (Operator Info)')).toBeDefined();

    // Step 3 label
    expect(screen.getByText('Get Station & Transport Info')).toBeDefined();

    // Click Proceed
    fireEvent.click(screen.getByText('Follow Detailed Journey Route →'));
    expect(handleProceed).toHaveBeenCalled();
  });

  it('renders Step 4 Detailed Journey with map landmarks, summary stats, and step navigation', () => {
    render(
      <Step4DetailedJourney
        originName="Kawaguchiko Station"
        destinationName="Chureito Pagoda"
        totalTimeMin={18}
        distanceKm={4.2}
        fareJpy={210}
        transfersCount={0}
      />
    );

    // Header & summary
    expect(screen.getByText('Your Journey Plan')).toBeDefined();
    expect(screen.getByText('Kawaguchiko Station → Chureito Pagoda')).toBeDefined();
    expect(screen.getByText('18 min')).toBeDefined();
    expect(screen.getByText('~4.2 km')).toBeDefined();
    expect(screen.getByText('¥210')).toBeDefined();
    expect(screen.getByText('1 Stop')).toBeDefined();

    // Navigation steps
    expect(screen.getByText('Depart from Kawaguchiko Station')).toBeDefined();
    expect(screen.getByText('Arrive at Fujisan Station')).toBeDefined();
    expect(screen.getByText('Arrive at Chureito Pagoda (Arakurayama Sengen Park)')).toBeDefined();

    // Step 4 label
    expect(screen.getByText('Follow Your Detailed Journey')).toBeDefined();
  });

  it('renders HanaSmartJourneyView master view with all 4 steps side-by-side on desktop', () => {
    render(<HanaSmartJourneyView />);
    expect(screen.getAllByText('FujiNova 11.0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Choose Your Starting Point').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Check Crowd & Choose').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Get Station & Transport Info').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Follow Your Detailed Journey').length).toBeGreaterThan(0);
  });

  it('renders SmartJourneyFooter with Key Features at a Glance and provenance note', () => {
    render(<SmartJourneyFooter />);
    expect(screen.getByText(/Key Features at a Glance/)).toBeDefined();
    expect(screen.getByText(/Real Crowd/)).toBeDefined();
    expect(screen.getByText(/All 196 Country Languages/)).toBeDefined();
    expect(screen.getByText(/Note:/)).toBeDefined();
  });
});
