import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { AppNavigationSections, AppNavigationSectionsProps } from './AppNavigationSections';
import { Screen } from '@shared/types';
import { renderWithProviders } from '../../../test/helpers/renderWithProviders';

describe('AppNavigationSections', () => {
  const defaultProps: AppNavigationSectionsProps = {
    variant: 'sidebar',
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

  it('renders all 4 main navigation groups and footer metadata in sidebar variant', () => {
    renderWithProviders(<AppNavigationSections {...defaultProps} />);

    // Group 1: Workspace
    expect(screen.getByRole('navigation', { name: /Workspace navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Dashboard/i })).toBeInTheDocument();

    // Group 3: Reference & Support
    expect(screen.getByRole('navigation', { name: /Reference and support navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^About/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^FAQ/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Drug Reference/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Contact/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Resources/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Changelog/i })).toBeInTheDocument();

    // Group 4: Workspace Actions
    expect(screen.getByRole('button', { name: /^Upload CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Get Started/i })).toBeInTheDocument();

    // Group 5: Footer Metadata
    expect(screen.getByText('RPAH Anaesthetic Allergy')).toBeInTheDocument();
    expect(screen.getByText('Demo')).toBeInTheDocument();
  });

  it('renders custom database date in footer metadata when isCustomData=true', () => {
    renderWithProviders(<AppNavigationSections {...defaultProps} isCustomData={true} databaseDate="2026-09-01" />);

    expect(screen.getByText('2026-09-01')).toBeInTheDocument();
  });

  it('renders active primary item with aria-current="page", subtle contrast, border-masthead-accent, and WITHOUT bg-primary in sidebar', () => {
    renderWithProviders(<AppNavigationSections {...defaultProps} currentScreen={Screen.LOG} variant="sidebar" />);

    const homeLink = screen.getByRole('link', { name: /^Home/i });
    const dashboardLink = screen.getByRole('link', { name: /^Dashboard/i });

    expect(homeLink).toHaveAttribute('aria-current', 'page');
    expect(homeLink).toHaveClass('border-masthead-accent', 'bg-white/10', 'text-white', 'font-semibold');
    expect(homeLink).not.toHaveClass('bg-primary');

    expect(dashboardLink).not.toHaveAttribute('aria-current');
    expect(dashboardLink).toHaveClass('border-transparent');
    expect(dashboardLink).not.toHaveClass('bg-primary');
  });

  it('renders active item with bg-accent, border-primary, and WITHOUT solid bg-primary in drawer variant', () => {
    renderWithProviders(<AppNavigationSections {...defaultProps} currentScreen={Screen.DASHBOARD} variant="drawer" />);

    const dashboardLink = screen.getByRole('link', { name: /^Dashboard/i });
    const homeLink = screen.getByRole('link', { name: /^Home/i });

    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    expect(dashboardLink).toHaveClass('bg-accent', 'text-accent-foreground', 'border-primary', 'font-semibold');
    expect(dashboardLink).not.toHaveClass('bg-primary');

    expect(homeLink).not.toHaveAttribute('aria-current');
    expect(homeLink).not.toHaveClass('bg-primary');
  });

  it('ensures sidebar links and action buttons have min-h-[38px], delete button has min-h-[44px], rounded-none, and visible focus rings', () => {
    renderWithProviders(
      <AppNavigationSections
        {...defaultProps}
        hasActiveReport={true}
        isTestingDraftDirty={true}
        onDeleteTestingDraft={vi.fn()}
      />
    );

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link).toHaveClass('min-h-[38px]');
      expect(link).toHaveClass('rounded-none');
      expect(link).toHaveClass('focus-visible:ring-2');
      expect(link).toHaveClass('focus-visible:outline-none');
    });

    const uploadBtn = screen.getByRole('button', { name: /^Upload CSV/i });
    const getStartedBtn = screen.getByRole('button', { name: /^Get Started/i });
    const deleteBtn = screen.getByRole('button', { name: /Delete testing draft/i });

    [uploadBtn, getStartedBtn].forEach((button) => {
      expect(button).toHaveClass('min-h-[38px]');
      expect(button).toHaveClass('rounded-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:outline-none');
    });

    expect(deleteBtn).toHaveClass('min-h-[44px]', 'min-w-[44px]', 'rounded-none', 'focus-visible:ring-2', 'focus-visible:outline-none');
  });

  it('ensures every link and button in drawer variant has min-h-[44px], rounded-none, and visible focus rings', () => {
    renderWithProviders(
      <AppNavigationSections
        {...defaultProps}
        variant="drawer"
        hasActiveReport={true}
        isTestingDraftDirty={true}
        onDeleteTestingDraft={vi.fn()}
      />
    );

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link).toHaveClass('min-h-[44px]');
      expect(link).toHaveClass('rounded-none');
      expect(link).toHaveClass('focus-visible:ring-2');
      expect(link).toHaveClass('focus-visible:outline-none');
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => {
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('rounded-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:outline-none');
    });
  });

  it('ensures nav link label text uses break-words and does not truncate', () => {
    const { container } = renderWithProviders(
      <AppNavigationSections
        {...defaultProps}
        hasActiveReport={true}
        isTestingDraftDirty={true}
      />
    );

    const breakWordLabels = container.querySelectorAll('nav span.break-words');
    expect(breakWordLabels.length).toBeGreaterThan(0);

    const truncatedLabels = container.querySelectorAll('nav .truncate');
    expect(truncatedLabels.length).toBe(0);
  });

  describe('Contextual items matrix across hasActiveReport x isTestingDraftDirty combinations', () => {
    it('Case 1: hasActiveReport=false, isTestingDraftDirty=false -> 0 contextual items', () => {
      renderWithProviders(
        <AppNavigationSections
          {...defaultProps}
          currentScreen={Screen.LOG}
          hasActiveReport={false}
          isTestingDraftDirty={false}
        />
      );

      expect(screen.queryByRole('navigation', { name: /Current work navigation/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^Reports/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^Testing Session/i })).not.toBeInTheDocument();
    });

    it('Case 2: hasActiveReport=true, isTestingDraftDirty=false -> Reports with Active badge', () => {
      renderWithProviders(
        <AppNavigationSections
          {...defaultProps}
          currentScreen={Screen.LOG}
          hasActiveReport={true}
          isTestingDraftDirty={false}
        />
      );

      const contextualNav = screen.getByRole('navigation', { name: /Current work navigation/i });
      expect(contextualNav).toBeInTheDocument();

      const reportsLink = within(contextualNav).getByRole('link', { name: /^Reports/i });
      expect(reportsLink).toBeInTheDocument();
      expect(reportsLink).toHaveAttribute('href', '/summary');
      expect(within(reportsLink).getByText('Active')).toBeInTheDocument();

      expect(within(contextualNav).queryByRole('link', { name: /^Testing Session/i })).not.toBeInTheDocument();
    });

    it('Case 3: hasActiveReport=false, isTestingDraftDirty=true -> Testing Session with Draft badge', () => {
      renderWithProviders(
        <AppNavigationSections
          {...defaultProps}
          currentScreen={Screen.LOG}
          hasActiveReport={false}
          isTestingDraftDirty={true}
        />
      );

      const contextualNav = screen.getByRole('navigation', { name: /Current work navigation/i });
      expect(contextualNav).toBeInTheDocument();

      const testingLink = within(contextualNav).getByRole('link', { name: /^Testing Session/i });
      expect(testingLink).toBeInTheDocument();
      expect(testingLink).toHaveAttribute('href', '/testing');
      expect(within(testingLink).getByText('Draft')).toBeInTheDocument();

      expect(within(contextualNav).queryByRole('link', { name: /^Reports/i })).not.toBeInTheDocument();
    });

    it('Case 4: hasActiveReport=true, isTestingDraftDirty=true -> Both Reports and Testing Session with badges', () => {
      renderWithProviders(
        <AppNavigationSections
          {...defaultProps}
          currentScreen={Screen.LOG}
          hasActiveReport={true}
          isTestingDraftDirty={true}
        />
      );

      const contextualNav = screen.getByRole('navigation', { name: /Current work navigation/i });
      expect(contextualNav).toBeInTheDocument();

      const reportsLink = within(contextualNav).getByRole('link', { name: /^Reports/i });
      expect(reportsLink).toBeInTheDocument();
      expect(within(reportsLink).getByText('Active')).toBeInTheDocument();

      const testingLink = within(contextualNav).getByRole('link', { name: /^Testing Session/i });
      expect(testingLink).toBeInTheDocument();
      expect(within(testingLink).getByText('Draft')).toBeInTheDocument();
    });

    it('Case 5: currentScreen=TESTING without dirty draft -> Testing Session appears without Draft badge', () => {
      renderWithProviders(
        <AppNavigationSections
          {...defaultProps}
          currentScreen={Screen.TESTING}
          hasActiveReport={false}
          isTestingDraftDirty={false}
        />
      );

      const contextualNav = screen.getByRole('navigation', { name: /Current work navigation/i });
      expect(contextualNav).toBeInTheDocument();

      const testingLink = within(contextualNav).getByRole('link', { name: /^Testing Session/i });
      expect(testingLink).toHaveAttribute('aria-current', 'page');
      expect(within(testingLink).queryByText('Draft')).not.toBeInTheDocument();
    });
  });

  describe('Click and action interactions', () => {
    it('calls onNavigate and onItemClick on normal link click', () => {
      const onNavigate = vi.fn();
      const onItemClick = vi.fn();

      renderWithProviders(
        <AppNavigationSections
          {...defaultProps}
          onNavigate={onNavigate}
          onItemClick={onItemClick}
        />
      );

      const dashboardLink = screen.getByRole('link', { name: /^Dashboard/i });
      fireEvent.click(dashboardLink);

      expect(onItemClick).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith(Screen.DASHBOARD);
    });

    it('preserves modified clicks without calling onNavigate', () => {
      const onNavigate = vi.fn();
      const onItemClick = vi.fn();

      renderWithProviders(
        <AppNavigationSections
          {...defaultProps}
          onNavigate={onNavigate}
          onItemClick={onItemClick}
        />
      );

      const dashboardLink = screen.getByRole('link', { name: /^Dashboard/i });
      fireEvent.click(dashboardLink, { metaKey: true });
      fireEvent.click(dashboardLink, { ctrlKey: true });
      fireEvent.click(dashboardLink, { shiftKey: true });
      fireEvent.click(dashboardLink, { altKey: true });
      fireEvent.click(dashboardLink, { button: 1 });

      expect(onNavigate).not.toHaveBeenCalled();
      expect(onItemClick).not.toHaveBeenCalled();
    });

    it('calls action callbacks and onItemClick on action button click', () => {
      const onOpenUploadCSV = vi.fn();
      const onOpenGetStarted = vi.fn();
      const onItemClick = vi.fn();

      renderWithProviders(
        <AppNavigationSections
          {...defaultProps}
          onOpenUploadCSV={onOpenUploadCSV}
          onOpenGetStarted={onOpenGetStarted}
          onItemClick={onItemClick}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^Upload CSV/i }));
      expect(onItemClick).toHaveBeenCalledTimes(1);
      expect(onOpenUploadCSV).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /^Get Started/i }));
      expect(onItemClick).toHaveBeenCalledTimes(2);
      expect(onOpenGetStarted).toHaveBeenCalledTimes(1);
    });
  });
});
