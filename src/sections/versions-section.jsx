import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  InputGroup,
  HTMLTable,
  Spinner,
  Icon,
} from '@blueprintjs/core';
import { Trash, Download, Plus } from '@blueprintjs/icons';
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

    // Load saved versions
    const savedVersions = loadVersions(currentId);
    setVersions(savedVersions);
  }, [store, project?.id]);

  // Save versions whenever they change
  React.useEffect(() => {
    if (designId && versions.length > 0) {
      saveVersions(designId, versions);
    }
  }, [versions, designId]);

  const addVersion = () => {
    const newVersion = {};
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

      // Generate filename from version data
      const filename = Object.values(versionData)
        .filter((v) => v)
        .slice(0, 3)
        .join('-')
        .replace(/[^a-z0-9-]/gi, '-')
        .toLowerCase() || `version-${index + 1}`;

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

      for (let i = 0; i < versions.length; i++) {
        const versionData = versions[i];
        try {
          // Generate card with version data
          generateCard(store, templateJson, versionData);

          const filename = Object.values(versionData)
            .filter((v) => v)
            .slice(0, 3)
            .join('-')
            .replace(/[^a-z0-9-]/gi, '-')
            .toLowerCase() || `version-${i + 1}`;

          // Download as PNG image
          await store.saveAsImage({
            pageId: store.activePage.id,
            pixelRatio: 1,
            mimeType: 'image/png',
            fileName: `${filename}.png`,
          });

          // Small delay to prevent browser blocking multiple downloads
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error downloading version ${i + 1}:`, error);
        }
      }

      // Restore original design
      store.loadJSON(currentDesign);
    } catch (error) {
      console.error('Error downloading all versions:', error);
      alert('Failed to download some versions. Please try again.');
    } finally {
      setLoading(false);
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
                        icon={<Download />}
                        onClick={() => downloadVersion(index)}
                        small
                        minimal
                        loading={downloading[index]}
                        disabled={downloading[index]}
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
                            deleteVersion(index);
                          }
                        }}
                        small
                        minimal
                        intent="danger"
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

