import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

 const AlertBox = ({ open, title, description, onOk, onClose }: MyAlertProps) => {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {description}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Disagree</Button>
          <Button onClick={onOk} autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  interface MyAlertProps {
    open: boolean;
    title: string;
    description: string;
    onOk: () => void;
    onClose: () => void;
  }


  export default AlertBox