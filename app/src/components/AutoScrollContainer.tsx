import React, { useEffect, useRef } from 'react';

const AutoScrollContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  enabled?: boolean;
}> = ({ children, className, style, enabled = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);

  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (containerRef.current && enabled && lockRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // 监听容器高度变化
  useEffect(() => {
    const observer = new MutationObserver(() => {
      scrollToBottom();
    });

    const ref = containerRef.current;
    if (ref) {
      observer.observe(ref, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    if (
      e.currentTarget.scrollTop + e.currentTarget.clientHeight >=
      e.currentTarget.scrollHeight - 200
    ) {
      lockRef.current = true;
    } else {
      lockRef.current = false;
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overflowY: 'auto', ...style }}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
};

export default AutoScrollContainer;
