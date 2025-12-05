import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDReactionServerContext } from '../context/DReaction';
import { Button, ActionIcon, Slider } from '@mantine/core';
import {
  IconUpload,
  IconRefresh,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconArrowsHorizontal,
  IconArrowsVertical,
} from '@tabler/icons-react';
import { useDebounceFn } from 'ahooks';

interface ConnectionWithScreen {
  windowWidth?: number;
  windowHeight?: number;
  screenWidth?: number;
  screenHeight?: number;
  windowScale?: number;
  screenScale?: number;
}

export const DeviceOverlay: React.FC = React.memo(() => {
  const { selectedConnection, sendCommand } = useDReactionServerContext();
  const connection = selectedConnection as unknown as ConnectionWithScreen;
  const windowWidth = connection?.windowWidth;
  const windowHeight = connection?.windowHeight;
  const screenWidth = connection?.screenWidth;
  const screenHeight = connection?.screenHeight;
  const windowScale = connection?.windowScale;
  const screenScale = connection?.screenScale;

  const width = windowWidth || screenWidth;
  const height = windowHeight || screenHeight;
  const pixelRatio = windowScale || screenScale || 1;

  // State management
  const [image, setImage] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastImageRef = useRef<string | null>(null);

  // Calculate frame size (maintain aspect ratio, fit in container)
  const calculateFrameSize = useCallback(() => {
    if (!width || !height) return { width: 0, height: 0 };

    const containerWidth = window.innerWidth - 150;
    const containerHeight = window.innerHeight - 250;
    const aspectRatio = width / height;

    let frameWidth = containerWidth;
    let frameHeight = containerWidth / aspectRatio;

    if (frameHeight > containerHeight) {
      frameHeight = containerHeight;
      frameWidth = containerHeight * aspectRatio;
    }

    return { width: frameWidth, height: frameHeight };
  }, [width, height]);

  const frameSize = calculateFrameSize();
  const frameWidth = frameSize.width;
  const frameHeight = frameSize.height;

  // Crop and send image to device
  const _cropAndSendImage = useCallback(() => {
    if (!image || !canvasRef.current || !imageRef.current || !width || !height)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use device pixel ratio to ensure high quality rendering
    const dpr = window.devicePixelRatio || 1;

    // Canvas size should match frameSize but with DPR for high quality
    canvas.width = frameSize.width * dpr;
    canvas.height = frameSize.height * dpr;

    // Scale context to match DPR
    ctx.scale(dpr, dpr);

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, frameSize.width, frameSize.height);

    // Draw the image exactly as it appears in the edit area
    // The edit area shows: transform: translate(position.x, position.y) scale(scale)
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.scale(scale, scale);
    ctx.drawImage(imageRef.current, 0, 0);
    ctx.restore();

    // This canvas now exactly matches what's shown in edit area with high DPI quality
    // Now create the device-sized version with higher quality
    const deviceCanvas = document.createElement('canvas');
    const deviceCtx = deviceCanvas.getContext('2d');
    if (!deviceCtx) return;

    // Set device canvas to physical size with output scale for higher quality
    const physicalWidth = width * pixelRatio;
    const physicalHeight = height * pixelRatio;
    deviceCanvas.width = physicalWidth;
    deviceCanvas.height = physicalHeight;

    // Fill with white background
    deviceCtx.fillStyle = '#ffffff';
    deviceCtx.fillRect(0, 0, physicalWidth, physicalHeight);

    // Enable high quality image scaling
    deviceCtx.imageSmoothingEnabled = true;
    deviceCtx.imageSmoothingQuality = 'high';

    // Calculate the scale factor from frame to device
    const scaleX = physicalWidth / frameSize.width;
    const scaleY = physicalHeight / frameSize.height;

    // Draw the original image directly on device canvas with transformations
    // This preserves the original image quality better than scaling a smaller canvas
    deviceCtx.save();
    deviceCtx.translate(position.x * scaleX, position.y * scaleY);
    deviceCtx.scale(scale * scaleX, scale * scaleY);
    deviceCtx.drawImage(imageRef.current, 0, 0);
    deviceCtx.restore();

    // Convert to base64 with quality settings
    const previewData = canvas.toDataURL('image/png');
    const deviceData = deviceCanvas.toDataURL('image/png');

    // Update preview (show the frame-sized version for accurate preview)
    setPreviewImage(previewData);

    // Send device-sized version to device
    sendCommand('overlay', { uri: deviceData, opacity });
  }, [
    image,
    position,
    scale,
    opacity,
    width,
    height,
    frameSize,
    pixelRatio,
    sendCommand,
  ]);

  const { run: cropAndSendImage } = useDebounceFn(_cropAndSendImage, {
    wait: 1000,
  });

  const syncAfterTransform = useCallback(() => {
    requestAnimationFrame(() => {
      cropAndSendImage();
    });
  }, [cropAndSendImage]);

  // Handle file upload
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setImage(event.target?.result as string);
          setPosition({ x: 0, y: 0 });
          setScale(1);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Handle paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (!blob) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            setImageSize({ width: img.width, height: img.height });
            setImage(event.target?.result as string);
            setPosition({ x: 0, y: 0 });
            setScale(1);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  }, []);

  // Handle mouse down (start drag)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!image) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [image, position]
  );

  // Handle mouse move (dragging)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
      cropAndSendImage();
    },
    [isDragging, dragStart, cropAndSendImage]
  );

  // Handle mouse up (end drag)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle wheel (zoom)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!image) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.max(0.1, Math.min(5, prev + delta)));
      cropAndSendImage();
    },
    [image, cropAndSendImage]
  );

  // Handle reset
  const handleReset = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setOpacity(0.5);
    if (image) {
      cropAndSendImage();
    }
  }, [image, cropAndSendImage]);

  // Handle clear
  const handleClear = useCallback(() => {
    setImage(null);
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setOpacity(0.5);
    setImageSize({ width: 0, height: 0 });
    setPreviewImage(null);
    lastImageRef.current = null;
    sendCommand('overlay', { uri: '' });
  }, [sendCommand]);

  const handleFitToFrame = useCallback(
    (dimension: 'width' | 'height') => {
      if (!image) return;
      const sourceSize =
        dimension === 'width' ? imageSize.width : imageSize.height;
      const targetSize = dimension === 'width' ? frameWidth : frameHeight;
      if (!sourceSize || !targetSize) return;

      const newScale = targetSize / sourceSize;
      if (!Number.isFinite(newScale) || newScale <= 0) return;

      setPosition({ x: 0, y: 0 });
      setScale(newScale);
      syncAfterTransform();
    },
    [
      frameHeight,
      frameWidth,
      image,
      imageSize.height,
      imageSize.width,
      syncAfterTransform,
    ]
  );

  const handleMatchWidth = useCallback(
    () => handleFitToFrame('width'),
    [handleFitToFrame]
  );

  const handleMatchHeight = useCallback(
    () => handleFitToFrame('height'),
    [handleFitToFrame]
  );

  // Auto send image when loaded
  useEffect(() => {
    if (
      image &&
      imageSize.width > 0 &&
      imageSize.height > 0 &&
      image !== lastImageRef.current
    ) {
      lastImageRef.current = image;
      // Use setTimeout to ensure refs are updated
      setTimeout(() => {
        _cropAndSendImage();
      }, 100);
    }
  }, [image, imageSize, _cropAndSendImage]);

  // Setup event listeners
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handlePaste, handleMouseMove, handleMouseUp]);

  if (!width || !height) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-600">
          No device screen info
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-8">
      <canvas ref={canvasRef} className="hidden" />

      {/* Control buttons */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            leftSection={<IconUpload size={16} />}
            size="sm"
            variant="default"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            size="sm"
            variant="default"
            onClick={handleReset}
            disabled={!image}
          >
            Reset
          </Button>
          <ActionIcon
            size="lg"
            variant="default"
            onClick={handleClear}
            disabled={!image}
          >
            <IconTrash size={16} />
          </ActionIcon>
          <div className="flex-1" />
          <Button
            leftSection={
              showPreview ? <IconEyeOff size={16} /> : <IconEye size={16} />
            }
            size="sm"
            variant={showPreview ? 'filled' : 'default'}
            onClick={() => setShowPreview(!showPreview)}
            disabled={!previewImage}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
        {image && (
          <div className="flex flex-wrap gap-3 items-center mb-2 justify-between">
            <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[250px]">
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[70px]">
                Opacity:
              </span>
              <Slider
                className="flex-1 min-w-[150px]"
                value={opacity}
                onChange={(value) => {
                  setOpacity(value);
                  cropAndSendImage();
                }}
                min={0}
                max={1}
                step={0.05}
                label={(value) => `${(value * 100).toFixed(0)}%`}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' },
                ]}
              />
              <span className="text-sm text-gray-500 dark:text-gray-600 min-w-[40px]">
                {(opacity * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex flex-nowrap gap-2">
              <Button size="sm" variant="light" onClick={handleMatchWidth}>
                <IconArrowsHorizontal size={16} />
              </Button>
              <Button size="sm" variant="light" onClick={handleMatchHeight}>
                <IconArrowsVertical size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main content area - horizontal layout */}
      <div className="flex-1 flex gap-6 items-center justify-center overflow-auto">
        {/* Device frame - Edit area */}
        <div className="flex flex-col items-center">
          <div
            ref={frameRef}
            className="relative border-4 border-gold-500 dark:border-gold-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 box-content"
            style={{
              width: `${frameSize.width}px`,
              height: `${frameSize.height}px`,
              cursor: image ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
          >
            {!image && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400 dark:text-gray-600">
                  <p className="text-lg font-medium">No image loaded</p>
                  <p className="text-sm mt-2">
                    Upload or paste an image to start
                  </p>
                </div>
              </div>
            )}

            {image && (
              <img
                ref={imageRef}
                src={image}
                alt="Overlay"
                className="absolute pointer-events-none select-none"
                style={{
                  width: `${imageSize.width}px`,
                  height: `${imageSize.height}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'top left',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  opacity: opacity,
                }}
                draggable={false}
              />
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-600 text-center">
            Edit Area
          </div>
        </div>

        {/* Preview area */}
        {previewImage && showPreview && (
          <div className="flex flex-col items-center">
            <div
              className="relative border-4 border-blue-500 dark:border-blue-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
              style={{
                width: `${frameSize.width}px`,
                height: `${frameSize.height}px`,
              }}
            >
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-600 text-center">
              Device Preview
            </div>
          </div>
        )}
      </div>

      {/* Display info */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-600 text-center">
        Device: {width} × {height}px (×{pixelRatio}) | Scale:{' '}
        {(scale * 100).toFixed(0)}%
        {image &&
          ` | Position: (${Math.round(position.x)}, ${Math.round(position.y)})`}
      </div>

      <div className="text-center">
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-600">
          Paste image with Ctrl/Cmd+V
        </span>
        {image && (
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-600">
            | Drag to move, scroll to zoom
          </span>
        )}
      </div>
    </div>
  );
});
DeviceOverlay.displayName = 'DeviceOverlay';
