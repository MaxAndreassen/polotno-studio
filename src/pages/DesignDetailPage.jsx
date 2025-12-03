import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Spinner, Button, Card, InputGroup } from '@blueprintjs/core';
import { ArrowLeft, Edit, Plus, Trash } from '@blueprintjs/icons';
import { Workspace } from 'polotno/canvas/workspace';
import { PolotnoContainer, WorkspaceWrap } from 'polotno';
import * as api from '../api';
import { createStore } from 'polotno/model/store';
import { previewTemplateVariables, generateCard } from '../utils/batchProcessor';
import {
  TRADING_CARD_WIDTH,
  TRADING_CARD_HEIGHT,
  TRADING_CARD_DPI,
} from '../constants';

// Local storage key for version data (same as versions-section)
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

const DesignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [versions, setVersions] = React.useState([]);
  const [versionPreviews, setVersionPreviews] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [generatingPreviews, setGeneratingPreviews] = React.useState(false);
  const [variables, setVariables] = React.useState([]);
  const [editingNameIndex, setEditingNameIndex] = React.useState(null);
  const hasLoadedVersions = React.useRef(false);

  // Create a temporary store for generating version previews
  const tempStore = React.useMemo(() => {
    const store = createStore({
      key: 'nFA5H9elEytDyPyvKL7T',
      dpi: TRADING_CARD_DPI,
    });
    store.addPage({
      width: TRADING_CARD_WIDTH,
      height: TRADING_CARD_HEIGHT,
    });
    return store;
  }, []);

  // Ref for the hidden workspace container
  const hiddenWorkspaceRef = React.useRef(null);

  // Load design and versions
  React.useEffect(() => {
    // Reset the loaded flag when design ID changes
    hasLoadedVersions.current = false;
    
    const loadDesign = async () => {
      setLoading(true);
      try {
        // Load design data
        const { storeJSON, name } = await api.loadById({ id });
        setDesign({ id, name, storeJSON });

        // Load preview image
        try {
          const preview = await api.getPreview({ id });
          setPreviewUrl(preview);
        } catch (error) {
          console.error('Error loading preview:', error);
        }

        // Load versions from localStorage
        const savedVersions = loadVersions(id);
        console.log('DesignDetailPage: Loading versions for', id, 'Found:', savedVersions.length);
        const versionsWithNames = savedVersions.map((version, index) => {
          if (!version._name) {
            return { ...version, _name: `Version ${index + 1}` };
          }
          return version;
        });
        setVersions(versionsWithNames);
        hasLoadedVersions.current = true;

        // Get variables from the template
        if (storeJSON) {
          tempStore.loadJSON(storeJSON);
          const preview = previewTemplateVariables(tempStore, storeJSON);
          setVariables(preview.variableNames || []);
        }
      } catch (error) {
        console.error('Error loading design:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDesign();
    }
  }, [id]);

  // Generate previews for all versions
  React.useEffect(() => {
    const generateVersionPreviews = async () => {
      if (!design || !design.storeJSON || versions.length === 0) return;

      setGeneratingPreviews(true);
      const previews = {};

      try {
        // Wait a bit to ensure the hidden workspace is mounted
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Load the template into the temp store
        tempStore.loadJSON(design.storeJSON);

        // Get variables from the template
        const preview = previewTemplateVariables(tempStore, design.storeJSON);
        const variables = preview.variableNames || [];

        // Generate preview for each version
        for (let i = 0; i < versions.length; i++) {
          const versionData = versions[i];
          try {
            // Reload template for each version
            tempStore.loadJSON(design.storeJSON);

            // Generate card with version data
            generateCard(tempStore, design.storeJSON, versionData);

            // Wait a bit for the store to update
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Render to canvas and convert to data URL
            const canvas = await tempStore._toCanvas({
              pageId: tempStore.activePage.id,
              pixelRatio: 1,
            });

            const dataUrl = canvas.toDataURL('image/png');
            previews[i] = dataUrl;
          } catch (error) {
            console.error(`Error generating preview for version ${i + 1}:`, error);
          }
        }

        setVersionPreviews(previews);
      } catch (error) {
        console.error('Error generating version previews:', error);
      } finally {
        setGeneratingPreviews(false);
      }
    };

    if (design && versions.length > 0) {
      generateVersionPreviews();
    }
  }, [design, versions, tempStore]);

  // Save versions whenever they change
  // Only save if we have a valid design ID and versions array exists
  // Also only save after we've finished loading versions (prevents overwriting on initial load)
  React.useEffect(() => {
    if (id && Array.isArray(versions) && hasLoadedVersions.current) {
      console.log('DesignDetailPage: Saving versions for', id, 'Count:', versions.length);
      saveVersions(id, versions);
    }
  }, [versions, id]);

  // Version management functions
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
    if (window.confirm('Are you sure you want to delete this version?')) {
      const newVersions = versions.filter((_, i) => i !== index);
      setVersions(newVersions);
      // Clear all previews - they will be regenerated
      setVersionPreviews({});
    }
  };

  const updateVersionName = (index, name) => {
    const updated = [...versions];
    updated[index] = { ...updated[index], _name: name || `Version ${index + 1}` };
    setVersions(updated);
    setEditingNameIndex(null);
  };

  if (loading) {
    return (
      <div
        style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Spinner size={50} />
      </div>
    );
  }

  if (!design) {
    return (
      <div
        style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          padding: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Design not found</h2>
        <Link to="/" style={{ color: '#137cbd', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Hidden workspace for rendering previews */}
      <div
        ref={hiddenWorkspaceRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <PolotnoContainer>
          <WorkspaceWrap>
            <Workspace store={tempStore} />
          </WorkspaceWrap>
        </PolotnoContainer>
      </div>

      <div
        style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5f5f5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
      {/* Header with back button */}
      <div
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <Button
          icon={<ArrowLeft />}
          minimal
          small
          onClick={() => navigate('/')}
          text="Back"
        />
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1rem 1.5rem' }}>
        {/* Design Preview Section - Compact Horizontal Layout */}
        <Card
          style={{
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          {/* Design Preview - Smaller */}
          {previewUrl ? (
            <div
              style={{
                width: '120px',
                height: '160px',
                flexShrink: 0,
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#f0f0f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <img
                src={previewUrl}
                alt={design.name || 'Design'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '120px',
                height: '160px',
                flexShrink: 0,
                borderRadius: '4px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '0.85rem',
              }}
            >
              No preview
            </div>
          )}

          {/* Design Name and Button */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  margin: 0,
                  marginBottom: '0.25rem',
                  color: '#333',
                  fontWeight: '600',
                }}
              >
                {design.name || 'Untitled Design'}
              </h1>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                {versions.length} {versions.length === 1 ? 'version' : 'versions'}
              </p>
            </div>

            {/* Go to Editor Button */}
            <Link to={`/studio?design=${design.id}`} style={{ textDecoration: 'none' }}>
              <Button
                icon={<Edit />}
                intent="primary"
                text="Go to Editor"
              />
            </Link>
          </div>
        </Card>

        {/* Versions Section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                margin: 0,
                color: '#333',
                fontWeight: '600',
              }}
            >
              Versions
            </h2>
            {variables.length > 0 && (
              <Button
                icon={<Plus />}
                intent="primary"
                small
                text="Add Version"
                onClick={addVersion}
              />
            )}
          </div>

          {generatingPreviews && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '1rem',
              }}
            >
              <Spinner size={30} />
              <span style={{ marginLeft: '0.75rem', color: '#666', fontSize: '0.9rem' }}>
                Generating version previews...
              </span>
            </div>
          )}

          {versions.length === 0 ? (
            <Card
              style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: 'white',
                color: '#666',
              }}
            >
              <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                No versions yet
              </p>
              <p style={{ fontSize: '0.85rem', marginBottom: variables.length > 0 ? '1rem' : '0' }}>
                {variables.length > 0
                  ? 'Click "Add Version" above to create your first version, or create versions in the editor.'
                  : 'This design has no changeable variables. Add variables in the editor to create versions.'}
              </p>
              {variables.length > 0 && (
                <Button
                  icon={<Plus />}
                  intent="primary"
                  text="Add First Version"
                  onClick={addVersion}
                />
              )}
            </Card>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {versions.map((version, index) => {
                const preview = versionPreviews[index];
                const versionName = version._name || `Version ${index + 1}`;

                return (
                  <Card
                    key={index}
                    style={{
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* Delete Button */}
                    <Button
                      icon={<Trash />}
                      minimal
                      small
                      intent="danger"
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        zIndex: 10,
                        opacity: 0.7,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVersion(index);
                      }}
                      title="Delete version"
                    />

                    {/* Version Preview */}
                    {preview ? (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
                          marginBottom: '0.5rem',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          backgroundColor: '#f0f0f0',
                        }}
                      >
                        <img
                          src={preview}
                          alt={versionName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
                          marginBottom: '0.5rem',
                          borderRadius: '3px',
                          backgroundColor: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          fontSize: '0.75rem',
                        }}
                      >
                        {generatingPreviews ? (
                          <Spinner size={20} />
                        ) : (
                          'No preview'
                        )}
                      </div>
                    )}

                    {/* Version Name - Editable */}
                    {editingNameIndex === index ? (
                      <InputGroup
                        value={version._name || `Version ${index + 1}`}
                        onChange={(e) => {
                          const updated = [...versions];
                          updated[index] = { ...updated[index], _name: e.target.value };
                          setVersions(updated);
                        }}
                        onBlur={() => updateVersionName(index, versions[index]._name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateVersionName(index, versions[index]._name);
                          } else if (e.key === 'Escape') {
                            setEditingNameIndex(null);
                          }
                        }}
                        autoFocus
                        small
                        style={{ fontSize: '0.85rem', textAlign: 'center' }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: '0.85rem',
                          margin: 0,
                          color: '#333',
                          fontWeight: '600',
                          textAlign: 'center',
                          lineHeight: '1.2',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '2px',
                          transition: 'background-color 0.2s',
                        }}
                        onClick={() => setEditingNameIndex(index)}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f0f0f0';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                        title="Click to edit name"
                      >
                        {versionName}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default DesignDetailPage;

