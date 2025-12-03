import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '600px',
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
    </div>
  );
};

export default HomePage;

