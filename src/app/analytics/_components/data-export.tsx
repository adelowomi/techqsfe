"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface DataExportProps {
  seasonId: string;
}

export function DataExport({ seasonId }: DataExportProps) {
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [exportType, setExportType] = useState<"full" | "summary" | "cards" | "attempts">("full");
  const [isExporting, setIsExporting] = useState(false);

  const exportDataMutation = api.analytics.exportData.useMutation();

  const handleExport = async () => {
    if (!seasonId) return;

    setIsExporting(true);
    try {
      const exportData = await exportDataMutation.mutateAsync({ seasonId });
      
      let dataToExport: any;
      let filename: string;

      switch (exportType) {
        case "full":
          dataToExport = exportData;
          filename = `season-${exportData.season.name}-full-export`;
          break;
        case "summary":
          dataToExport = {
            season: exportData.season,
            stats: exportData.stats,
            exportedAt: exportData.exportedAt,
          };
          filename = `season-${exportData.season.name}-summary`;
          break;
        case "cards":
          dataToExport = {
            season: { name: exportData.season.name, id: exportData.season.id },
            cards: exportData.cards,
            exportedAt: exportData.exportedAt,
          };
          filename = `season-${exportData.season.name}-cards`;
          break;
        case "attempts":
          dataToExport = {
            season: { name: exportData.season.name, id: exportData.season.id },
            attempts: exportData.attempts,
            exportedAt: exportData.exportedAt,
          };
          filename = `season-${exportData.season.name}-attempts`;
          break;
        default:
          dataToExport = exportData;
          filename = `season-${exportData.season.name}-export`;
      }

      if (exportFormat === "json") {
        downloadJSON(dataToExport, `${filename}.json`);
      } else {
        downloadCSV(dataToExport, `${filename}.csv`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJSON = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: any, filename: string) => {
    let csvContent = "";

    if (exportType === "cards" || exportType === "full") {
      // Export cards as CSV
      csvContent += "Card Export\n";
      csvContent += "Card Number,Difficulty,Question,Correct Answer,Usage Count,Last Used,Created At\n";
      
      const cards = exportType === "full" ? data.cards : data.cards;
      cards.forEach((card: any) => {
        const row = [
          card.cardNumber,
          card.difficulty,
          `"${card.question.replace(/"/g, '""')}"`,
          `"${card.correctAnswer.replace(/"/g, '""')}"`,
          card.usageCount,
          card.lastUsed ? new Date(card.lastUsed).toISOString() : "",
          new Date(card.createdAt).toISOString(),
        ].join(",");
        csvContent += row + "\n";
      });
      csvContent += "\n";
    }

    if (exportType === "attempts" || exportType === "full") {
      // Export attempts as CSV
      csvContent += "Attempts Export\n";
      csvContent += "Contestant Name,Card Number,Difficulty,Question,Given Answer,Is Correct,Attempted At\n";
      
      const attempts = exportType === "full" ? data.attempts : data.attempts;
      attempts.forEach((attempt: any) => {
        const row = [
          `"${attempt.contestantName.replace(/"/g, '""')}"`,
          attempt.card.cardNumber,
          attempt.card.difficulty,
          `"${attempt.card.question.replace(/"/g, '""')}"`,
          `"${attempt.givenAnswer.replace(/"/g, '""')}"`,
          attempt.isCorrect,
          new Date(attempt.attemptedAt).toISOString(),
        ].join(",");
        csvContent += row + "\n";
      });
      csvContent += "\n";
    }

    if (exportType === "summary" || exportType === "full") {
      // Export summary statistics as CSV
      csvContent += "Summary Statistics\n";
      csvContent += "Metric,Value\n";
      csvContent += `Season Name,"${data.stats.seasonName}"\n`;
      csvContent += `Total Cards,${data.stats.totalCards}\n`;
      csvContent += `Total Attempts,${data.stats.totalAttempts}\n`;
      csvContent += `Overall Success Rate,${data.stats.overallSuccessRate}%\n`;
      csvContent += "\n";

      csvContent += "Difficulty Statistics\n";
      csvContent += "Difficulty,Card Count,Attempt Count,Success Rate\n";
      data.stats.difficultyStats.forEach((stat: any) => {
        csvContent += `${stat.difficulty},${stat.cardCount},${stat.attemptCount},${stat.successRate}%\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-900">Export Season Data</h3>
            <p className="mt-2 text-sm text-blue-700">
              Download comprehensive reports about card usage and contestant performance. 
              Choose your preferred format and data scope below.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Export Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Data to Export
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="full"
                  checked={exportType === "full"}
                  onChange={(e) => setExportType(e.target.value as typeof exportType)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">
                  <strong>Full Export</strong> - All data including cards, attempts, and statistics
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="summary"
                  checked={exportType === "summary"}
                  onChange={(e) => setExportType(e.target.value as typeof exportType)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">
                  <strong>Summary Only</strong> - Season statistics and performance metrics
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="cards"
                  checked={exportType === "cards"}
                  onChange={(e) => setExportType(e.target.value as typeof exportType)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">
                  <strong>Cards Only</strong> - Question cards with usage statistics
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="attempts"
                  checked={exportType === "attempts"}
                  onChange={(e) => setExportType(e.target.value as typeof exportType)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">
                  <strong>Attempts Only</strong> - Contestant attempts and responses
                </span>
              </label>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              File Format
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="json"
                  checked={exportFormat === "json"}
                  onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">
                  <strong>JSON</strong> - Structured data format, ideal for developers
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">
                  <strong>CSV</strong> - Spreadsheet format, ideal for Excel or Google Sheets
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {exportType === "full" && "This will export all season data including cards, attempts, and statistics."}
              {exportType === "summary" && "This will export season statistics and performance metrics only."}
              {exportType === "cards" && "This will export all question cards with their usage statistics."}
              {exportType === "attempts" && "This will export all contestant attempts and responses."}
            </div>
            
            <button
              onClick={handleExport}
              disabled={isExporting || !seasonId}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Export Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Export Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">JSON Format Benefits:</h5>
            <ul className="space-y-1 list-disc list-inside">
              <li>Preserves data structure and relationships</li>
              <li>Includes all metadata and timestamps</li>
              <li>Easy to import into other applications</li>
              <li>Supports nested data structures</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">CSV Format Benefits:</h5>
            <ul className="space-y-1 list-disc list-inside">
              <li>Opens directly in Excel or Google Sheets</li>
              <li>Easy to create charts and pivot tables</li>
              <li>Widely supported by data analysis tools</li>
              <li>Human-readable format</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Exported data includes sensitive information like contestant names and answers. 
                Please handle exported files according to your privacy and data protection policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}