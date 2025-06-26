import React, { useState, useRef } from 'react';
import { Upload, X, Camera, User } from 'lucide-react';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageData: string | null) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  className = '',
  size = 'md',
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create a canvas to resize the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 400x400)
        const maxSize = 400;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress the image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const base64Data = canvas.toDataURL('image/jpeg', 0.8);
        onImageChange(base64Data);
        setIsUploading(false);
      };

      img.onerror = () => {
        alert('Failed to process image');
        setIsUploading(false);
      };

      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image');
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} relative cursor-pointer overflow-hidden rounded-full border-2 transition-all duration-200
          ${dragOver ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-blue-400 dark:hover:border-blue-500'}
          ${currentImage ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}
        `}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isUploading ? (
          <div className="flex h-full w-full items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        ) : currentImage ? (
          <>
            <img
              src={currentImage}
              alt="Profile"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-200 hover:bg-opacity-50">
              <Camera size={iconSizes[size]} className="text-white opacity-0 transition-opacity duration-200 hover:opacity-100" />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <User size={iconSizes[size]} className="mb-1" />
            <Upload size={iconSizes[size] - 4} />
          </div>
        )}
      </div>

      {currentImage && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveImage();
          }}
          className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white shadow-md transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
          title="Remove image"
        >
          <X size={12} />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {!currentImage && (
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          Click to upload or drag & drop
          <br />
          Max 5MB, JPG/PNG
        </p>
      )}
    </div>
  );
};

export default ImageUpload;