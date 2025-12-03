/**
 * Examples for Batch Processing Trading Cards
 * 
 * This demonstrates how to:
 * 1. Create a template with changeable elements
 * 2. Mark elements as changeable
 * 3. Generate multiple card versions from the template
 */

import {
  generateBatch,
  generateCard,
  previewTemplateVariables,
  validateTemplateData,
  generateBatchWithValidation,
  markElementAsChangeable,
  findChangeableElements,
} from './batchProcessor';
import { loadDesign, exportDesign, addTextElement, addImageElement } from './designEditor';

/**
 * Example 1: Basic batch generation
 * 
 * Step 1: Create a template in the UI and mark elements as changeable
 * Step 2: Export the template as JSON
 * Step 3: Use this function to generate multiple cards
 */
export function exampleBasicBatch(store, templateJson) {
  // Array of card data - each object represents one card
  const cardData = [
    {
      name: 'John Doe',
      title: 'Software Engineer',
      image: 'https://example.com/avatar1.jpg',
    },
    {
      name: 'Jane Smith',
      title: 'Designer',
      image: 'https://example.com/avatar2.jpg',
    },
    {
      name: 'Bob Johnson',
      title: 'Product Manager',
      image: 'https://example.com/avatar3.jpg',
    },
  ];

  // Generate all cards
  const result = generateBatch(store, templateJson, cardData, {
    onProgress: (current, total, data) => {
      console.log(`Processing card ${current}/${total}: ${data.name}`);
    },
  });

  console.log(`Generated ${result.successful} cards successfully`);
  console.log(`Failed: ${result.failed}`);

  // Access individual designs
  result.results.forEach(({ index, data, design }) => {
    console.log(`Card ${index + 1} (${data.name}):`, design);
    // Save or process each design as needed
  });

  return result;
}

/**
 * Example 2: Preview template variables before processing
 * Useful to see what variables are available in your template
 */
export function examplePreviewTemplate(store, templateJson) {
  const preview = previewTemplateVariables(store, templateJson);

  console.log('Available variables:', preview.variableNames);
  console.log('Variable details:', preview.variables);

  // Example output:
  // {
  //   variables: {
  //     name: { count: 1, types: ['text'], elements: [...] },
  //     title: { count: 1, types: ['text'], elements: [...] },
  //     image: { count: 1, types: ['image'], elements: [...] },
  //   },
  //   variableNames: ['name', 'title', 'image'],
  //   totalChangeableElements: 3,
  // }

  return preview;
}

/**
 * Example 3: Validate data before processing
 */
export function exampleValidateData(store, templateJson, cardData) {
  const validation = validateTemplateData(store, templateJson, cardData);

  if (!validation.valid) {
    console.error('Missing required variables:', validation.missing);
    console.error('Required:', validation.required);
    console.error('Provided:', validation.provided);
    return false;
  }

  console.log('Data is valid!');
  return true;
}

/**
 * Example 4: Generate with validation and error handling
 */
export function exampleBatchWithValidation(store, templateJson, cardDataArray) {
  const result = generateBatchWithValidation(
    store,
    templateJson,
    cardDataArray,
    {
      strict: true, // Skip invalid cards
      onProgress: (current, total, data) => {
        console.log(`Processing ${current}/${total}`);
      },
      onError: (error, index, data) => {
        console.error(`Card ${index + 1} failed:`, error);
        console.error('Data was:', data);
      },
    }
  );

  console.log(`Successfully generated: ${result.successful}`);
  console.log(`Failed: ${result.failed}`);
  console.log(`Skipped (invalid): ${result.skipped.length}`);

  return result;
}

/**
 * Example 5: Complex card data with nested properties
 */
export function exampleComplexCards(store, templateJson) {
  const cardData = [
    {
      // Text variables
      playerName: 'LeBron James',
      position: 'Forward',
      team: 'Los Angeles Lakers',
      stats: '27.0 PPG, 8.0 RPG, 7.0 APG',
      
      // Image variables
      playerPhoto: 'https://example.com/lebron.jpg',
      teamLogo: 'https://example.com/lakers-logo.png',
      
      // Image with custom properties
      backgroundImage: {
        src: 'https://example.com/court-background.jpg',
        opacity: 0.3,
      },
    },
    {
      playerName: 'Stephen Curry',
      position: 'Guard',
      team: 'Golden State Warriors',
      stats: '24.0 PPG, 4.5 RPG, 6.5 APG',
      playerPhoto: 'https://example.com/curry.jpg',
      teamLogo: 'https://example.com/warriors-logo.png',
      backgroundImage: {
        src: 'https://example.com/court-background.jpg',
        opacity: 0.3,
      },
    },
  ];

  return generateBatch(store, templateJson, cardData);
}

/**
 * Example 6: Generate single card
 */
export function exampleSingleCard(store, templateJson) {
  const cardData = {
    name: 'John Doe',
    title: 'Software Engineer',
    image: 'https://example.com/avatar.jpg',
  };

  const design = generateCard(store, templateJson, cardData);
  return design;
}

/**
 * Example 7: Programmatically create a template
 * This shows how to create a template programmatically and mark elements
 */
export function exampleCreateTemplate(store) {
  // Clear canvas
  // clearCanvas(store);

  // Add title text element and mark it as changeable
  const titleElement = addTextElement(store, {
    text: '{{playerName}}', // Use placeholder text
    x: store.width / 2,
    y: 50,
    fontSize: 36,
    fill: '#000000',
    align: 'center',
  });
  markElementAsChangeable(titleElement, 'playerName');

  // Add position text
  const positionElement = addTextElement(store, {
    text: '{{position}}',
    x: store.width / 2,
    y: 100,
    fontSize: 24,
    fill: '#666666',
    align: 'center',
  });
  markElementAsChangeable(positionElement, 'position');

  // Add image placeholder (you'd need to add an actual image first)
  // Then mark it as changeable using markElementAsChangeable(imageElement, 'playerPhoto')

  // Export the template
  return exportDesign(store);
}

/**
 * Example 8: Find and list all changeable elements in current design
 * Useful for debugging templates
 */
export function exampleListChangeableElements(store) {
  const changeableElements = findChangeableElements(store);

  console.log('Changeable elements:');
  Object.entries(changeableElements).forEach(([variableName, elements]) => {
    console.log(`  ${variableName}: ${elements.length} element(s)`);
    elements.forEach((element, index) => {
      console.log(`    [${index}] ${element.type} - ID: ${element.id}`);
      if (element.type === 'text') {
        console.log(`        Current text: "${element.text}"`);
      }
    });
  });

  return changeableElements;
}

/**
 * Example 9: Complete workflow
 * 1. Load template
 * 2. Preview variables
 * 3. Validate data
 * 4. Generate batch
 * 5. Process results
 */
export async function exampleCompleteWorkflow(store, templateJson, cardDataArray) {
  try {
    // Step 1: Preview template variables
    console.log('Step 1: Previewing template...');
    const preview = previewTemplateVariables(store, templateJson);
    console.log('Available variables:', preview.variableNames);

    // Step 2: Validate all data
    console.log('\nStep 2: Validating data...');
    const invalidCards = [];
    cardDataArray.forEach((data, index) => {
      const validation = validateTemplateData(store, templateJson, data);
      if (!validation.valid) {
        invalidCards.push({ index, data, validation });
      }
    });

    if (invalidCards.length > 0) {
      console.warn(`Found ${invalidCards.length} invalid cards:`);
      invalidCards.forEach(({ index, validation }) => {
        console.warn(`  Card ${index + 1}: Missing ${validation.missing.join(', ')}`);
      });
    }

    // Step 3: Generate batch
    console.log('\nStep 3: Generating cards...');
    const result = generateBatch(store, templateJson, cardDataArray, {
      onProgress: (current, total) => {
        console.log(`  Progress: ${current}/${total}`);
      },
    });

    // Step 4: Process results
    console.log('\nStep 4: Results:');
    console.log(`  Successful: ${result.successful}`);
    console.log(`  Failed: ${result.failed}`);

    // Export or save each design
    result.results.forEach(({ index, data, design }) => {
      // You could save each design here
      // saveDesign(design, `card-${index + 1}-${data.name}.json`);
      console.log(`  Card ${index + 1}: ${data.name || 'Untitled'}`);
    });

    return {
      success: true,
      result,
      preview,
      invalidCards,
    };
  } catch (error) {
    console.error('Workflow error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Example 10: Using in a React component or API endpoint
 */
export function exampleReactUsage() {
  return `
// In your React component or API handler:

import { generateBatch, previewTemplateVariables } from './utils/batchProcessor';

// Load your template JSON (from file upload or stored template)
const templateJson = { /* ... your template JSON ... */ };

// Prepare card data
const cardData = [
  { name: 'Card 1', image: 'url1.jpg' },
  { name: 'Card 2', image: 'url2.jpg' },
  // ... more cards
];

// Generate batch
const result = generateBatch(store, templateJson, cardData, {
  onProgress: (current, total) => {
    setProgress(current / total * 100);
  },
});

// Process results
result.results.forEach(({ design, data }) => {
  // Save each design or convert to image
  // await saveDesignToCloud(design);
  // await exportDesignAsImage(design);
});
`;
}

