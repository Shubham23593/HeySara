import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { UploadCloud, X } from 'lucide-react';

const ImageUpload = ({ onImageUpload, initialImage = null }) => {
  const [preview, setPreview] = useState(initialImage);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(initialImage);
  }, [initialImage]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onImageUpload(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setPreview(null);
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      {preview ? (
        <div className="relative w-full aspect-video rounded-md overflow-hidden group">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <div 
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
          >
            <X size={16} />
          </div>
        </div>
      ) : (
        <div
          className="w-full aspect-video border-2 border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:border-primary hover:text-primary transition-colors"
          onClick={() => fileInputRef.current.click()}
        >
          <UploadCloud size={32} />
          <p className="mt-2 text-sm font-semibold">Click to upload</p>
          <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
        </div>
      )}
    </div>
  );
};

ImageUpload.propTypes = {
  onImageUpload: PropTypes.func.isRequired,
  initialImage: PropTypes.string,
};

export default ImageUpload;
