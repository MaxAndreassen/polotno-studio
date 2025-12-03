/**
 * Utility functions for programmatically editing Polotno designs
 * 
 * This module provides helper functions to:
 * - Load designs from JSON
 * - Find and modify elements
 * - Add new elements
 * - Remove elements
 * - Export modified designs
 */

/**
 * Load a design from JSON into the store
 * @param {Object} store - The Polotno store instance
 * @param {Object|string} json - The design JSON object or JSON string
 * @returns {Object} The loaded design JSON
 */
export function loadDesign(store, json) {
  // If json is a string, parse it
  if (typeof json === 'string') {
    json = JSON.parse(json);
  }

  // Validate the JSON
  const errors = store.validate(json);
  if (errors.length > 0) {
    throw new Error(`Invalid design JSON: ${errors.join(', ')}`);
  }

  // Load the design
  store.loadJSON(json);

  // Ensure only one page for trading card editor
  while (store.pages.length > 1) {
    store.pages[store.pages.length - 1].remove();
  }

  // Ensure we have an active page
  if (store.pages.length > 0 && !store.activePage) {
    store.setActivePage(store.pages[0]);
  }

  return json;
}

/**
 * Export the current design as JSON
 * @param {Object} store - The Polotno store instance
 * @returns {Object} The design JSON
 */
export function exportDesign(store) {
  return store.toJSON();
}

/**
 * Find elements by type
 * @param {Object} store - The Polotno store instance
 * @param {string} type - Element type ('text', 'image', 'svg', etc.)
 * @returns {Array} Array of matching elements
 */
export function findElementsByType(store, type) {
  const page = store.activePage;
  if (!page) return [];
  
  return page.children.filter(element => element.type === type);
}

/**
 * Find elements by a property value
 * @param {Object} store - The Polotno store instance
 * @param {string} property - Property name to search
 * @param {*} value - Value to match
 * @returns {Array} Array of matching elements
 */
export function findElementsByProperty(store, property, value) {
  const page = store.activePage;
  if (!page) return [];
  
  return page.children.filter(element => element[property] === value);
}

/**
 * Find text elements containing specific text
 * @param {Object} store - The Polotno store instance
 * @param {string} searchText - Text to search for
 * @returns {Array} Array of matching text elements
 */
export function findTextElements(store, searchText) {
  const textElements = findElementsByType(store, 'text');
  if (!searchText) return textElements;
  
  return textElements.filter(element => 
    element.text && element.text.includes(searchText)
  );
}

/**
 * Update a text element's content
 * @param {Object} element - The text element to update
 * @param {string} newText - New text content
 * @param {Object} options - Additional options (fontSize, color, etc.)
 */
export function updateTextElement(element, newText, options = {}) {
  if (element.type !== 'text') {
    throw new Error('Element is not a text element');
  }

  element.set({
    text: newText,
    ...options
  });
}

/**
 * Update an image element's source
 * @param {Object} element - The image element to update
 * @param {string} newSrc - New image source URL
 * @param {Object} options - Additional options (width, height, x, y, etc.)
 */
export function updateImageElement(element, newSrc, options = {}) {
  if (element.type !== 'image') {
    throw new Error('Element is not an image element');
  }

  element.set({
    src: newSrc,
    ...options
  });
}

/**
 * Update element position
 * @param {Object} element - The element to move
 * @param {number} x - New x position
 * @param {number} y - New y position
 */
export function moveElement(element, x, y) {
  element.set({ x, y });
}

/**
 * Update element size
 * @param {Object} element - The element to resize
 * @param {number} width - New width
 * @param {number} height - New height
 */
export function resizeElement(element, width, height) {
  element.set({ width, height });
}

/**
 * Update element rotation
 * @param {Object} element - The element to rotate
 * @param {number} rotation - Rotation angle in degrees
 */
export function rotateElement(element, rotation) {
  element.set({ rotation });
}

/**
 * Add a text element to the canvas
 * @param {Object} store - The Polotno store instance
 * @param {Object} options - Text element options
 * @param {string} options.text - Text content
 * @param {number} options.x - X position
 * @param {number} options.y - Y position
 * @param {number} options.fontSize - Font size
 * @param {string} options.fontFamily - Font family
 * @param {string} options.fill - Text color
 * @returns {Object} The created text element
 */
export function addTextElement(store, options = {}) {
  const {
    text = 'New Text',
    x = store.width / 2,
    y = store.height / 2,
    fontSize = 24,
    fontFamily = 'Arial',
    fill = '#000000',
    ...rest
  } = options;

  const element = store.activePage.addElement({
    type: 'text',
    text,
    x,
    y,
    fontSize,
    fontFamily,
    fill,
    ...rest
  });

  return element;
}

/**
 * Add an image element to the canvas
 * @param {Object} store - The Polotno store instance
 * @param {Object} options - Image element options
 * @param {string} options.src - Image source URL
 * @param {number} options.x - X position
 * @param {number} options.y - Y position
 * @param {number} options.width - Image width
 * @param {number} options.height - Image height
 * @returns {Promise<Object>} Promise that resolves to the created image element
 */
export async function addImageElement(store, options = {}) {
  const {
    src,
    x = store.width / 2,
    y = store.height / 2,
    width,
    height,
    ...rest
  } = options;

  if (!src) {
    throw new Error('Image source (src) is required');
  }

  // If width/height not provided, load image to get dimensions
  let imgWidth = width;
  let imgHeight = height;

  if (!imgWidth || !imgHeight) {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });
    
    if (!imgWidth) imgWidth = img.width;
    if (!imgHeight) imgHeight = img.height;
    
    // Scale to fit canvas if too large
    const scale = Math.min(1, store.width / imgWidth, store.height / imgHeight);
    imgWidth = imgWidth * scale;
    imgHeight = imgHeight * scale;
  }

  const element = store.activePage.addElement({
    type: 'image',
    src,
    x: x - imgWidth / 2,
    y: y - imgHeight / 2,
    width: imgWidth,
    height: imgHeight,
    ...rest
  });

  return element;
}

/**
 * Remove an element from the canvas
 * @param {Object} element - The element to remove
 */
export function removeElement(element) {
  element.remove();
}

/**
 * Remove all elements of a specific type
 * @param {Object} store - The Polotno store instance
 * @param {string} type - Element type to remove
 */
export function removeElementsByType(store, type) {
  const elements = findElementsByType(store, type);
  elements.forEach(element => element.remove());
}

/**
 * Clear all elements from the canvas
 * @param {Object} store - The Polotno store instance
 */
export function clearCanvas(store) {
  const page = store.activePage;
  if (!page) return;
  
  // Create a copy of the array since we're modifying it
  const elements = [...page.children];
  elements.forEach(element => element.remove());
}

/**
 * Duplicate an element
 * @param {Object} element - The element to duplicate
 * @param {Object} offset - Optional offset for the duplicate (x, y)
 * @returns {Object} The duplicated element
 */
export function duplicateElement(element, offset = { x: 10, y: 10 }) {
  const json = element.toJSON();
  const page = element.parent;
  
  const newElement = page.addElement({
    ...json,
    x: element.x + offset.x,
    y: element.y + offset.y,
  });

  return newElement;
}

/**
 * Batch update multiple elements
 * @param {Array} elements - Array of elements to update
 * @param {Object} updates - Properties to update on all elements
 */
export function batchUpdateElements(elements, updates) {
  elements.forEach(element => {
    element.set(updates);
  });
}

/**
 * Create a new design from a template JSON with variable replacements
 * @param {Object} store - The Polotno store instance
 * @param {Object|string} templateJson - Template design JSON
 * @param {Object} variables - Object with variable replacements
 * @param {Object} variables.text - Object mapping text search strings to replacements
 * @param {Object} variables.images - Object mapping image element IDs or indices to new sources
 * @returns {Object} The modified design JSON
 */
export function createDesignFromTemplate(store, templateJson, variables = {}) {
  // Load the template
  loadDesign(store, templateJson);

  const { text = {}, images = {} } = variables;

  // Replace text elements
  Object.entries(text).forEach(([searchText, newText]) => {
    const elements = findTextElements(store, searchText);
    elements.forEach(element => {
      updateTextElement(element, newText);
    });
  });

  // Replace images
  const imageElements = findElementsByType(store, 'image');
  Object.entries(images).forEach(([key, newSrc]) => {
    const index = parseInt(key);
    if (!isNaN(index) && imageElements[index]) {
      updateImageElement(imageElements[index], newSrc);
    } else {
      // Try to find by ID or other property
      const element = imageElements.find(el => el.id === key);
      if (element) {
        updateImageElement(element, newSrc);
      }
    }
  });

  return exportDesign(store);
}

/**
 * Get all elements as a structured object for easier manipulation
 * @param {Object} store - The Polotno store instance
 * @returns {Object} Object with arrays of elements by type
 */
export function getElementsByType(store) {
  const page = store.activePage;
  if (!page) return {};

  const result = {};
  page.children.forEach(element => {
    if (!result[element.type]) {
      result[element.type] = [];
    }
    result[element.type].push(element);
  });

  return result;
}

