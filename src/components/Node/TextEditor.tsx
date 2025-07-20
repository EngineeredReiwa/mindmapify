import React, { useEffect, useRef } from 'react';
// import { Html } from 'react-konva-utils';  // TEMPORARILY DISABLED
import type { Node } from '../../types';

interface TextEditorProps {
  node: Node;
  onSave: (text: string) => void;
  onCancel: () => void;
  onChange?: (text: string) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ node }) => {
  // const [text, setText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 垂直中央配置のためのパディング計算
  const verticalPadding = Math.max(0, (node.size.height - 16 - 14) / 2); // (高さ - パディング - フォントサイズ) / 2

  useEffect(() => {
    // Focus textarea when editor becomes active
    console.log('TextEditor mounted, node size:', node.size);
    console.log('Calculated positions:', {
      top: 8,
      left: 8,
      width: node.size.width - 16,
      height: node.size.height - 16,
      verticalPadding
    });
    
    if (textareaRef.current) {
      console.log('TextEditor element size:', {
        offsetWidth: textareaRef.current.offsetWidth,
        offsetHeight: textareaRef.current.offsetHeight
      });
      
      // フォーカスを少し遅らせて確実に設定
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select(); // Select all text for easy editing
          console.log('TextEditor focused and selected');
        }
      }, 10);
    }
  }, []);

  // const handleKeyDown = (e: React.KeyboardEvent) => {
  //   e.stopPropagation(); // Prevent event bubbling to canvas
  //   
  //   if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
  //     // Ctrl+Enter or Cmd+Enter saves the text
  //     handleSave();
  //   } else if (e.key === 'Escape') {
  //     handleCancel();
  //   }
  // };

  // const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   const newText = e.target.value;
  //   setText(newText);
  //   onChange?.(newText); // リアルタイム更新
  // };

  // const handleSave = () => {
  //   const trimmedText = text.trim();
  //   if (trimmedText.length > 0) {
  //     onSave(trimmedText);
  //   } else {
  //     // If empty, revert to original text
  //     onCancel();
  //   }
  // };

  // const handleCancel = () => {
  //   setText(node.text); // Reset to original text
  //   onCancel();
  // };

  // const handleBlur = () => {
  //   // Save on blur (clicking outside)
  //   handleSave();
  // };

  // TEMPORARILY RETURN NULL TO TEST
  return null;
};