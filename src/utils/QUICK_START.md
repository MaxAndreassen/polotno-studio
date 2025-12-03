# Quick Start: Batch Processing Trading Cards

This guide will walk you through creating a template and generating multiple card versions.

## Step 1: Create Your Template

1. Open the design studio at `/studio`
2. Create your card design with all the static elements (backgrounds, borders, etc.)
3. For each element you want to make changeable:
   - **Select the element**
   - In the properties panel, find the **"Name"** field
   - Set it to `{{variableName}}` (e.g., `{{playerName}}`, `{{image}}`, `{{position}}`)
   
   **OR** for text elements:
   - Set the text content to `{{variableName}}` (e.g., `{{playerName}}`)

## Step 2: Mark Elements (Using Console)

Open the browser console (F12) and use these commands:

```javascript
// Mark the currently selected element(s) as changeable
markSelected('playerName')

// List all changeable elements
listChangeable()

// Auto-mark text elements that already have {{placeholder}} text
markPlaceholders()

// Clear all markers
clearMarkers()
```

## Step 3: Export Your Template

1. Click **File** → **Save as JSON**
2. Save the file (e.g., `card-template.json`)

## Step 4: Generate Multiple Cards

```javascript
import { generateBatch } from './utils/batchProcessor';

// Load your template JSON
const templateJson = { /* paste your exported JSON here */ };

// Prepare your card data
const cardData = [
  {
    playerName: 'LeBron James',
    position: 'Forward',
    image: 'https://example.com/lebron.jpg',
  },
  {
    playerName: 'Stephen Curry',
    position: 'Guard',
    image: 'https://example.com/curry.jpg',
  },
  // Add more cards...
];

// Generate all cards
const result = generateBatch(store, templateJson, cardData, {
  onProgress: (current, total) => {
    console.log(`Processing ${current}/${total}`);
  },
});

// Access the generated designs
result.results.forEach(({ design, data }) => {
  console.log(`Card for ${data.playerName}:`, design);
  // Save or process each design as needed
});
```

## Example: Complete Workflow

```javascript
import {
  generateBatch,
  previewTemplateVariables,
  validateTemplateData,
} from './utils/batchProcessor';

// 1. Preview template to see available variables
const preview = previewTemplateVariables(store, templateJson);
console.log('Available variables:', preview.variableNames);
// Output: ['playerName', 'position', 'image']

// 2. Validate your data
const cardData = {
  playerName: 'LeBron James',
  position: 'Forward',
  image: 'https://example.com/photo.jpg',
};

const validation = validateTemplateData(store, templateJson, cardData);
if (!validation.valid) {
  console.error('Missing:', validation.missing);
}

// 3. Generate batch
const result = generateBatch(store, templateJson, [cardData, /* more cards... */]);

// 4. Process results
result.results.forEach(({ design, data, index }) => {
  // Each design is a complete JSON that can be:
  // - Loaded back into the editor
  // - Exported as image/PDF
  // - Saved to cloud storage
  console.log(`Card ${index + 1}:`, design);
});
```

## Tips

1. **Use descriptive variable names**: `{{playerName}}` is clearer than `{{name}}`

2. **Preview first**: Always preview your template variables before generating:
   ```javascript
   previewTemplateVariables(store, templateJson);
   ```

3. **Test with one card**: Generate a single card first to verify everything works:
   ```javascript
   import { generateCard } from './utils/batchProcessor';
   const design = generateCard(store, templateJson, cardData[0]);
   ```

4. **Handle errors**: Use error callbacks for large batches:
   ```javascript
   generateBatch(store, templateJson, cardData, {
     onError: (error, index, data) => {
       console.error(`Card ${index} failed:`, error);
     },
   });
   ```

## Console Commands Reference

When in the design studio (`/studio`), these commands are available in the console:

- `markSelected('variableName')` - Mark selected element(s) as changeable
- `markElement('elementId', 'variableName')` - Mark element by ID
- `markPlaceholders()` - Auto-mark text elements with {{placeholder}} text
- `listChangeable()` - List all changeable elements
- `clearMarkers()` - Clear all changeable markers

## Next Steps

- See `BATCH_PROCESSOR_README.md` for detailed API documentation
- See `batchProcessor.example.js` for more examples
- See `designEditor.js` for lower-level design manipulation

