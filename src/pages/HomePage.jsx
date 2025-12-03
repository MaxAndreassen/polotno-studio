import React from 'react';
import { Link } from 'react-router-dom';
import { Spinner, Card } from '@blueprintjs/core';
import * as api from '../api';
import { createStore } from 'polotno/model/store';
import { previewTemplateVariables } from '../utils/batchProcessor';
import {
  TRADING_CARD_WIDTH,
  TRADING_CARD_HEIGHT,
  TRADING_CARD_DPI,
} from '../constants';

const HomePage = () => {
  const [designs, setDesigns] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [designVariables, setDesignVariables] = React.useState({});
  const [previewUrls, setPreviewUrls] = React.useState({});

  // Create a temporary store for analyzing templates
  const tempStore = React.useMemo(() => {
    const store = createStore({
      key: 'nFA5H9elEytDyPyvKL7T',
      dpi: TRADING_CARD_DPI,
    });
    // Initialize with a page
    store.addPage({
      width: TRADING_CARD_WIDTH,
      height: TRADING_CARD_HEIGHT,
    });
    return store;
  }, []);

  // Load designs and analyze them
  React.useEffect(() => {
    const loadDesigns = async () => {
      setLoading(true);
      try {
        // Get list of designs
        const designList = await api.listDesigns();
        setDesigns(designList);

        // Load preview URLs and analyze variables for each design
        const variablesMap = {};
        const previewMap = {};

        for (const design of designList) {
          try {
            // Load preview image
            const previewUrl = await api.getPreview({ id: design.id });
            previewMap[design.id] = previewUrl;

            // Load design JSON to analyze variables
            const { storeJSON } = await api.loadById({ id: design.id });
            
            // Analyze template variables
            const preview = previewTemplateVariables(tempStore, storeJSON);
            variablesMap[design.id] = preview.variableNames || [];
          } catch (error) {
            console.error(`Error loading design ${design.id}:`, error);
            variablesMap[design.id] = [];
            previewMap[design.id] = null;
          }
        }

        setDesignVariables(variablesMap);
        setPreviewUrls(previewMap);
      } catch (error) {
        console.error('Error loading designs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDesigns();
  }, [tempStore]);

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '3rem',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            marginBottom: '1rem',
            color: '#333',
          }}
        >
          Welcome to Asset Kitchen
        </h1>
        <p
          style={{
            fontSize: '1.2rem',
            marginBottom: '2rem',
            color: '#666',
          }}
        >
          Create beautiful card designs with our powerful design tool.
        </p>
        <Link
          to="/studio"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            backgroundColor: '#137cbd',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '1.1rem',
            fontWeight: '500',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#106ba3';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#137cbd';
          }}
        >
          Open Design Studio
        </Link>
      </div>

      {/* Designs Section */}
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '1.8rem',
            marginBottom: '1.5rem',
            color: '#333',
          }}
        >
          Your Designs
        </h2>

        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4rem',
            }}
          >
            <Spinner size={50} />
          </div>
        ) : designs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem',
              color: '#666',
            }}
          >
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              No designs yet
            </p>
            <p>Create your first design in the studio!</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            {designs.map((design) => {
              const variables = designVariables[design.id] || [];
              const previewUrl = previewUrls[design.id];

              return (
                <Card
                  key={design.id}
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Design Preview */}
                  {previewUrl ? (
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '3/4',
                        marginBottom: '1rem',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                        width: '100%',
                        aspectRatio: '3/4',
                        marginBottom: '1rem',
                        borderRadius: '4px',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                      }}
                    >
                      No preview
                    </div>
                  )}

                  {/* Design Name */}
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      marginBottom: '0.5rem',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    {design.name || 'Untitled Design'}
                  </h3>

                  {/* Changeable Variables */}
                  <div style={{ marginTop: 'auto' }}>
                    {variables.length > 0 ? (
                      <>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: '#666',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                          }}
                        >
                          Changeable Variables:
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          {variables.map((variable) => (
                            <span
                              key={variable}
                              style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#e7f3ff',
                                color: '#137cbd',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                              }}
                            >
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#999',
                          fontStyle: 'italic',
                        }}
                      >
                        No changeable variables (static design)
                      </p>
                    )}
                  </div>

                  {/* Open in Studio Link */}
                  <Link
                    to={`/studio?design=${design.id}`}
                    style={{
                      display: 'block',
                      marginTop: '1rem',
                      padding: '0.5rem',
                      textAlign: 'center',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e0e0e0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f0f0f0';
                    }}
                  >
                    Open in Studio
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
