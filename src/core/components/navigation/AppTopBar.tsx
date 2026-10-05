import React from 'react';
import { Screen } from '@shared/types';
import { shouldHandleNavigation } from '@core/navigation/shouldHandleNavigation';
import { DisplaySettingsMenu } from './DisplaySettingsMenu';
import { ChromeStatusBadge } from './ChromeStatusBadge';
import { ThemeToggleButton } from './ThemeToggleButton';
import { cn } from '@/lib/utils';

export interface AppTopBarProps {
  currentScreen?: Screen;
  onNavigate?: (screen: Screen) => void;
  hrefFor?: (screen: Screen) => string;
  isTestingDraftDirty?: boolean;
  hasActiveReport?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  drawerTrigger?: React.ReactNode;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  onNavigate,
  hrefFor,
  isTestingDraftDirty = false,
  hasActiveReport = false,
  title,
  subtitle,
  icon,
  actions,
  drawerTrigger,
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    return (
      <div className="bg-primary/6 dark:bg-primary/15 p-2 rounded-none border border-primary/25 dark:border-primary/35 shrink-0 text-primary flex items-center justify-center">
        {React.isValidElement(icon)
          ? icon
          : typeof icon === 'function' || (typeof icon === 'object' && icon !== null)
          ? React.createElement(icon as React.ComponentType<{ className?: string }>, {
              className: 'h-5 w-5 text-primary',
            })
          : null}
      </div>
    );
  };

  return (
    <header
      role="banner"
      aria-label="Application header"
      className="bg-card text-card-foreground border-b border-border xl:border-t-[3px] xl:border-t-primary no-print"
    >
      {/* Phone view (<768px, md:hidden): controls row + dedicated title row */}
      <div className="md:hidden bg-masthead text-masthead-foreground border-b border-masthead-border pt-[env(safe-area-inset-top)]">
        <div className="px-3 sm:px-4 min-h-[56px] flex items-center justify-between gap-2 min-w-0">
          {/* Left: Drawer trigger + Status badges (title has its own row below) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {drawerTrigger}
            <div className="flex items-center gap-1.5 min-w-0">
              {isTestingDraftDirty && (
                <ChromeStatusBadge variant="draft" size="compact" />
              )}
              {hasActiveReport && (
                <ChromeStatusBadge variant="report" size="compact" />
              )}
            </div>
          </div>

          {/* Right: Actions + Display Settings + Theme Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            {actions && (
              <div className="flex items-center gap-1 shrink-0">
                {actions}
              </div>
            )}
            <DisplaySettingsMenu variant="masthead" />
            <ThemeToggleButton variant="masthead" />
          </div>
        </div>

        {/* Dedicated title row: wraps, never truncates (R2 identity-rail spec) */}
        {title && (
          <div className="px-3 sm:px-4 pb-2">
            <h1 className="text-base font-bold tracking-tight text-white leading-snug break-words m-0">
              {title}
            </h1>
          </div>
        )}
      </div>

      {/* Tablet view (768px - 1279px, hidden md:flex md:flex-col xl:hidden): Richer 2-row layout */}
      <div className="hidden md:flex md:flex-col xl:hidden">
        {/* Row 1: Mobile Identity & Chrome Row (using masthead tokens) */}
        <div className="bg-masthead text-masthead-foreground border-b border-masthead-border pt-[env(safe-area-inset-top)]">
          <div className="px-4 sm:px-5 py-1.5 flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              {drawerTrigger}
              <a
                href={hrefFor?.(Screen.LOG) || '/'}
                onClick={(e) => {
                  if (onNavigate && shouldHandleNavigation(e)) {
                    e.preventDefault();
                    onNavigate(Screen.LOG);
                  }
                }}
                aria-label="DREAM Home"
                className={cn(
                  'flex items-center gap-2 min-h-[44px] px-1 rounded-none text-white font-bold tracking-tight text-lg leading-none transition-opacity',
                  'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-masthead-accent focus-visible:ring-offset-2 focus-visible:ring-offset-masthead'
                )}
              >
                DREAM
              </a>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <DisplaySettingsMenu variant="masthead" />
              <ThemeToggleButton variant="masthead" />
            </div>
          </div>
        </div>

        {/* Row 2: Page Context and Actions */}
        {(title || subtitle || icon || actions || isTestingDraftDirty || hasActiveReport) && (
          <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              {renderIcon()}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {title && (
                    <h1 className="heading-page leading-snug break-words">
                      {title}
                    </h1>
                  )}
                  {isTestingDraftDirty && (
                    <ChromeStatusBadge variant="draft" size="default" />
                  )}
                  {hasActiveReport && (
                    <ChromeStatusBadge variant="report" size="default" />
                  )}
                </div>
                {subtitle && (
                  <div className="text-xs text-muted-foreground break-words font-normal mt-1 leading-normal">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            {actions && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:self-center">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop view (>=1280px, hidden xl:block) */}
      <div className="hidden xl:block">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 md:px-6 py-3 flex items-center justify-between gap-4 min-w-0">
          {/* Left: Page icon, title, subtitle */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {renderIcon()}
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="heading-page leading-snug break-words">
                  {title}
                </h1>
              )}
              {subtitle && (
                <div className="text-xs text-muted-foreground break-words font-normal mt-1 leading-normal">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Right: Status labels, actions, display settings, theme toggle */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {isTestingDraftDirty && (
              <ChromeStatusBadge variant="draft" size="comfortable" />
            )}
            {hasActiveReport && (
              <ChromeStatusBadge variant="report" size="comfortable" />
            )}

            {actions && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {actions}
              </div>
            )}

            <div className="flex items-center gap-1 border-l border-border pl-2 shrink-0">
              <DisplaySettingsMenu variant="card" />
              <ThemeToggleButton variant="card" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
