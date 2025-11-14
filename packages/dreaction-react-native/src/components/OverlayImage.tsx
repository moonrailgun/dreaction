import React, { useEffect, useState } from 'react';
import { Image, Dimensions, View } from 'react-native';
import { emitter } from '../plugins/overlay';

export const OverlayImage: React.FC = React.memo(() => {
  const [uri, setUri] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.5);

  useEffect(() => {
    const handler = (payload: any) => {
      setUri(payload.uri);
      if (payload.opacity !== undefined) {
        setOpacity(payload.opacity);
      }
    };

    emitter.on('overlay', handler);

    return () => {
      emitter.off('overlay', handler);
    };
  }, []);

  if (!uri) {
    return null;
  }

  const { width, height } = Dimensions.get('window');

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
      }}
    >
      <Image
        source={{ uri: uri }}
        resizeMode="contain"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: width,
          height: height,
          opacity: opacity,
        }}
      />
    </View>
  );
});
OverlayImage.displayName = 'OverlayImage';
