
interface ComparisonStatusMessageProps {
  runCount: number;
  firstRunNumber?: number;
}

export function ComparisonStatusMessage({ runCount, firstRunNumber }: ComparisonStatusMessageProps) {
  if (runCount === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No run data available for comparison.
      </div>
    );
  }

  if (runCount === 1) {
    return (
      <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg mb-4">
        <p className="font-medium">Only one run available (Run #{firstRunNumber})</p>
        <p className="text-sm mt-1">Multiple runs are needed for price comparison. Please run additional scans to see price changes over time.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-4 text-green-600 bg-green-50 rounded-lg mb-4">
      <p className="font-medium">Price comparison available across {runCount} runs</p>
      <p className="text-sm mt-1">Showing price changes between runs. Green badges indicate price decreases, red badges indicate increases.</p>
    </div>
  );
}
