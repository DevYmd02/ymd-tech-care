import React from 'react';
import { useWindowManager } from '@/shared/hooks/useWindowManager';
import { RFQFormModal } from '@/modules/procurement/pages/rfq/components/RFQFormModal';
import { PRFormModal } from '@/modules/procurement/pages/pr/components/PRFormModal';

export const WindowManager: React.FC = () => {
  const { windows, closeWindow } = useWindowManager();

  return (
    <>
      <RFQFormModal
        isOpen={windows.RFQ.isOpen}
        onClose={() => closeWindow('RFQ')}
        {...windows.RFQ.props}
      />
      
      <PRFormModal
        isOpen={windows.PR.isOpen}
        onClose={() => closeWindow('PR')}
        {...windows.PR.props}
      />
    </>
  );
};
