import React, { useState } from 'react';
// import { Html } from 'react-konva-utils';  // TEMPORARILY DISABLED
import { RELATION_LABELS, type RelationLabel } from '../../types';
import type { Position } from '../../types';

interface ConnectionLabelEditorProps {
  position: Position;
  currentLabel?: string;
  onSave: (label: string) => void;
  onCancel: () => void;
}

export const ConnectionLabelEditor: React.FC<ConnectionLabelEditorProps> = ({
  position,
  currentLabel = '',
  onSave,
  onCancel,
}) => {
  const [customLabel, setCustomLabel] = useState(
    RELATION_LABELS.includes(currentLabel as RelationLabel) ? '' : currentLabel
  );
  const [selectedPreset, setSelectedPreset] = useState<string>(
    RELATION_LABELS.includes(currentLabel as RelationLabel) ? currentLabel : ''
  );

  const handlePresetClick = (label: string) => {
    setSelectedPreset(label);
    setCustomLabel('');
    onSave(label);
  };

  const handleCustomSave = () => {
    const finalLabel = customLabel.trim();
    if (finalLabel) {
      onSave(finalLabel);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleCustomSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleRemoveLabel = () => {
    onSave(''); // Empty string removes the label
  };

  // TEMPORARILY RETURN NULL TO TEST
  return null;
};