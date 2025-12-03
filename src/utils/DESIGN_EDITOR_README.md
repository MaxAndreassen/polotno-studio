# Design Editor Utilities

This module provides utilities for programmatically editing Polotno designs using JSON export/import.

## Overview

The design editor utilities allow you to:
- Load designs from JSON
- Find and modify elements (text, images, etc.)
- Add new elements to the canvas
- Remove elements
- Export modified designs as JSON
- Create designs from templates with variable replacements

## Basic Usage

### 1. Export a Design as JSON

First, export a design from the UI using the "Save as JSON" option. This gives you a JSON file that represents the entire design.

```javascript
import { exportDesign } from './utils/designEditor';

// Get the current design as JSON
const json = exportDesign(store);
```

### 2. Load a Design from JSON

```javascript
import { loadDesign } from './utils/designEditor';

// Load a design from JSON (can be object or string)
loadDesign(store, designJson);
```

### 3. Find and Modify Text Elements

```javascript
import { findTextElements, updateTextElement } from './utils/designEditor';

// Find all text elements containing "Hello"
const elements = findTextElements(store, 'Hello');

// Update each element
elements.forEach(element => {
  updateTextElement(element, 'Hello World!', {
    fontSize: 32,
    fill: '#FF0000',
    fontFamily: 'Arial',
  });
});
```

### 4. Replace Images

```javascript
import { findElementsByType, updateImageElement } from './utils/designEditor';

// Find all image elements
const images = findElementsByType(store, 'image');

// Replace the first image
if (images[0]) {
  updateImageElement(images[0], 'https://example.com/new-image.jpg');
}
```

### 5. Add New Elements

```javascript
import { addTextElement, addImageElement } from './utils/designEditor';

// Add a text element
addTextElement(store, {
  text: 'New Text',
  x: 100,
  y: 100,
  fontSize: 24,
  fill: '#000000',
});

// Add an image element
await addImageElement(store, {
  src: 'https://example.com/image.jpg',
  x: 200,
  y: 200,
  width: 300,
  height: 200,
});
```

## Complete Example

Here's a complete example that loads a template, modifies it, and exports the result:

```javascript
import {
  loadDesign,
  exportDesign,
  findTextElements,
  updateTextElement,
  findElementsByType,
  updateImageElement,
} from './utils/designEditor';

function createCustomizedDesign(store, templateJson, userData) {
  // 1. Load the template
  loadDesign(store, templateJson);

  // 2. Replace text placeholders
  const nameElements = findTextElements(store, '{{name}}');
  nameElements.forEach(element => {
    updateTextElement(element, userData.name, {
      fontSize: 32,
      fill: '#000000',
    });
  });

  // 3. Replace images
  const images = findElementsByType(store, 'image');
  if (images[0] && userData.avatarUrl) {
    updateImageElement(images[0], userData.avatarUrl);
  }

  // 4. Export the modified design
  return exportDesign(store);
}

// Usage
const templateJson = { /* ... your template JSON ... */ };
const userData = {
  name: 'John Doe',
  avatarUrl: 'https://example.com/avatar.jpg',
};

const customizedDesign = createCustomizedDesign(store, templateJson, userData);
// Now you can save or use customizedDesign
```

## API Reference

### Core Functions

#### `loadDesign(store, json)`
Loads a design from JSON into the store.

**Parameters:**
- `store` - The Polotno store instance
- `json` - Design JSON (object or string)

**Returns:** The loaded design JSON object

#### `exportDesign(store)`
Exports the current design as JSON.

**Parameters:**
- `store` - The Polotno store instance

**Returns:** Design JSON object

### Finding Elements

#### `findElementsByType(store, type)`
Finds all elements of a specific type.

**Parameters:**
- `store` - The Polotno store instance
- `type` - Element type ('text', 'image', 'svg', etc.)

**Returns:** Array of matching elements

#### `findTextElements(store, searchText)`
Finds text elements containing specific text.

**Parameters:**
- `store` - The Polotno store instance
- `searchText` - Text to search for (optional)

**Returns:** Array of matching text elements

#### `findElementsByProperty(store, property, value)`
Finds elements by a property value.

**Parameters:**
- `store` - The Polotno store instance
- `property` - Property name to search
- `value` - Value to match

**Returns:** Array of matching elements

### Modifying Elements

#### `updateTextElement(element, newText, options)`
Updates a text element's content and style.

**Parameters:**
- `element` - The text element to update
- `newText` - New text content
- `options` - Additional options (fontSize, color, fontFamily, etc.)

#### `updateImageElement(element, newSrc, options)`
Updates an image element's source and properties.

**Parameters:**
- `element` - The image element to update
- `newSrc` - New image source URL
- `options` - Additional options (width, height, x, y, etc.)

#### `moveElement(element, x, y)`
Moves an element to a new position.

**Parameters:**
- `element` - The element to move
- `x` - New x position
- `y` - New y position

#### `resizeElement(element, width, height)`
Resizes an element.

**Parameters:**
- `element` - The element to resize
- `width` - New width
- `height` - New height

#### `rotateElement(element, rotation)`
Rotates an element.

**Parameters:**
- `element` - The element to rotate
- `rotation` - Rotation angle in degrees

### Adding Elements

#### `addTextElement(store, options)`
Adds a new text element to the canvas.

**Parameters:**
- `store` - The Polotno store instance
- `options` - Text element options:
  - `text` - Text content (default: 'New Text')
  - `x` - X position (default: center)
  - `y` - Y position (default: center)
  - `fontSize` - Font size (default: 24)
  - `fontFamily` - Font family (default: 'Arial')
  - `fill` - Text color (default: '#000000')
  - ... other text properties

**Returns:** The created text element

#### `addImageElement(store, options)`
Adds a new image element to the canvas.

**Parameters:**
- `store` - The Polotno store instance
- `options` - Image element options:
  - `src` - Image source URL (required)
  - `x` - X position (default: center)
  - `y` - Y position (default: center)
  - `width` - Image width (optional, will auto-calculate)
  - `height` - Image height (optional, will auto-calculate)
  - ... other image properties

**Returns:** Promise that resolves to the created image element

### Removing Elements

#### `removeElement(element)`
Removes an element from the canvas.

**Parameters:**
- `element` - The element to remove

#### `removeElementsByType(store, type)`
Removes all elements of a specific type.

**Parameters:**
- `store` - The Polotno store instance
- `type` - Element type to remove

#### `clearCanvas(store)`
Removes all elements from the canvas.

**Parameters:**
- `store` - The Polotno store instance

### Template Functions

#### `createDesignFromTemplate(store, templateJson, variables)`
Creates a new design from a template with variable replacements.

**Parameters:**
- `store` - The Polotno store instance
- `templateJson` - Template design JSON
- `variables` - Object with variable replacements:
  - `text` - Object mapping search strings to replacement text
  - `images` - Object mapping image indices/IDs to new sources

**Returns:** The modified design JSON

### Utility Functions

#### `duplicateElement(element, offset)`
Duplicates an element.

**Parameters:**
- `element` - The element to duplicate
- `offset` - Optional offset for the duplicate (default: {x: 10, y: 10})

**Returns:** The duplicated element

#### `batchUpdateElements(elements, updates)`
Updates multiple elements at once.

**Parameters:**
- `elements` - Array of elements to update
- `updates` - Properties to update on all elements

#### `getElementsByType(store)`
Gets all elements organized by type.

**Parameters:**
- `store` - The Polotno store instance

**Returns:** Object with arrays of elements by type

## JSON Structure

The JSON exported from Polotno has the following structure:

```json
{
  "version": "2.0",
  "pages": [
    {
      "id": "page-id",
      "width": 600,
      "height": 400,
      "children": [
        {
          "id": "element-id",
          "type": "text",
          "text": "Hello World",
          "x": 100,
          "y": 100,
          "fontSize": 24,
          "fill": "#000000",
          ...
        },
        {
          "id": "element-id-2",
          "type": "image",
          "src": "https://example.com/image.jpg",
          "x": 200,
          "y": 200,
          "width": 300,
          "height": 200,
          ...
        }
      ]
    }
  ]
}
```

## Tips

1. **Always validate JSON** before loading: The `loadDesign` function automatically validates the JSON, but you can also use `store.validate(json)` manually.

2. **Use placeholders in templates**: When creating templates, use placeholder text like `{{name}}` or `{{title}}` that you can easily find and replace.

3. **Handle async operations**: Image loading is asynchronous, so use `await` when adding images or use the Promise-based `addImageElement` function.

4. **Preserve element IDs**: If you need to reference specific elements later, you can use element IDs or indices. However, IDs may change when loading, so it's better to use content-based searches.

5. **Test with small changes first**: Start with simple modifications and gradually build up to more complex operations.

## See Also

- `designEditor.example.js` - More detailed examples
- Polotno documentation: https://polotno.com/docs

