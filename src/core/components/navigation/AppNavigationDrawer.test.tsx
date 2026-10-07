import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { AppNavigationDrawer, AppNavigationDrawerProps } from './AppNavigationDrawer';
import { Screen } from '@shared/types';
import { renderWithProviders } from '../../../test/helpers/renderWithProviders';

describe('AppNavigationDrawer', () => {
  const defaultProps: AppNavigationDrawerProps = {
    isOpen: false,
    onOpenChange: vi.fn(),
    currentScreen: Screen.LOG,
    onNavigate: vi.fn(),
    hrefFor: (screen: Screen) => (screen === Screen.LOG ? '/' : `/${screen}`),
    isTestingDraftDirty: false,
    hasActiveReport: false,
    onOpenUploadCSV: vi.fn(),
    onOpenGetStarted: vi.fn(),
    databaseDate: '2026-08-15',
    isCustomData: false,
  };

  it('renders trigger menu button with accessible aria attributes and Menu label', () => {
    renderWithProviders(<AppNavigationDrawer {...defaultProps} />);

    const triggerBtn = screen.getByRole('button', { name: /Open navigation menu/i });
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false');
    expect(triggerBtn).toHaveAttribute('aria-controls', 'app-navigation-drawer');
    expect(triggerBtn).toHaveClass('min-h-[44px]', 'rounded-none');
    expect(triggerBtn).toHaveTextContent('Menu');
  });

  it('opens drawer dialog with accessible attributes and navigation sections when isOpen=true', () => {
    renderWithProviders(<AppNavigationDrawer {...defaultProps} isOpen={true} />);

    const dialog = screen.getByRole('dialog', { name: 'Navigation Drawer' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveClass('max-w-[360px]', 'no-print');

    // Header brand
    expect(within(dialog).getByText('DREAM')).toBeInTheDocument();
    expect(within(dialog).getByText('Navigation Menu')).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Close navigation menu/i });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveClass('min-h-[44px]');

    // Navigation links
    expect(screen.getByRole('link', { name: /^Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Dashboard/i })).toBeInTheDocument();

    // Verify duplicated theme toggle is NOT in the drawer
    expect(screen.queryByText(/Light Theme/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dark Theme/i)).not.toBeInTheDocument();
  });

  it('closes drawer when Escape key is pressed', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AppNavigationDrawer {...defaultProps} isOpen={true} onOpenChange={onOpenChange} />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes drawer when backdrop is clicked', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AppNavigationDrawer {...defaultProps} isOpen={true} onOpenChange={onOpenChange} />
    );

    const backdrop = document.querySelector('.bg-black\\/60');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes drawer when close button is clicked', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AppNavigationDrawer {...defaultProps} isOpen={true} onOpenChange={onOpenChange} />
    );

    const closeBtn = screen.getByRole('button', { name: /Close navigation menu/i });
    fireEvent.click(closeBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('navigates and closes drawer when a link is clicked', () => {
    const onOpenChange = vi.fn();
    const onNavigate = vi.fn();

    renderWithProviders(
      <AppNavigationDrawer
        {...defaultProps}
        isOpen={true}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
      />
    );

    const dashboardLink = screen.getByRole('link', { name: /^Dashboard/i });
    fireEvent.click(dashboardLink);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onNavigate).toHaveBeenCalledWith(Screen.DASHBOARD);
  });

  it('triggers action and closes drawer when action button is clicked', () => {
    const onOpenChange = vi.fn();
    const onOpenUploadCSV = vi.fn();

    renderWithProviders(
      <AppNavigationDrawer
        {...defaultProps}
        isOpen={true}
        onOpenChange={onOpenChange}
        onOpenUploadCSV={onOpenUploadCSV}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /^Upload CSV/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onOpenUploadCSV).toHaveBeenCalledTimes(1);
  });

  it('ensures all interactive elements meet 44px touch target requirement', () => {
    renderWithProviders(
      <AppNavigationDrawer
        {...defaultProps}
        isOpen={true}
        hasActiveReport={true}
        isTestingDraftDirty={true}
      />
    );

    const links = screen.getAllByRole('link');
    const buttons = screen.getAllByRole('button');

    [...links, ...buttons].forEach((el) => {
      expect(el).toHaveClass('min-h-[44px]');
      expect(el).toHaveClass('rounded-none');
    });
  });
});
