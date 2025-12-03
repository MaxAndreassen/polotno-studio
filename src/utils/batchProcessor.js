/**
 * Batch Processing Utilities for Trading Card Templates
 * 
 * This module allows you to:
 * - Mark elements in a template as changeable using variable names
 * - Generate multiple card versions from a template with different data
 * - Export batches of designs
 */

import {
  loadDesign,
  exportDesign,
  findTextElements,
  findElementsByType,
  updateTextElement,
  updateImageElement,
  findElementsByProperty,
  removeElement,
} from './designEditor';

/**
 * Mark an element as changeable by setting its name property
 * This should be done in the UI by setting the element's "name" field
 * Use format: {{variableName}} or just variableName
 * 
 * @param {Object} element - The element to mark
 * @param {string} variableName - The variable name (e.g., 'name', 'title', 'image')
 */
export function markElementAsChangeable(element, variableName) {
  element.set({ name: `{{${variableName}}}` });
}

/**
 * Find all changeable elements in the current design
 * Looks for elements with names in format {{variableName}}
 * 
 * @param {Object} store - The Polotno store instance
 * @returns {Object} Object mapping variable names to arrays of elements
 */
export function findChangeableElements(store) {
  const page = store.activePage;
  if (!page) return {};

  const changeableElements = {};

  // Check all elements for names matching {{variableName}} pattern
  page.children.forEach(element => {
    const name = element.name || '';
    const match = name.match(/^\{\{(\w+)\}\}$/);
    if (match) {
      const variableName = match[1];
      if (!changeableElements[variableName]) {
        changeableElements[variableName] = [];
      }
      changeableElements[variableName].push(element);
    }
  });

  // Also check text elements for placeholder text like {{variableName}}
  const textElements = findElementsByType(store, 'text');
  textElements.forEach(element => {
    const text = element.text || '';
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (matches) {
      matches.forEach(match => {
        const variableName = match.replace(/[{}]/g, '');
        if (!changeableElements[variableName]) {
          changeableElements[variableName] = [];
        }
        // Only add if not already added by name property
        if (!changeableElements[variableName].includes(element)) {
          changeableElements[variableName].push({
            ...element,
            _isTextPlaceholder: true,
            _placeholderText: match,
          });
        }
      });
    }
  });

  return changeableElements;
}

/**
 * Apply data to a template design
 * Replaces all changeable elements with values from the data object
 * 
 * @param {Object} store - The Polotno store instance
 * @param {Object} data - Data object with values for variables
 * @param {Object} options - Processing options
 * @param {Function} options.onProgress - Optional progress callback (index, total)
 * @returns {Object} The modified design JSON
 */
export function applyTemplateData(store, data, options = {}) {
  const { onProgress } = options;
  const changeableElements = findChangeableElements(store);
  const page = store.activePage;
  
  // Collect figure elements that need to be replaced with images
  const figuresToReplace = [];

  // Process each variable
  Object.entries(changeableElements).forEach(([variableName, elements]) => {
    const value = data[variableName];

    // Skip if value is not provided
    if (value === undefined || value === null) {
      return;
    }

    elements.forEach(element => {
      // Handle text placeholders within text content
      if (element._isTextPlaceholder) {
        const newText = element.text.replace(
          element._placeholderText,
          String(value)
        );
        updateTextElement(element, newText);
      }
      // Handle elements marked by name property
      else if (element.type === 'text') {
        updateTextElement(element, String(value));
      }
      // Handle image elements - skip if value is empty (keep original image)
      else if (element.type === 'image' && typeof value === 'string') {
        // Only update if value is not empty - empty string means keep original
        if (value.trim() !== '') {
          updateImageElement(element, value);
        }
        // If empty, skip update to keep the original image from the template
      }
      // Handle image elements with object data (src, width, height, etc.)
      else if (element.type === 'image' && typeof value === 'object') {
        // Only update if src/url is provided and not empty
        const imageSrc = value.src || value.url;
        if (imageSrc && imageSrc.trim() !== '') {
          updateImageElement(element, imageSrc, value);
        }
        // If empty, skip update to keep the original image from the template
      }
      // Handle figure elements - collect for replacement after iteration
      // Skip if value is empty (keep original figure)
      else if (element.type === 'figure' && typeof value === 'string') {
        // Only replace if value is not empty
        if (value.trim() !== '') {
          figuresToReplace.push({
            elementId: element.id,
            value: value,
            options: { x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation }
          });
        }
        // If empty, skip replacement to keep the original figure from the template
      }
      // Handle figure elements with object data
      else if (element.type === 'figure' && typeof value === 'object') {
        const imageSrc = value.src || value.url;
        // Only replace if src/url is provided and not empty
        if (imageSrc && imageSrc.trim() !== '') {
          figuresToReplace.push({
            elementId: element.id,
            value: imageSrc,
            options: {
              x: element.x,
              y: element.y,
              width: value.width || element.width,
              height: value.height || element.height,
              rotation: value.rotation || element.rotation,
              ...value
            }
          });
        }
        // If empty, skip replacement to keep the original figure from the template
      }
      // Handle svg elements (can also accept image data)
      // Skip if value is empty (keep original svg)
      else if (element.type === 'svg' && typeof value === 'string') {
        // Only update if value is not empty
        if (value.trim() !== '') {
          element.set({ src: value });
        }
        // If empty, skip update to keep the original svg from the template
      }
      // Handle other element types - try to set the value as a property
      else {
        element.set({ [variableName]: value });
      }
    });
  });

  // Now replace figure elements with images
  if (page && figuresToReplace.length > 0) {
    figuresToReplace.forEach(({ elementId, value, options }) => {
      // Get fresh reference to the element from the page
      const actualElement = page.children.find(el => el.id === elementId);
      if (actualElement) {
        const { x, y, width, height, rotation } = actualElement;
        
        // Try to remove the element using various methods
        let removed = false;
        try {
          // Method 1: Try element.remove() if it exists
          if (actualElement.remove && typeof actualElement.remove === 'function') {
            actualElement.remove();
            removed = true;
          }
        } catch (e) {
          // Method 2: Try removing via parent page
          try {
            if (actualElement.parent && actualElement.parent.remove) {
              actualElement.parent.remove(actualElement);
              removed = true;
            }
          } catch (e2) {
            // Method 3: Direct array manipulation as last resort
            try {
              const index = page.children.indexOf(actualElement);
              if (index !== -1) {
                page.children.splice(index, 1);
                removed = true;
              }
            } catch (e3) {
              console.warn('Could not remove figure element:', e3);
            }
          }
        }
        
        // Add the image element
        page.addElement({
          type: 'image',
          src: value,
          x: options.x || x,
          y: options.y || y,
          width: options.width || width,
          height: options.height || height,
          rotation: options.rotation || rotation,
        });
      }
    });
  }

  return exportDesign(store);
}

/**
 * Generate multiple card designs from a template
 * 
 * @param {Object} store - The Polotno store instance
 * @param {Object|string} templateJson - The template design JSON
 * @param {Array<Object>} dataArray - Array of data objects, one per card
 * @param {Object} options - Processing options
 * @param {Function} options.onProgress - Optional progress callback (index, total, currentData)
 * @param {Function} options.onError - Optional error handler (error, index, data)
 * @param {boolean} options.keepTemplateLoaded - Keep template loaded after processing (default: false)
 * @returns {Array<Object>} Array of generated design JSONs
 */
export function generateBatch(
  store,
  templateJson,
  dataArray,
  options = {}
) {
  const {
    onProgress,
    onError,
    keepTemplateLoaded = false,
  } = options;

  const results = [];
  const errors = [];

  // Load the template once
  loadDesign(store, templateJson);

  // Process each data object
  dataArray.forEach((data, index) => {
    try {
      // Reload template for each iteration (except first)
      if (index > 0) {
        loadDesign(store, templateJson);
      }

      // Apply data to template
      const design = applyTemplateData(store, data, { onProgress });

      results.push({
        index,
        data,
        design,
        success: true,
      });

      // Call progress callback
      if (onProgress) {
        onProgress(index + 1, dataArray.length, data);
      }
    } catch (error) {
      const errorInfo = {
        index,
        data,
        error: error.message || String(error),
        success: false,
      };
      errors.push(errorInfo);

      if (onError) {
        onError(error, index, data);
      } else {
        console.error(`Error processing card ${index + 1}:`, error);
      }
    }
  });

  // Keep template loaded if requested, otherwise clear
  if (!keepTemplateLoaded) {
    // Optionally clear the canvas
    // clearCanvas(store);
  }

  return {
    results,
    errors,
    total: dataArray.length,
    successful: results.length,
    failed: errors.length,
  };
}

/**
 * Generate a single card design from template and data
 * Convenience function for single card generation
 * 
 * @param {Object} store - The Polotno store instance
 * @param {Object|string} templateJson - The template design JSON
 * @param {Object} data - Data object for the card
 * @returns {Object} The generated design JSON
 */
export function generateCard(store, templateJson, data) {
  loadDesign(store, templateJson);
  return applyTemplateData(store, data);
}

/**
 * Preview what variables are available in a template
 * Useful for validating templates before batch processing
 * 
 * @param {Object} store - The Polotno store instance
 * @param {Object|string} templateJson - The template design JSON
 * @returns {Object} Object with variable information
 */
export function previewTemplateVariables(store, templateJson) {
  // Only load if the JSON is different from current store state
  // This prevents unnecessary reloading when checking the current design
  const currentJson = store.toJSON();
  const jsonString = JSON.stringify(templateJson);
  const currentJsonString = JSON.stringify(currentJson);
  
  if (jsonString !== currentJsonString) {
    loadDesign(store, templateJson);
  }
  
  // Ensure we have an active page
  if (!store.activePage) {
    console.warn('No active page found in store after loading');
    console.warn('Store pages:', store.pages?.length || 0);
    return {
      variables: {},
      variableNames: [],
      totalChangeableElements: 0,
    };
  }
  
  const changeableElements = findChangeableElements(store);
  console.log('Found changeable elements:', changeableElements); // Debug log

  const variables = {};
  Object.entries(changeableElements).forEach(([variableName, elements]) => {
    const elementTypes = elements.map(el => {
      // Check if it's a text placeholder
      if (el._isTextPlaceholder) return 'text';
      return el.type;
    });
    
    // Determine if this variable is for images or text
    const hasImage = elements.some(el => {
      if (el._isTextPlaceholder) return false;
      return el.type === 'image' || el.type === 'svg' || el.type === 'figure';
    });
    const hasText = elements.some(el => {
      if (el._isTextPlaceholder) return true;
      return el.type === 'text';
    });
    
    // Determine primary type: if it has any image elements, it's an image variable
    const primaryType = hasImage ? 'image' : 'text';
    
    variables[variableName] = {
      count: elements.length,
      types: [...new Set(elementTypes)],
      primaryType, // 'text' or 'image'
      hasImage,
      hasText,
      elements: elements.map(el => ({
        id: el.id,
        type: el._isTextPlaceholder ? 'text' : el.type,
        currentValue: el.type === 'text' ? el.text : el.src,
      })),
    };
  });

  return {
    variables,
    variableNames: Object.keys(variables),
    totalChangeableElements: Object.values(changeableElements).flat().length,
  };
}

/**
 * Validate data against template variables
 * Checks if all required variables are provided
 * 
 * @param {Object} store - The Polotno store instance
 * @param {Object|string} templateJson - The template design JSON
 * @param {Object} data - Data object to validate
 * @returns {Object} Validation result
 */
export function validateTemplateData(store, templateJson, data) {
  const preview = previewTemplateVariables(store, templateJson);
  const missing = preview.variableNames.filter(
    name => data[name] === undefined || data[name] === null
  );

  return {
    valid: missing.length === 0,
    missing,
    provided: Object.keys(data),
    required: preview.variableNames,
  };
}

/**
 * Generate batch with validation
 * Validates each data object before processing
 * 
 * @param {Object} store - The Polotno store instance
 * @param {Object|string} templateJson - The template design JSON
 * @param {Array<Object>} dataArray - Array of data objects
 * @param {Object} options - Processing options
 * @param {boolean} options.strict - If true, skip invalid data (default: false)
 * @returns {Object} Batch generation result
 */
export function generateBatchWithValidation(
  store,
  templateJson,
  dataArray,
  options = {}
) {
  const { strict = false, ...otherOptions } = options;

  // Validate all data first
  const validated = dataArray.map((data, index) => {
    const validation = validateTemplateData(store, templateJson, data);
    return {
      index,
      data,
      validation,
      shouldProcess: strict ? validation.valid : true,
    };
  });

  // Filter out invalid data if strict mode
  const validData = strict
    ? validated.filter(item => item.shouldProcess).map(item => item.data)
    : dataArray;

  // Generate batch
  const result = generateBatch(store, templateJson, validData, otherOptions);

  return {
    ...result,
    validation: validated,
    skipped: strict ? validated.filter(item => !item.shouldProcess) : [],
  };
}

