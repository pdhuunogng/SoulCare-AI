import React from 'react';
import { RibbonIcon } from './RibbonIcon';

interface ChatbotOrbAvatarProps {
  size?: number | string;
  className?: string;
  isPulsing?: boolean;
  showBackground?: boolean;
}

/**
 * ChatbotOrbAvatar - Đồng bộ hoàn toàn với Logo quả cầu trong suốt màu trắng
 * trên nền xanh lá gradient rèn luyện thói quen của SoulCare.
 */
export const ChatbotOrbAvatar: React.FC<ChatbotOrbAvatarProps> = ({
  size = 28,
  className = '',
  isPulsing = false,
  showBackground = true,
}) => {
  return (
    <RibbonIcon
      size={size}
      className={className}
      isPulsing={isPulsing}
      showBackground={showBackground}
    />
  );
};
