import React, { useState, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';
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

  // Escapeキーでキャンセル
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

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

  const handleRemoveLabel = () => {
    onSave(''); // Empty string removes the label
  };

  // ノード編集と同じアプローチで、Konvaコンポーネントで直接実装
  const editorWidth = 380; // 4列に対応するため幅を拡大
  const editorHeight = 120; // 2行に収まるよう高さを調整
  const buttonHeight = 28;
  const buttonWidth = 88; // 4列に収まるよう幅を調整
  const spacing = 4;

  // キャンバスの境界内に収まるように位置を調整
  const adjustedX = Math.max(10, Math.min(position.x - editorWidth / 2, window.innerWidth - editorWidth - 310));
  const adjustedY = Math.max(10, Math.min(position.y - editorHeight / 2, window.innerHeight - editorHeight - 60));

  return (
    <Group
      x={adjustedX}
      y={adjustedY}
    >
      {/* Background */}
      <Rect
        width={editorWidth}
        height={editorHeight}
        fill="white"
        stroke="#dee2e6"
        strokeWidth={1}
        shadowBlur={10}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowOffsetY={2}
        cornerRadius={8}
      />

      {/* Title */}
      <Text
        text="接続ラベルを選択"
        x={10}
        y={10}
        width={editorWidth - 20}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fill="#495057"
        align="center"
      />

      {/* Preset buttons */}
      {RELATION_LABELS.map((label, index) => {
        const row = Math.floor(index / 4); // 4列2行レイアウト
        const col = index % 4;
        const x = 10 + col * (buttonWidth + spacing);
        const y = 35 + row * (buttonHeight + spacing);
        const isSelected = selectedPreset === label;

        return (
          <Group key={label}>
            <Rect
              x={x}
              y={y}
              width={buttonWidth}
              height={buttonHeight}
              fill={isSelected ? '#007bff' : '#f8f9fa'}
              stroke={isSelected ? '#0056b3' : '#dee2e6'}
              strokeWidth={1}
              cornerRadius={4}
              onClick={() => handlePresetClick(label)}
              onTap={() => handlePresetClick(label)}
              style={{ cursor: 'pointer' }}
            />
            <Text
              text={label}
              x={x}
              y={y}
              width={buttonWidth}
              height={buttonHeight}
              fontSize={12}
              fontFamily="Arial, sans-serif"
              fill={isSelected ? '#ffffff' : '#212529'}
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          </Group>
        );
      })}

      {/* Bottom buttons area */}
      {/* Remove button - left side */}
      <Group>
        <Rect
          x={10}
          y={editorHeight - 32}
          width={75}
          height={24}
          fill="#dc3545"
          stroke="#bd2130"
          strokeWidth={1}
          cornerRadius={4}
          onClick={handleRemoveLabel}
          onTap={handleRemoveLabel}
          style={{ cursor: 'pointer' }}
        />
        <Text
          text="削除"
          x={10}
          y={editorHeight - 32}
          width={75}
          height={24}
          fontSize={12}
          fontFamily="Arial, sans-serif"
          fill="#ffffff"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </Group>

      {/* Cancel button - right side */}
      <Group>
        <Rect
          x={editorWidth - 85}
          y={editorHeight - 32}
          width={75}
          height={24}
          fill="#6c757d"
          stroke="#5a6268"
          strokeWidth={1}
          cornerRadius={4}
          onClick={onCancel}
          onTap={onCancel}
          style={{ cursor: 'pointer' }}
        />
        <Text
          text="キャンセル"
          x={editorWidth - 85}
          y={editorHeight - 32}
          width={75}
          height={24}
          fontSize={12}
          fontFamily="Arial, sans-serif"
          fill="#ffffff"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </Group>
    </Group>
  );
};