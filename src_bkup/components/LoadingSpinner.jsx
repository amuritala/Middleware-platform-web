import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
    return (
        <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading Techstack Banking Platform...</p>
        </div>
    );
};

export default LoadingSpinner;