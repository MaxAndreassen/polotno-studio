import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  InputGroup,
  HTMLTable,
  Spinner,
  Icon,
} from '@blueprintjs/core';
import { Trash, Download, Plus, EyeOn, EyeOff } from '@blueprintjs/icons';
import { SectionTab } from 'polotno/side-panel';
import { previewTemplateVariables, generateCard } from '../utils/batchProcessor';
import { useProject } from '../project';

const VersionsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  </svg>
);

// Local storage key for version data
const getStorageKey = (designId) => `design-versions-${designId}`;

// Load versions from localStorage
const loadVersions = (designId) => {
  try {
    const stored = localStorage.getItem(getStorageKey(designId));
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading versions:', e);
    return [];
  }
};

// Save versions to localStorage
const saveVersions = (designId, versions) => {
  try {
    localStorage.setItem(getStorageKey(designId), JSON.stringify(versions));
  } catch (e) {
    console.error('Error saving versions:', e);
  }
};

const VersionsPanel = observer(({ store }) => {
  const project = useProject();
  const [variables, setVariables] = React.useState([]);
  const [variableTypes, setVariableTypes] = React.useState({});
  const [versions, setVersions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [downloading, setDownloading] = React.useState({});
  const [designId, setDesignId] = React.useState(null);
  const [previewIndex, setPreviewIndex] = React.useState(null);
  const [originalDesign, setOriginalDesign] = React.useState(null);
  const fileInputRefs = React.useRef({});

  // Get current design ID from project or create a hash
  const getCurrentDesignId = () => {
    // Use project ID if available
    if (project?.id) {
      return project.id;
    }
    // Fallback: create a simple hash from the design JSON
    const json = store.toJSON();
    const jsonString = JSON.stringify(json);
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `design-${Math.abs(hash)}`;
  };

  // Load template variables when store or project changes
  React.useEffect(() => {
    const currentId = getCurrentDesignId();
    setDesignId(currentId);

    try {
      // Check if store has pages before trying to get JSON
      if (!store.pages || store.pages.length === 0) {
        console.log('Store has no pages yet');
        setVariables([]);
        setVariableTypes({});
        return;
      }

      const currentJson = store.toJSON();
      if (!currentJson || !currentJson.pages || currentJson.pages.length === 0) {
        console.log('Store JSON has no pages');
        setVariables([]);
        setVariableTypes({});
        return;
      }

      const preview = previewTemplateVariables(store, currentJson);
      const varNames = preview.variableNames || [];
      
      console.log('Preview result:', preview); // Debug log
      console.log('Variable names:', varNames); // Debug log
      console.log('Changeable elements:', preview.variables); // Debug log
      
      setVariables(varNames);
      
      // Store variable types for easy lookup
      const types = {};
      varNames.forEach(name => {
        types[name] = preview.variables[name]?.primaryType || 'text';
      });
      setVariableTypes(types);
    } catch (e) {
      console.error('Error loading template variables:', e);
      console.error('Error stack:', e.stack); // More detailed error
      setVariables([]);
      setVariableTypes({});
    }

    // Load saved versions and ensure they have _name field for backward compatibility
    const savedVersions = loadVersions(currentId);
    const versionsWithNames = savedVersions.map((version, index) => {
      if (!version._name) {
        return { ...version, _name: `Version ${index + 1}` };
      }
      return version;
    });
    setVersions(versionsWithNames);
  }, [store, project?.id]);

  // Restore original design when component unmounts or preview is cancelled
  React.useEffect(() => {
    return () => {
      // Cleanup: restore original design if we're in preview mode
      if (previewIndex !== null && originalDesign) {
        try {
          store.loadJSON(originalDesign);
        } catch (e) {
          console.error('Error restoring design on unmount:', e);
        }
      }
    };
  }, [previewIndex, originalDesign, store]);

  // Save versions whenever they change
  React.useEffect(() => {
    if (designId && versions.length > 0) {
      saveVersions(designId, versions);
    }
  }, [versions, designId]);

  const addVersion = () => {
    const newVersion = {
      _name: `Version ${versions.length + 1}`,
    };
    variables.forEach((variable) => {
      newVersion[variable] = '';
    });
    setVersions([...versions, newVersion]);
  };

  const deleteVersion = (index) => {
    setVersions(versions.filter((_, i) => i !== index));
  };

  const updateVersion = (index, variable, value) => {
    const updated = [...versions];
    updated[index] = { ...updated[index], [variable]: value };
    setVersions(updated);
  };

  const updateVersionName = (index, name) => {
    const updated = [...versions];
    updated[index] = { ...updated[index], _name: name };
    setVersions(updated);
  };

  // Helper function to sanitize filename
  const sanitizeFilename = (name) => {
    if (!name) return '';
    return name
      .replace(/[^a-z0-9-_\s]/gi, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  };

  const handleImageUpload = (index, variable, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      updateVersion(index, variable, dataUrl);
    };
    reader.onerror = () => {
      alert('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const downloadVersion = async (index) => {
    const versionData = versions[index];
    setDownloading({ ...downloading, [index]: true });

    try {
      // Save current design state
      const currentDesign = store.toJSON();

      // Get current template JSON
      const templateJson = store.toJSON();

      // Generate card with version data
      generateCard(store, templateJson, versionData);

      // Generate filename from version name or fallback to version data
      let filename;
      if (versionData._name && versionData._name.trim()) {
        filename = sanitizeFilename(versionData._name) || `version-${index + 1}`;
      } else {
        filename = Object.entries(versionData)
          .filter(([key, value]) => key !== '_name' && value)
          .slice(0, 3)
          .map(([key, value]) => value)
          .join('-')
          .replace(/[^a-z0-9-]/gi, '-')
          .toLowerCase() || `version-${index + 1}`;
      }

      // Download as PNG image (same as topbar download button)
      await store.saveAsImage({
        pageId: store.activePage.id,
        pixelRatio: 1,
        mimeType: 'image/png',
        fileName: `${filename}.png`,
      });

      // Restore original design
      store.loadJSON(currentDesign);
    } catch (error) {
      console.error('Error downloading version:', error);
      alert('Failed to download version. Please try again.');
    } finally {
      setDownloading({ ...downloading, [index]: false });
    }
  };

  const downloadAll = async () => {
    setLoading(true);
    try {
      // Save current design state
      const currentDesign = store.toJSON();
      const templateJson = store.toJSON();

      // Get page dimensions
      const pageWidth = store.activePage.width;
      const pageHeight = store.activePage.height;

      // Calculate grid dimensions (aim for roughly square grid)
      const numVersions = versions.length;
      const cols = Math.ceil(Math.sqrt(numVersions));
      const rows = Math.ceil(numVersions / cols);

      // Spacing between cards in the grid
      const padding = 20;
      const cardWidth = pageWidth;
      const cardHeight = pageHeight;

      // Create combined canvas
      const combinedCanvas = document.createElement('canvas');
      combinedCanvas.width = cols * cardWidth + (cols + 1) * padding;
      combinedCanvas.height = rows * cardHeight + (rows + 1) * padding;
      const ctx = combinedCanvas.getContext('2d');

      // Fill background with white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

      // Generate each version and draw to grid
      const versionCanvases = [];
      for (let i = 0; i < versions.length; i++) {
        const versionData = versions[i];
        try {
          // Generate card with version data
          generateCard(store, templateJson, versionData);

          // Render to canvas
          const versionCanvas = await store._toCanvas({
            pageId: store.activePage.id,
            pixelRatio: 1,
          });

          versionCanvases.push(versionCanvas);
        } catch (error) {
          console.error(`Error generating version ${i + 1}:`, error);
          // Create a blank canvas as placeholder
          const blankCanvas = document.createElement('canvas');
          blankCanvas.width = cardWidth;
          blankCanvas.height = cardHeight;
          const blankCtx = blankCanvas.getContext('2d');
          blankCtx.fillStyle = '#f0f0f0';
          blankCtx.fillRect(0, 0, cardWidth, cardHeight);
          versionCanvases.push(blankCanvas);
        }
      }

      // Draw all versions onto the combined canvas in grid layout
      for (let i = 0; i < versionCanvases.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = padding + col * (cardWidth + padding);
        const y = padding + row * (cardHeight + padding);

        ctx.drawImage(versionCanvases[i], x, y, cardWidth, cardHeight);
      }

      // Download the combined canvas
      combinedCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'all-versions.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');

      // Restore original design
      store.loadJSON(currentDesign);
    } catch (error) {
      console.error('Error downloading all versions:', error);
      alert('Failed to download versions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const previewVersion = (index) => {
    const versionData = versions[index];
    
    // Check if all required variables are filled (exclude _name field)
    const missingVars = variables.filter(v => !versionData[v] || versionData[v] === '');
    if (missingVars.length > 0) {
      alert(`Please fill in all variables before previewing. Missing: ${missingVars.join(', ')}`);
      return;
    }

    try {
      // If already previewing, restore original first
      if (previewIndex !== null && originalDesign) {
        store.loadJSON(originalDesign);
      }

      // If previewing the same version, exit preview
      if (previewIndex === index) {
        exitPreview();
        return;
      }

      // Save current design state (original design)
      const currentDesign = store.toJSON();
      setOriginalDesign(currentDesign);
      setPreviewIndex(index);

      // Get template JSON
      const templateJson = currentDesign;

      // Generate card with version data
      generateCard(store, templateJson, versionData);
    } catch (error) {
      console.error('Error previewing version:', error);
      alert('Failed to preview version. Please try again.');
      // Restore original if preview failed
      if (originalDesign) {
        store.loadJSON(originalDesign);
        setPreviewIndex(null);
        setOriginalDesign(null);
      }
    }
  };

  const exitPreview = () => {
    if (previewIndex !== null && originalDesign) {
      try {
        store.loadJSON(originalDesign);
        setPreviewIndex(null);
        setOriginalDesign(null);
      } catch (error) {
        console.error('Error exiting preview:', error);
        alert('Failed to restore original design.');
      }
    }
  };

  if (variables.length === 0) {
    return (
      <div style={{ padding: '15px' }}>
        <h3 style={{ marginBottom: '10px', marginTop: '5px' }}>
          Design Versions
        </h3>
        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
          No changeable variables found in this design.
        </p>
        <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '10px' }}>
          Mark elements as changeable by setting their Name property to{' '}
          <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '2px' }}>
            {'{{variableName}}'}
          </code>
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
      }}
    >
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ marginBottom: '10px', marginTop: '5px' }}>
          Design Versions
        </h3>
        {previewIndex !== null && (
          <div
            style={{
              padding: '8px 12px',
              marginBottom: '10px',
              backgroundColor: 'rgba(19, 124, 189, 0.2)',
              border: '1px solid rgba(19, 124, 189, 0.4)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: '#5C9BD1' }}>
              <EyeOn style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Previewing {versions[previewIndex]?._name || `version ${previewIndex + 1}`} - Design is read-only
            </span>
            <Button
              small
              minimal
              icon={<EyeOff />}
              onClick={exitPreview}
              text="Exit Preview"
            />
          </div>
        )}
        <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '10px' }}>
          Manage different versions of your design by filling in the variable
          values below.
        </p>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          <Button
            icon={<Plus />}
            text="Add Version"
            onClick={addVersion}
            small
            intent="primary"
          />
          {versions.length > 0 && (
            <Button
              icon={<Download />}
              text="Download All"
              onClick={downloadAll}
              small
              loading={loading}
              disabled={loading}
            />
          )}
        </div>
      </div>

      {versions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '30px 15px',
            opacity: 0.6,
          }}
        >
          <p>No versions yet.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>
            Click "Add Version" to create your first version.
          </p>
        </div>
      ) : (
        <div
          style={{
            overflow: 'auto',
            flex: 1,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
          }}
        >
          <HTMLTable
            striped
            style={{
              width: '100%',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: '8px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                {variables.map((variable) => (
                  <th
                    key={variable}
                    style={{ padding: '8px', textAlign: 'left' }}
                  >
                    {variable}
                  </th>
                ))}
                <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version, index) => (
                <tr key={index}>
                  <td style={{ padding: '8px' }}>{index + 1}</td>
                  <td style={{ padding: '4px' }}>
                    <InputGroup
                      value={version._name || `Version ${index + 1}`}
                      onChange={(e) => updateVersionName(index, e.target.value)}
                      placeholder={`Version ${index + 1}`}
                      small
                      style={{ minWidth: '120px' }}
                    />
                  </td>
                  {variables.map((variable) => (
                    <td key={variable} style={{ padding: '4px' }}>
                      {variableTypes[variable] === 'image' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            ref={(el) => {
                              if (el) {
                                fileInputRefs.current[`${index}-${variable}`] = el;
                              }
                            }}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleImageUpload(index, variable, file);
                              }
                              // Reset input so same file can be selected again
                              e.target.value = '';
                            }}
                          />
                          {version[variable] ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <img
                                src={version[variable]}
                                alt="Preview"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '2px',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                }}
                              />
                              <Button
                                small
                                minimal
                                onClick={() => {
                                  fileInputRefs.current[`${index}-${variable}`]?.click();
                                }}
                                style={{ flex: 1 }}
                              >
                                Change
                              </Button>
                              <Button
                                icon={<Trash />}
                                small
                                minimal
                                onClick={() => updateVersion(index, variable, '')}
                                intent="danger"
                              />
                            </div>
                          ) : (
                            <Button
                              small
                              fill
                              onClick={() => {
                                fileInputRefs.current[`${index}-${variable}`]?.click();
                              }}
                            >
                              Upload Image
                            </Button>
                          )}
                        </div>
                      ) : (
                        <InputGroup
                          value={version[variable] || ''}
                          onChange={(e) =>
                            updateVersion(index, variable, e.target.value)
                          }
                          placeholder={`{{${variable}}}`}
                          small
                          style={{ minWidth: '120px' }}
                        />
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '4px', textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '5px',
                        justifyContent: 'center',
                      }}
                    >
                      <Button
                        icon={previewIndex === index ? <EyeOff /> : <EyeOn />}
                        onClick={() => previewVersion(index)}
                        small
                        minimal
                        intent={previewIndex === index ? 'primary' : undefined}
                        active={previewIndex === index}
                        title={previewIndex === index ? 'Exit preview' : 'Preview this version'}
                      />
                      <Button
                        icon={<Download />}
                        onClick={() => downloadVersion(index)}
                        small
                        minimal
                        loading={downloading[index]}
                        disabled={downloading[index] || previewIndex === index}
                        title="Download this version"
                      />
                      <Button
                        icon={<Trash />}
                        onClick={() => {
                          if (
                            window.confirm(
                              'Are you sure you want to delete this version?'
                            )
                          ) {
                            // Exit preview if deleting the previewed version
                            if (previewIndex === index) {
                              exitPreview();
                            }
                            deleteVersion(index);
                          }
                        }}
                        small
                        minimal
                        intent="danger"
                        disabled={previewIndex === index}
                        title="Delete this version"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </div>
      )}
    </div>
  );
});

// Define the new custom section
export const VersionsSection = {
  name: 'versions',
  Tab: (props) => (
    <SectionTab name="Versions" {...props}>
      <VersionsIcon />
    </SectionTab>
  ),
  // We need observer to update component automatically on any store changes
  Panel: VersionsPanel,
};

