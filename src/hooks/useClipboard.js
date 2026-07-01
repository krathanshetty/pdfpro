import { useEffect } from 'react';

export const useClipboard = (onImagePasted) => {
  useEffect(() => {
    const handlePaste = async (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const files = [];
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const file = item.getAsFile();
          if (file) {
            // Give pasted files a name if they don't have one (clipboard files are usually named 'image.png')
            const fileWithUniqueName = new File([file], `Pasted Image - ${new Date().toLocaleTimeString()}.png`, {
              type: file.type,
            });
            files.push(fileWithUniqueName);
          }
        }
      }

      if (files.length > 0) {
        event.preventDefault();
        onImagePasted(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onImagePasted]);
};
