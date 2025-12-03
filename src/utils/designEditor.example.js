/**
 * Example usage of the designEditor utilities
 * 
 * This file demonstrates how to programmatically edit designs
 * using the JSON export/import functionality.
 */

import {
  loadDesign,
  exportDesign,
  findTextElements,
  findElementsByType,
  updateTextElement,
  updateImageElement,
  addTextElement,
  addImageElement,
  removeElement,
  createDesignFromTemplate,
  getElementsByType,
} from './designEditor';

/**
 * Example 1: Load a design from JSON and modify text
 */
export function exampleModifyText(store, designJson) {
  // Load the design
  loadDesign(store, designJson);

  // Find all text elements containing "Hello"
  const helloElements = findTextElements(store, 'Hello');

  // Update each one
  helloElements.forEach(element => {
    updateTextElement(element, 'Hello World!', {
      fontSize: 32,
      fill: '#FF0000',
      fontFamily: 'Arial',
    });
  });

  // Export the modified design
  return exportDesign(store);
}

/**
 * Example 2: Replace all images in a design
 */
export function exampleReplaceImages(store, designJson, newImageUrls) {
  loadDesign(store, designJson);

  const imageElements = findElementsByType(store, 'image');

  // Replace each image
  imageElements.forEach((element, index) => {
    if (newImageUrls[index]) {
      updateImageElement(element, newImageUrls[index]);
    }
  });

  return exportDesign(store);
}

/**
 * Example 3: Create a new design by adding elements
 */
export function exampleCreateNewDesign(store) {
  // Start with a blank canvas (or load a template)
  // store should already have a page from initialization

  // Add a title
  addTextElement(store, {
    text: 'My Card Design',
    x: store.width / 2,
    y: 50,
    fontSize: 36,
    fill: '#000000',
    fontFamily: 'Arial',
    align: 'center',
  });

  // Add a subtitle
  addTextElement(store, {
    text: 'Created Programmatically',
    x: store.width / 2,
    y: 100,
    fontSize: 18,
    fill: '#666666',
    fontFamily: 'Arial',
    align: 'center',
  });

  // Add an image (if you have a URL)
  // addImageElement(store, {
  //   src: 'https://example.com/image.jpg',
  //   x: store.width / 2,
  //   y: store.height / 2,
  // });

  return exportDesign(store);
}

/**
 * Example 4: Use a template with variable replacements
 */
export function exampleTemplateDesign(store, templateJson, cardData) {
  const variables = {
    text: {
      '{{name}}': cardData.name,
      '{{title}}': cardData.title,
      '{{email}}': cardData.email,
    },
    images: {
      0: cardData.avatarUrl, // Replace first image
    },
  };

  return createDesignFromTemplate(store, templateJson, variables);
}

/**
 * Example 5: Batch process multiple designs
 */
export function exampleBatchProcess(store, designJsons, processor) {
  const results = [];

  designJsons.forEach((json, index) => {
    // Load each design
    loadDesign(store, json);

    // Apply processor function
    processor(store, index);

    // Export modified design
    const modified = exportDesign(store);
    results.push(modified);
  });

  return results;
}

/**
 * Example 6: Find and modify specific elements
 */
export function exampleFindAndModify(store, designJson) {
  loadDesign(store, designJson);

  // Get all elements organized by type
  const elementsByType = getElementsByType(store);

  // Modify all text elements
  if (elementsByType.text) {
    elementsByType.text.forEach((element, index) => {
      updateTextElement(element, `Text ${index + 1}`, {
        fontSize: 20 + index * 2,
        fill: index % 2 === 0 ? '#000000' : '#FF0000',
      });
    });
  }

  // Modify all images
  if (elementsByType.image) {
    elementsByType.image.forEach((element, index) => {
      // You could update image sources, positions, sizes, etc.
      element.set({
        opacity: 0.8 + index * 0.1,
        rotation: index * 5,
      });
    });
  }

  return exportDesign(store);
}

/**
 * Example 7: Remove specific elements
 */
export function exampleRemoveElements(store, designJson) {
  loadDesign(store, designJson);

  // Find and remove all text elements containing "DELETE"
  const deleteElements = findTextElements(store, 'DELETE');
  deleteElements.forEach(element => {
    removeElement(element);
  });

  // Remove all images
  // removeElementsByType(store, 'image');

  return exportDesign(store);
}

/**
 * Example 8: Complete workflow - Load, modify, and save
 */
export async function exampleCompleteWorkflow(store, inputJson, modifications) {
  try {
    // 1. Load the design
    loadDesign(store, inputJson);

    // 2. Apply modifications
    if (modifications.text) {
      Object.entries(modifications.text).forEach(([search, replacement]) => {
        const elements = findTextElements(store, search);
        elements.forEach(element => {
          updateTextElement(element, replacement.text, replacement.style || {});
        });
      });
    }

    if (modifications.images) {
      Object.entries(modifications.images).forEach(([index, newSrc]) => {
        const images = findElementsByType(store, 'image');
        if (images[parseInt(index)]) {
          updateImageElement(images[parseInt(index)], newSrc);
        }
      });
    }

    if (modifications.addText) {
      modifications.addText.forEach(textConfig => {
        addTextElement(store, textConfig);
      });
    }

    if (modifications.addImages) {
      for (const imageConfig of modifications.addImages) {
        await addImageElement(store, imageConfig);
      }
    }

    // 3. Export the modified design
    const outputJson = exportDesign(store);

    return {
      success: true,
      design: outputJson,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Example usage in a React component or API endpoint:
/*
import { exampleCompleteWorkflow } from './utils/designEditor.example';

// In your component or API handler:
const result = await exampleCompleteWorkflow(store, designJson, {
  text: {
    '{{name}}': { text: 'John Doe', style: { fontSize: 32, fill: '#000' } },
    '{{title}}': { text: 'Software Engineer', style: { fontSize: 18 } },
  },
  images: {
    0: 'https://example.com/new-avatar.jpg',
  },
  addText: [
    { text: 'New Text', x: 100, y: 100, fontSize: 24 },
  ],
  addImages: [
    { src: 'https://example.com/image.jpg', x: 200, y: 200 },
  ],
});

if (result.success) {
  // Save or return the modified design
  console.log(result.design);
}
*/

