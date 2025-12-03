# Batch Processor for Trading Card Templates

This module provides batch processing capabilities for generating multiple trading card designs from a single template.

## Overview

The batch processor allows you to:
1. **Mark elements as changeable** in your template design
2. **Generate multiple card versions** from one template
3. **Validate data** before processing
4. **Preview template variables** to see what can be changed

## Quick Start

### Step 1: Create a Template

1. Create your card design in the Polotno Studio UI
2. For each element you want to make changeable:
   - Select the element
   - In the properties panel, set the element's **Name** field to `{{variableName}}`
   - Example: Name an element `{{playerName}}` or `{{image}}`

   **OR** use placeholder text in text elements:
   - Set text content to `{{variableName}}`
   - Example: Text element with content `{{playerName}}`

### Step 2: Export Template

Export your template as JSON using "Save as JSON" in the File menu.

### Step 3: Generate Cards

```javascript
import { generateBatch } from './utils/batchProcessor';

const templateJson = { /* your template JSON */ };

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
];

const result = generateBatch(store, templateJson, cardData);

// Access generated designs
result.results.forEach(({ design, data }) => {
  console.log(`Card for ${data.playerName}:`, design);
});
```

## Marking Elements as Changeable

There are two ways to mark elements as changeable:

### Method 1: Element Name Property

1. Select an element in the UI
2. Find the "Name" property in the properties panel
3. Set it to `{{variableName}}` (e.g., `{{playerName}}`, `{{image}}`)

### Method 2: Placeholder Text (Text Elements Only)

1. For text elements, use placeholder text like `{{variableName}}`
2. The processor will replace the placeholder with actual data

## API Reference

### `generateBatch(store, templateJson, dataArray, options)`

Generates multiple card designs from a template.

**Parameters:**
- `store` - The Polotno store instance
- `templateJson` - Template design JSON (object or string)
- `dataArray` - Array of data objects, one per card
- `options` - Optional configuration:
  - `onProgress(current, total, data)` - Progress callback
  - `onError(error, index, data)` - Error handler
  - `keepTemplateLoaded` - Keep template loaded after (default: false)

**Returns:**
```javascript
{
  results: [
    { index: 0, data: {...}, design: {...}, success: true },
    // ...
  ],
  errors: [
    { index: 1, data: {...}, error: '...', success: false },
    // ...
  ],
  total: 10,
  successful: 9,
  failed: 1,
}
```

### `generateCard(store, templateJson, data)`

Generates a single card design.

**Parameters:**
- `store` - The Polotno store instance
- `templateJson` - Template design JSON
- `data` - Data object for the card

**Returns:** Generated design JSON

### `previewTemplateVariables(store, templateJson)`

Shows what variables are available in a template.

**Returns:**
```javascript
{
  variables: {
    playerName: {
      count: 1,
      types: ['text'],
      elements: [...]
    },
    image: {
      count: 1,
      types: ['image'],
      elements: [...]
    }
  },
  variableNames: ['playerName', 'image'],
  totalChangeableElements: 2,
}
```

### `validateTemplateData(store, templateJson, data)`

Validates that data contains all required variables.

**Returns:**
```javascript
{
  valid: true,
  missing: [],
  provided: ['playerName', 'image'],
  required: ['playerName', 'image'],
}
```

### `generateBatchWithValidation(store, templateJson, dataArray, options)`

Generates batch with validation. Invalid cards are skipped if `strict: true`.

**Options:**
- `strict` - Skip invalid cards (default: false)

### `markElementAsChangeable(element, variableName)`

Programmatically mark an element as changeable.

**Example:**
```javascript
const textElement = addTextElement(store, { text: 'Hello' });
markElementAsChangeable(textElement, 'greeting');
```

### `findChangeableElements(store)`

Find all changeable elements in the current design.

**Returns:** Object mapping variable names to arrays of elements

## Examples

### Basic Usage

```javascript
import { generateBatch } from './utils/batchProcessor';

const templateJson = { /* exported template */ };

const cards = [
  { name: 'Card 1', image: 'url1.jpg' },
  { name: 'Card 2', image: 'url2.jpg' },
];

const result = generateBatch(store, templateJson, cards);
```

### With Progress Tracking

```javascript
const result = generateBatch(store, templateJson, cards, {
  onProgress: (current, total, data) => {
    console.log(`Processing ${current}/${total}: ${data.name}`);
    setProgress(current / total * 100);
  },
});
```

### With Validation

```javascript
import { generateBatchWithValidation } from './utils/batchProcessor';

const result = generateBatchWithValidation(
  store,
  templateJson,
  cards,
  {
    strict: true, // Skip invalid cards
    onError: (error, index, data) => {
      console.error(`Card ${index} failed:`, error);
    },
  }
);
```

### Preview Template First

```javascript
import { previewTemplateVariables } from './utils/batchProcessor';

const preview = previewTemplateVariables(store, templateJson);
console.log('Available variables:', preview.variableNames);
// Output: ['playerName', 'position', 'image', ...]
```

## Data Object Structure

Your data objects should have properties matching your variable names:

```javascript
{
  // Text variables
  playerName: 'LeBron James',
  position: 'Forward',
  team: 'Los Angeles Lakers',
  
  // Image variables (URL string)
  playerPhoto: 'https://example.com/photo.jpg',
  
  // Image variables (object with properties)
  backgroundImage: {
    src: 'https://example.com/bg.jpg',
    opacity: 0.5,
    width: 600,
    height: 400,
  },
}
```

## Supported Element Types

- **Text Elements**: Replace text content or use placeholder text
- **Image Elements**: Replace image source URL
- **Other Elements**: Can be marked by name, but may require custom handling

## Tips

1. **Use descriptive variable names**: `{{playerName}}` is better than `{{name}}`

2. **Preview before processing**: Use `previewTemplateVariables()` to see what variables are available

3. **Validate data**: Use `validateTemplateData()` or `generateBatchWithValidation()` to catch errors early

4. **Handle errors**: Provide an `onError` callback to handle individual card failures gracefully

5. **Test with small batches first**: Start with 2-3 cards to verify your template works correctly

6. **Image URLs**: Make sure image URLs are accessible. Consider using data URLs or hosted images

7. **Performance**: For large batches (100+ cards), consider processing in chunks or using web workers

## Common Patterns

### Trading Card Template

```javascript
// Template variables:
// - {{playerName}}
// - {{position}}
// - {{team}}
// - {{stats}}
// - {{playerPhoto}}
// - {{teamLogo}}

const cardData = [
  {
    playerName: 'LeBron James',
    position: 'Forward',
    team: 'Los Angeles Lakers',
    stats: '27.0 PPG, 8.0 RPG, 7.0 APG',
    playerPhoto: 'https://example.com/lebron.jpg',
    teamLogo: 'https://example.com/lakers.png',
  },
  // ... more cards
];
```

### Business Card Template

```javascript
// Template variables:
// - {{name}}
// - {{title}}
// - {{email}}
// - {{phone}}
// - {{logo}}

const cardData = [
  {
    name: 'John Doe',
    title: 'Software Engineer',
    email: 'john@example.com',
    phone: '+1-234-567-8900',
    logo: 'https://example.com/logo.png',
  },
  // ... more cards
];
```

## See Also

- `batchProcessor.example.js` - More detailed examples
- `designEditor.js` - Lower-level design manipulation utilities

