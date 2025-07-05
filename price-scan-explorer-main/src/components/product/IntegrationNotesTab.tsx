
export function IntegrationNotesTab() {
  return (
    <div>
      <div>
        <h4 className="font-medium mb-2">How to Use This Script</h4>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
          <li>Install Python dependencies: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">pip install beautifulsoup4</code></li>
          <li>Save HTML from Lotus's search pages to a file</li>
          <li>Update the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">HTML_FILE</code> path in the script</li>
          <li>Run the script to generate a JSON file with product data</li>
        </ol>
      </div>
      
      <div className="mt-4">
        <h4 className="font-medium mb-2">Integration with React App</h4>
        <p className="text-sm text-muted-foreground">
          To use the data in your React application:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground mt-2">
          <li>Run the script to generate the products.json file</li>
          <li>Import the JSON file into your project</li>
          <li>Replace or supplement the mock data in lotusProducts.ts with the scraped data</li>
          <li>For real-time scraping, create a backend API endpoint that runs this script</li>
        </ol>
      </div>
    </div>
  );
}
