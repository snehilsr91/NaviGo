import React, { useState } from 'react';
import { addCustomLabel } from '../../utils/customDetections';
import './CustomLabelForm.css';

/**
 * Component for adding custom labels to detected objects
 */
const CustomLabelForm = ({ onClose }) => {
  const [objectClass, setObjectClass] = useState('person');
  const [customLabel, setCustomLabel] = useState('');
  const [message, setMessage] = useState('');

  // Common object classes from COCO-SSD
  const commonClasses = [
    'person',
    'laptop',
    'cell phone',
    'backpack',
    'bottle',
    'cup',
    'chair',
    'bicycle',
    'car',
    'bus'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!customLabel.trim()) {
      setMessage('Please enter a custom label');
      return;
    }
    
    // Add the custom label
    addCustomLabel(objectClass, customLabel);
    
    // Show success message
    setMessage(`Successfully added "${customLabel}" as a custom label for "${objectClass}"`);
    
    // Reset form
    setCustomLabel('');
    
    // Close after a delay
    setTimeout(() => {
      if (onClose) onClose();
    }, 1500);
  };

  return (
    <div className="custom-label-form">
      <h3>Add Custom Label</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="objectClass">Object Type:</label>
          <select 
            id="objectClass"
            value={objectClass}
            onChange={(e) => setObjectClass(e.target.value)}
          >
            {commonClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="customLabel">Custom Label:</label>
          <input
            id="customLabel"
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Enter custom label (e.g., Your Name)"
          />
        </div>
        
        {message && <div className="message">{message}</div>}
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">Save</button>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CustomLabelForm;