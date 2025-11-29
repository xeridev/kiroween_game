import { useState, useEffect } from "react";
import type { StorySummary as StorySummaryType } from "../utils/types";
import "./StorySummary.css";

interface StorySummaryProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  autoGenerate?: boolean; // True for death memorial
  onGenerate: () => Promise<StorySummaryType | null>;
}

/**
 * StorySummary component displays AI-generated life recap with export options.
 * 
 * Requirements: 7.1, 7.6, 7.7
 */
export function StorySummary({
  isOpen,
  onClose,
  petName,
  autoGenerate = false,
  onGenerate,
}: StorySummaryProps) {
  const [summary, setSummary] = useState<StorySummaryType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Auto-generate on mount if autoGenerate is true
  useEffect(() => {
    if (isOpen && autoGenerate && !summary && !isGenerating) {
      handleGenerate();
    }
  }, [isOpen, autoGenerate]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setCopySuccess(false);

    try {
      const result = await onGenerate();
      if (result) {
        setSummary(result);
      } else {
        setError("Failed to generate summary. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while generating the summary.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!summary) return;

    try {
      setExportError(null); // Clear previous export errors
      await navigator.clipboard.writeText(summary.summaryText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Requirement 15.3: Export failure with retry
      setExportError("Failed to copy to clipboard. Please try again.");
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleDownloadAsText = () => {
    if (!summary) return;

    try {
      setExportError(null); // Clear previous export errors
      const blob = new Blob([summary.summaryText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${petName}-story.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      // Requirement 15.3: Export failure with retry
      setExportError("Failed to download file. Please try again.");
      console.error("Download failed:", err);
    }
  };

  const handleClose = () => {
    setSummary(null);
    setError(null);
    setCopySuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="story-summary-modal"
      role="dialog"
      aria-labelledby="summary-title"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="story-summary-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="summary-header">
          <h2 id="summary-title">{petName}'s Story</h2>
          <button
            className="summary-close-button"
            onClick={handleClose}
            aria-label="Close story summary"
          >
            ×
          </button>
        </div>

        <div className="summary-body">
          {isGenerating && (
            <div className="summary-loading" role="status" aria-live="polite">
              <div className="loading-spinner" aria-hidden="true" />
              <p>Generating story summary...</p>
            </div>
          )}

          {error && !isGenerating && (
            <div className="summary-error" role="alert">
              <p>{error}</p>
              <button
                className="summary-button summary-button-retry"
                onClick={handleGenerate}
              >
                Retry
              </button>
            </div>
          )}

          {summary && !isGenerating && (
            <>
              <div className="summary-text" role="article">
                {summary.summaryText}
              </div>

              {exportError && (
                <div className="summary-export-error" role="alert">
                  <p>{exportError}</p>
                </div>
              )}

              <div className="summary-actions">
                <button
                  className="summary-button summary-button-primary"
                  onClick={handleCopyToClipboard}
                  aria-label="Copy story to clipboard"
                >
                  {copySuccess ? "Copied!" : "Copy to Clipboard"}
                </button>
                <button
                  className="summary-button summary-button-secondary"
                  onClick={handleDownloadAsText}
                  aria-label="Download story as text file"
                >
                  Download as Text
                </button>
              </div>
            </>
          )}

          {!summary && !isGenerating && !error && (
            <div className="summary-empty">
              <p>No summary generated yet.</p>
              <button
                className="summary-button summary-button-primary"
                onClick={handleGenerate}
              >
                Generate Summary
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
