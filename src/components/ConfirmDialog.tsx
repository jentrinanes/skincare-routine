import Modal from './Modal';
import Btn from './Btn';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  danger?: boolean;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, danger }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">{description}</p>
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
          Confirm
        </Btn>
      </div>
    </Modal>
  );
}
