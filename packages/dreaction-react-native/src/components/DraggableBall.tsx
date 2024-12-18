import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { ConfigDialog } from './ConfigDialog';
import { dreaction } from '../dreaction';
import { getHostFromUrl } from '../helpers/parseURL';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BALL_SIZE = 60;
const CLICK_THRESHOLD = 5;

const initialPosition = {
  x: SCREEN_WIDTH - BALL_SIZE,
  y: SCREEN_HEIGHT - BALL_SIZE - 100,
};

export const DraggableBall: React.FC = React.memo(() => {
  const position = useRef(new Animated.ValueXY(initialPosition)).current;
  const lastPosition = useRef(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsReady(dreaction.isReady);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleClick = (value: string) => {
    try {
      const host = getHostFromUrl(value);

      dreaction
        .configure({
          host,
        })
        .close()
        .connect();

      setModalVisible(false);
    } catch (e) {
      Alert.alert('Connected Failed', 'Please check your url');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        position.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // 使用 lastPosition 计算位置
        position.setValue({
          x: lastPosition.current.x + gestureState.dx,
          y: lastPosition.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);

        lastPosition.current = {
          x: lastPosition.current.x + gestureState.dx,
          y: lastPosition.current.y + gestureState.dy,
        };

        if (
          Math.abs(gestureState.dx) < CLICK_THRESHOLD &&
          Math.abs(gestureState.dy) < CLICK_THRESHOLD
        ) {
          setModalVisible(true);
          return;
        }

        const { moveX, moveY } = gestureState;

        // Calculate adsorption to the nearest edge
        let newX = moveX <= SCREEN_WIDTH / 2 ? 0 : SCREEN_WIDTH - BALL_SIZE; // Adsorb to the left or right
        let newY = Math.min(
          Math.max(moveY, 0), // Limit the top boundary
          SCREEN_HEIGHT - BALL_SIZE // Limit the bottom boundary
        );

        // Animation
        Animated.spring(position, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          friction: 5,
        }).start(() => {
          lastPosition.current = { x: newX, y: newY };
        });
      },
    })
  ).current;

  return (
    <>
      <Animated.View
        style={[
          styles.ball,
          {
            transform: [{ translateX: position.x }, { translateY: position.y }],
            backgroundColor: isDragging ? '#eee' : '#fff',
            borderColor: isReady ? '#00ff00' : '#eee',
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Image style={styles.icon} source={require('../../assets/icon.png')} />
      </Animated.View>

      <ConfigDialog
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleClick}
      />
    </>
  );
});
DraggableBall.displayName = 'DraggableBall';

const styles = StyleSheet.create({
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  icon: {
    width: BALL_SIZE * 0.8,
    height: BALL_SIZE * 0.8,
  },
});
