import {
  Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle,
} from '@mui/material';

interface Props {
  open: boolean;
  employeeName: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeactivateModal({ open, employeeName, isLoading, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>Deactivate Employee</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to deactivate <strong>{employeeName}</strong>?{' '}
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Deactivate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
