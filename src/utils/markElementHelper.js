/**
 * Helper functions for marking elements as changeable in the UI
 * These can be used in React components or called from the browser console
 */

/**
 * Mark the currently selected element as changeable
 * Call this function when an element is selected in the editor
 * 
 * @param {Object} store - The Polotno store instance
 * @param {string} variableName - The variable name (e.g., 'playerName', 'image')
 */
export function markSelectedElement(store, variableName) {
  const selectedElements = store.selectedElements;
  
  if (selectedElements.length === 0) {
    console.warn('No elements selected. Please select an element first.');
    return false;
  }

  if (selectedElements.length > 1) {
    console.warn('Multiple elements selected. Marking all as:', variableName);
  }

  selectedElements.forEach(element => {
    element.set({ name: `{{${variableName}}}` });
    console.log(`Marked element "${element.type}" as changeable: {{${variableName}}}`);
  });

  return true;
}

/**
 * Mark an element by ID as changeable
 * 
 * @param {Object} store - The Polotno store instance
 * @param {string} elementId - The element ID
 * @param {string} variableName - The variable name
 */
export function markElementById(store, elementId, variableName) {
  const page = store.activePage;
  if (!page) {
    console.error('No active page');
    return false;
  }

  const element = page.children.find(el => el.id === elementId);
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
    return false;
  }

  element.set({ name: `{{${variableName}}}` });
  console.log(`Marked element "${element.type}" (ID: ${elementId}) as changeable: {{${variableName}}}`);
  return true;
}

/**
 * Mark all text elements containing placeholder text as changeable
 * Useful for bulk marking elements that already have {{variableName}} in their text
 * 
 * @param {Object} store - The Polotno store instance
 */
export function markPlaceholderTextElements(store) {
  const page = store.activePage;
  if (!page) return { marked: 0, errors: [] };

  const textElements = page.children.filter(el => el.type === 'text');
  let marked = 0;
  const errors = [];

  textElements.forEach(element => {
    const text = element.text || '';
    const matches = text.match(/\{\{(\w+)\}\}/g);
    
    if (matches) {
      matches.forEach(match => {
        const variableName = match.replace(/[{}]/g, '');
        // Only mark if not already marked
        if (!element.name || !element.name.includes(variableName)) {
          element.set({ name: `{{${variableName}}}` });
          marked++;
          console.log(`Marked text element with placeholder "${match}"`);
        }
      });
    }
  });

  console.log(`Marked ${marked} element(s) as changeable`);
  return { marked, errors };
}

/**
 * List all changeable elements in the current design
 * Useful for debugging and verifying your template
 * 
 * @param {Object} store - The Polotno store instance
 */
export function listChangeableElements(store) {
  const page = store.activePage;
  if (!page) {
    console.log('No active page');
    return [];
  }

  const changeable = [];
  
  page.children.forEach(element => {
    const name = element.name || '';
    const match = name.match(/^\{\{(\w+)\}\}$/);
    
    if (match) {
      changeable.push({
        id: element.id,
        type: element.type,
        variableName: match[1],
        currentValue: element.type === 'text' ? element.text : element.src,
      });
    }
  });

  // Also check text elements with placeholder text
  page.children.forEach(element => {
    if (element.type === 'text') {
      const text = element.text || '';
      const matches = text.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        matches.forEach(match => {
          const variableName = match.replace(/[{}]/g, '');
          // Only add if not already in list
          if (!changeable.find(c => c.id === element.id && c.variableName === variableName)) {
            changeable.push({
              id: element.id,
              type: 'text',
              variableName,
              currentValue: text,
              isPlaceholder: true,
            });
          }
        });
      }
    }
  });

  if (changeable.length === 0) {
    console.log('No changeable elements found. Mark elements by setting their Name property to {{variableName}}');
  } else {
    console.log(`Found ${changeable.length} changeable element(s):`);
    changeable.forEach((item, index) => {
      console.log(`  ${index + 1}. {{${item.variableName}}} - ${item.type} (ID: ${item.id})`);
      if (item.type === 'text') {
        console.log(`     Current text: "${item.currentValue}"`);
      }
    });
  }

  return changeable;
}

/**
 * Clear changeable markers from all elements
 * Useful for resetting a template
 * 
 * @param {Object} store - The Polotno store instance
 */
export function clearChangeableMarkers(store) {
  const page = store.activePage;
  if (!page) return 0;

  let cleared = 0;
  
  page.children.forEach(element => {
    const name = element.name || '';
    if (name.match(/^\{\{(\w+)\}\}$/)) {
      element.set({ name: '' });
      cleared++;
    }
  });

  console.log(`Cleared ${cleared} changeable marker(s)`);
  return cleared;
}

/**
 * Make functions available globally for console access
 * Call this to enable console commands like:
 * - markSelected('playerName')
 * - listChangeable()
 * - markPlaceholders()
 */
export function enableConsoleHelpers(store) {
  if (typeof window !== 'undefined') {
    window.markSelected = (variableName) => markSelectedElement(store, variableName);
    window.markElement = (elementId, variableName) => markElementById(store, elementId, variableName);
    window.markPlaceholders = () => markPlaceholderTextElements(store);
    window.listChangeable = () => listChangeableElements(store);
    window.clearMarkers = () => clearChangeableMarkers(store);
    
    console.log(`
Batch Processor Console Helpers Enabled:
  - markSelected('variableName') - Mark selected element(s) as changeable
  - markElement('elementId', 'variableName') - Mark element by ID
  - markPlaceholders() - Auto-mark text elements with {{placeholder}} text
  - listChangeable() - List all changeable elements
  - clearMarkers() - Clear all changeable markers
    `);
  }
}

