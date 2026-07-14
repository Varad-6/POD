import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadBoxProps {
  onFileSelect: (fileName: string, fileObject: File | null) => void;
  selectedFileName: string | null;
  onClear: () => void;
}

export const FileUploadBox: React.FC<FileUploadBoxProps> = ({ onFileSelect, selectedFileName, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Generate size string
    const sizeInMB = file.size / (1024 * 1024);
    const sizeStr = sizeInMB < 0.1 
      ? `${(file.size / 1024).toFixed(1)} KB` 
      : `${sizeInMB.toFixed(2)} MB`;
    
    setFileSizeStr(sizeStr);
    onFileSelect(file.name, file);

    // Create object URL for preview if it's an image
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    setFileSizeStr('');
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const boxStyle: React.CSSProperties = {
    border: '2px dashed var(--border-grey)',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: isDragOver ? 'var(--secondary-bg)' : '#ffffff',
    transition: 'all 0.15s ease',
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {!selectedFileName ? (
        <div 
          style={boxStyle} 
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-grey)'}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
            accept=".jpg,.jpeg,.png,.pdf"
          />
          <Upload size={32} style={{ color: 'var(--primary-color)', marginBottom: '12px' }} />
          <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Click to upload or drag and drop</p>
          <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)' }}>JPG, PNG or PDF (max 10MB)</p>
        </div>
      ) : (
        <div 
          style={{
            border: '1px solid var(--border-grey)',
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {filePreviewUrl ? (
              <img 
                src={filePreviewUrl} 
                alt="Upload Preview" 
                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-grey)' }}
              />
            ) : (
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'var(--secondary-bg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '6px',
                  color: 'var(--primary-color)'
                }}
              >
                <FileText size={20} />
              </div>
            )}
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFileName}
              </p>
              {fileSizeStr && (
                <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)' }}>
                  {fileSizeStr}
                </p>
              )}
            </div>
          </div>

          <button 
            onClick={handleRemove}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--error-text)',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(198, 40, 40, 0.05)'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
