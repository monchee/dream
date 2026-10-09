import React, { useState, useRef } from 'react';
import { Screen, Patient } from '@shared/types';
import { pathFromScreen } from '@core/navigation/navigationConfig';
import { AppSidebar } from './navigation/AppSidebar';
import { AppTopBar } from './navigation/AppTopBar';
import { AppNavigationDrawer } from './navigation/AppNavigationDrawer';
import { NavigationGuardDialog } from './navigation/NavigationGuardDialog';
import Footer from './Footer';
import DisclaimerBanner from './DisclaimerBanner';
import TTLExpiryBanner from './TTLExpiryBanner';
import { useTTLExpiryWarning } from '@shared/hooks/useTTLExpiryWarning';
import { useChromeHeight } from '@core/hooks/useChromeHeight';
import { CSVUploadInstructions } from '@features/dashboard/components/CSVUploadInstructions';
import { useRedcapCsvUpload } from '@shared/hooks/useRedcapCsvUpload';
import { ChunkErrorBoundary } from './ChunkErrorBoundary';
import { LoadingState } from '@shared/components/states';
import { cn } from '@/lib/utils';

export interface ScreenChrome {
  setScreen: (screen: Screen) => void;
  navigate?: (screen: Screen) => void;
  hrefFor?: (screen: Screen) => string;
  pendingNavigation?: Screen | null;
  confirmNavigation?: () => void;
  cancelNavigation?: () => void;
  onDeleteTestingDraft?: () => void;
  currentScreen: Screen;
  isTestingDraftDirty?: boolean;
  hasActiveReport?: boolean;
  databaseDate: string;
  showDisclaimer?: boolean;
  isCustomData?: boolean;
  onDismissDisclaimer?: () => void;
  onUploadPatients?: (patients: Patient[], fileLastModified?: number) => boolean | void;
  onUploadComplete?: () => void;
  csvUploadSheetOpen?: boolean;
  onCSVUploadSheetOpenChange?: ((open: boolean) => void) | React.Dispatch<React.SetStateAction<boolean>>;
  onOpenGetStarted?: () => void;
}

export interface ScreenPresentation {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  contextBar?: React.ReactNode;
  children: React.ReactNode;
  showFooter?: boolean;
  showNav?: boolean;
  className?: string;
  contentClassName?: string;
}

export type ScreenLayoutProps = { chrome: ScreenChrome } & ScreenPresentation;

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  chrome,
  title,
  subtitle,
  icon,
  actions,
  contextBar,
  children,
  showFooter = true,
  className,
  contentClassName,
  showNav = true,
}) => {
  const {
    setScreen,
    navigate,
    hrefFor = pathFromScreen,
    pendingNavigation = null,
    confirmNavigation,
    cancelNavigation,
    onDeleteTestingDraft,
    currentScreen = Screen.LOG,
    isTestingDraftDirty = false,
    hasActiveReport = false,
    databaseDate,
    showDisclaimer,
    isCustomData = false,
    onDismissDisclaimer,
    onUploadPatients,
    onUploadComplete,
    csvUploadSheetOpen,
    onCSVUploadSheetOpenChange,
    onOpenGetStarted,
  } = chrome;
  const [isCSVUploadSheetOpenLocal, setIsCSVUploadSheetOpenLocal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ttlExpiryWarning = useTTLExpiryWarning();
  const chromeRef = useChromeHeight<HTMLDivElement>();

  const isCSVUploadSheetOpen = csvUploadSheetOpen ?? isCSVUploadSheetOpenLocal;
  const setIsCSVUploadSheetOpen = onCSVUploadSheetOpenChange ?? setIsCSVUploadSheetOpenLocal;

  const onNavigate = navigate || setScreen;

  const { isUploading, handleFileChange: handleFileUpload } = useRedcapCsvUpload({
    onParsed: onUploadPatients,
    onComplete: () => {
      setIsCSVUploadSheetOpen(false);
      onUploadComplete?.();
    },
  });

  const handleOpenUploadCSV = () => {
    setIsCSVUploadSheetOpen(true);
  };

  const handleOpenGetStarted = () => {
    onOpenGetStarted?.();
  };

  return (
    <div
      className={cn(
        'min-h-screen print:min-h-0 bg-background dark:bg-background text-foreground flex flex-col',
        showNav && 'xl:pl-64 print:xl:pl-0',
        className
      )}
    >
      {/* Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Desktop Persistent Left Sidebar (xl: 1280px+) */}
      {showNav && (
        <AppSidebar
          currentScreen={currentScreen}
          onNavigate={onNavigate}
          hrefFor={hrefFor}
          isTestingDraftDirty={isTestingDraftDirty}
          hasActiveReport={hasActiveReport}
          onOpenUploadCSV={handleOpenUploadCSV}
          onOpenGetStarted={handleOpenGetStarted}
          databaseDate={databaseDate}
          isCustomData={isCustomData}
          onDeleteTestingDraft={onDeleteTestingDraft}
        />
      )}

      {/* Content Column: contains sticky measured chrome stack, main content, and footer */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Sticky Unified Chrome Stack in Content Column */}
        <div ref={chromeRef} className="sticky top-0 z-40 no-print">
          {showNav ? (
            <AppTopBar
              currentScreen={currentScreen}
              onNavigate={onNavigate}
              hrefFor={hrefFor}
              isTestingDraftDirty={isTestingDraftDirty}
              hasActiveReport={hasActiveReport}
              title={title}
              subtitle={subtitle}
              icon={icon}
              actions={actions}
              drawerTrigger={
                <div className="xl:hidden">
                  <AppNavigationDrawer
                    isOpen={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                    currentScreen={currentScreen}
                    onNavigate={onNavigate}
                    hrefFor={hrefFor}
                    isTestingDraftDirty={isTestingDraftDirty}
                    hasActiveReport={hasActiveReport}
                    onOpenUploadCSV={handleOpenUploadCSV}
                    onOpenGetStarted={handleOpenGetStarted}
                    databaseDate={databaseDate}
                    isCustomData={isCustomData}
                    onDeleteTestingDraft={onDeleteTestingDraft}
                  />
                </div>
              }
            />
          ) : (
            <header role="banner" aria-label="Application header" className="bg-card text-card-foreground border-b border-border no-print">
              <div className="max-w-6xl mx-auto px-4 sm:px-5 md:px-6 py-3 flex flex-row justify-between items-center gap-4 min-w-0 flex-wrap">
                {/* Title Area */}
                <div className="flex items-center gap-3 min-w-0">
                  {icon && (
                    <div className="bg-muted p-2 rounded-none border border-border shrink-0 text-foreground">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h1 className="heading-page leading-snug break-words">
                      {title}
                    </h1>
                    {subtitle && (
                      <div className="text-xs text-muted-foreground break-words font-normal mt-1 leading-normal">
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {actions && (
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {actions}
                  </div>
                )}
              </div>
            </header>
          )}

          {/* Tier 3: Context Bar */}
          {contextBar}

          {/* Disclaimer Banner */}
          {showDisclaimer && !isCustomData && onDismissDisclaimer && (
            <div className="print:hidden">
              <DisclaimerBanner
                onClose={onDismissDisclaimer}
                onUploadClick={() => setIsCSVUploadSheetOpen(true)}
              />
            </div>
          )}

          {/* TTL Expiry Warning Banner */}
          {ttlExpiryWarning.isNearExpiry && !ttlExpiryWarning.isDismissed && ttlExpiryWarning.expiresAt !== null && (
            <div className="print:hidden">
              <TTLExpiryBanner
                expiresAt={ttlExpiryWarning.expiresAt}
                onKeepWorking={ttlExpiryWarning.keepWorking}
                onDismiss={ttlExpiryWarning.dismiss}
              />
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main
          key={currentScreen}
          id="main-content"
          role="main"
          aria-label="Main content"
          tabIndex={-1}
          className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-6 flex flex-col relative z-10 animate-screen-enter focus:outline-none min-w-0"
        >
          <div className={cn('flex-1 flex flex-col min-w-0', contentClassName)}>
            <ChunkErrorBoundary>
              <React.Suspense
                fallback={
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground min-h-[50vh]">
                    <LoadingState label="Loading content..." size="lg" />
                  </div>
                }
              >
                {children}
              </React.Suspense>
            </ChunkErrorBoundary>
          </div>
        </main>

        {/* Footer */}
        {showFooter && (
          <Footer
            currentScreen={currentScreen}
            setScreen={onNavigate}
            onNavigate={onNavigate}
            hrefFor={hrefFor}
            databaseDate={databaseDate}
            onUploadPatients={onUploadPatients}
            isCustomData={isCustomData}
          />
        )}
      </div>

      {/* Hidden file input for CSV upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        aria-label="Upload CSV file"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Global CSV Upload Instructions Sheet */}
      {onUploadPatients && (
        <CSVUploadInstructions
          isOpen={isCSVUploadSheetOpen}
          onOpenChange={setIsCSVUploadSheetOpen}
          onUpload={handleFileUpload}
          isUploading={isUploading}
        />
      )}

      {/* Dirty Testing Navigation Guard Dialog */}
      {confirmNavigation && cancelNavigation && (
        <NavigationGuardDialog
          isOpen={pendingNavigation !== null}
          onConfirm={confirmNavigation}
          onCancel={cancelNavigation}
          onDelete={onDeleteTestingDraft ? () => {
            cancelNavigation();
            onDeleteTestingDraft();
          } : undefined}
        />
      )}
    </div>
  );
};

export default ScreenLayout;
